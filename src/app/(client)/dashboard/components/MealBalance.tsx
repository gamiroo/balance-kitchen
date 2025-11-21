// app/dashboard/components/MealBalance.tsx
"use client"

import { useState, useEffect } from "react"
import styles from "./MealBalance.module.css"
import { captureErrorSafe } from '@/shared/lib/utils/error-utils'
import { logger } from '@/shared/lib/logging/logger'

export default function MealBalance() {
  const [mealBalance, setMealBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMealBalance()
  }, [])

  const fetchMealBalance = async () => {
    try {
      logger.debug('Fetching user meal balance')
      setLoading(true)
      setError(null)
      
      const response = await fetch("/api/user/balance")
      const data = await response.json()
      
      if (response.ok && data.success) {
        setMealBalance(data.balance)
        logger.info('Meal balance fetched successfully', { balance: data.balance })
      } else {
        const errorMessage = data.error || 'Failed to fetch meal balance'
        logger.warn('Failed to fetch meal balance', { 
          status: response.status, 
          error: errorMessage 
        })
        setError(errorMessage)
      }
    } catch (error: unknown) {
      captureErrorSafe(error, {
        action: 'fetch_meal_balance',
        component: 'MealBalance'
      })
      
      logger.error('Failed to fetch meal balance', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      
      setError('Failed to load meal balance. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    fetchMealBalance()
  }

  if (loading) {
    return (
      <div className={styles.balanceCard}>
        <h3>Your Meal Balance</h3>
        <div className={styles.loading}>Loading meal balance...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.balanceCard}>
        <h3>Your Meal Balance</h3>
        <div className={styles.errorContainer}>
          <p className={styles.errorText}>⚠️ {error}</p>
          <button 
            onClick={handleRetry}
            className={styles.retryButton}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.balanceCard}>
      <h3>Your Meal Balance</h3>
      <div className={styles.balanceNumber}>{mealBalance}</div>
      <p className={styles.balanceText}>meals remaining</p>
      {mealBalance === 0 && (
        <div className={styles.noMeals}>
          <p>🍽️ Purchase a meal pack to get started!</p>
          <a href="/dashboard/packs" className={styles.purchaseLink}>
            Buy Meals
          </a>
        </div>
      )}
    </div>
  )
}
