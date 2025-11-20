// src/lib/middleware/rate-limiter.ts
import { NextRequest } from 'next/server'
import { logger } from '../logging/logger'
import { captureErrorSafe } from '../utils/error-utils'

interface RateLimitRecord {
  count: number;
  resetTime: number;
  firstRequest: number;
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  banThreshold?: number;
  banDuration?: number;
}

// Simple in-memory rate limiter (use Redis in production)
const rateLimitStore = new Map<string, RateLimitRecord>()
const banStore = new Map<string, number>() // IP -> ban expiration time

export function rateLimit(config: RateLimitConfig) {
  const {
    maxRequests = 10,
    windowMs = 60000,
    banThreshold = 100, // Ban after 100 violations
    banDuration = 3600000 // 1 hour ban
  } = config

  return async (req: NextRequest) => {
    try {
      const ip = getClientIP(req)
      const key = `${ip}:${req.url}`
      const now = Date.now()
      
      // Check if IP is banned
      const banExpiration = banStore.get(ip)
      if (banExpiration && banExpiration > now) {
        logger.warn('Blocked request from banned IP', {
          ip,
          url: req.url,
          banExpiration: new Date(banExpiration).toISOString(),
          userAgent: req.headers.get('user-agent')
        })
        
        return new Response(
          JSON.stringify({ 
            error: 'Too Many Requests', 
            message: 'Your IP has been temporarily banned due to excessive requests',
            retryAfter: Math.ceil((banExpiration - now) / 1000)
          }), 
          { 
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': Math.ceil((banExpiration - now) / 1000).toString()
            }
          }
        )
      }

      const record = rateLimitStore.get(key)
      
      if (record && record.resetTime > now) {
        // Within the rate limit window
        if (record.count >= maxRequests) {
          // Rate limit exceeded
          const violationCount = (record.count - maxRequests) + 1
          
          logger.warn('Rate limit exceeded', {
            ip,
            url: req.url,
            count: record.count,
            maxRequests,
            resetTime: new Date(record.resetTime).toISOString(),
            violationCount,
            userAgent: req.headers.get('user-agent')
          })
          
          // Check for ban condition
          if (violationCount >= banThreshold) {
            const banExpiration = now + banDuration
            banStore.set(ip, banExpiration)
            logger.error('IP banned due to excessive violations', {
              ip,
              violationCount,
              banDuration: `${banDuration}ms`,
              banExpiration: new Date(banExpiration).toISOString()
            })
          }
          
          return new Response(
            JSON.stringify({ 
              error: 'Too Many Requests', 
              message: 'Rate limit exceeded',
              retryAfter: Math.ceil((record.resetTime - now) / 1000)
            }), 
            { 
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'Retry-After': Math.ceil((record.resetTime - now) / 1000).toString()
              }
            }
          )
        }
        
        // Increment request count
        record.count++
        rateLimitStore.set(key, record)
        
        logger.debug('Request within rate limit', {
          ip,
          url: req.url,
          count: record.count,
          maxRequests,
          remaining: maxRequests - record.count
        })
      } else {
        // New window or expired window
        rateLimitStore.set(key, {
          count: 1,
          resetTime: now + windowMs,
          firstRequest: record?.firstRequest || now
        })
        
        logger.debug('New rate limit window started', {
          ip,
          url: req.url,
          resetTime: new Date(now + windowMs).toISOString(),
          windowMs
        })
      }
      
      // Clean up old records periodically
      if (Math.random() < 0.1) { // 10% chance to clean up
        cleanupRateLimitStore(now)
      }
      
      return null // No rate limit violation
    } catch (error: unknown) {
      const ip = 'unknown';
      captureErrorSafe(error, {
        action: 'rate_limit_check',
        url: req.url,
        ip: ip
      })
      
      logger.error('Rate limit check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        url: req.url,
        ip: ip
      })
      
      // Fail open - allow the request through if rate limiting fails
      return null
    }
  }
}

function getClientIP(req: NextRequest): string {
  // Check various headers for the client IP
  const xForwardedFor = req.headers.get('x-forwarded-for')
  if (xForwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return xForwardedFor.split(',')[0].trim()
  }
  
  const xRealIP = req.headers.get('x-real-ip')
  if (xRealIP) {
    return xRealIP
  }
  
  // Fallback to remote address (may not be available in all environments)
  return 'unknown'
}

function cleanupRateLimitStore(now: number) {
  try {
    // Clean up rate limit records
    for (const [key, record] of rateLimitStore.entries()) {
      if (record.resetTime < now) {
        rateLimitStore.delete(key)
      }
    }
    
    // Clean up ban records
    for (const [ip, banExpiration] of banStore.entries()) {
      if (banExpiration < now) {
        banStore.delete(ip)
      }
    }
    
    logger.debug('Rate limit store cleanup completed', {
      rateLimitStoreSize: rateLimitStore.size,
      banStoreSize: banStore.size
    })
  } catch (error: unknown) {
    captureErrorSafe(error, {
      action: 'rate_limit_cleanup'
    })
    
    logger.error('Rate limit store cleanup failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
  }
}

// Utility function to get current rate limit status for an IP
export function getRateLimitStatus(ip: string, url: string) {
  const key = `${ip}:${url}`
  const record = rateLimitStore.get(key)
  const now = Date.now()
  
  if (!record || record.resetTime < now) {
    return {
      remaining: 0,
      resetTime: 0,
      isRateLimited: false
    }
  }
  
  return {
    remaining: Math.max(0, record.count - 10), // Assuming default max of 10
    resetTime: record.resetTime,
    isRateLimited: record.count >= 10
  }
}

// Utility function to manually ban an IP
export function banIP(ip: string, durationMs: number = 3600000) {
  const banExpiration = Date.now() + durationMs
  banStore.set(ip, banExpiration)
  
  logger.info('IP manually banned', {
    ip,
    duration: `${durationMs}ms`,
    banExpiration: new Date(banExpiration).toISOString()
  })
}

// Utility function to unban an IP
export function unbanIP(ip: string) {
  const wasBanned = banStore.delete(ip)
  
  if (wasBanned) {
    logger.info('IP unbanned', { ip })
  }
  
  return wasBanned
}
