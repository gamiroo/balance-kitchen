'use client';
import { useEffect, useRef } from 'react';

type MovingBorderProps = {
  /** Wrapper width – px, %, "full", … */
  width?: string | number;
  /** Wrapper height – px, %, "fit", … */
  height?: string | number;
  /** Stroke thickness. */
  strokeWidth?: number;
  /** Seconds for a full rotation. */
  duration?: number;
  /** Opacity of the whole border (0–1). */
  opacity?: number;
  /** Gaussian blur applied to the stroke (px). */
  blur?: number;
  /** Rounded‑corner radius (px). */
  radius?: number;
  /** Optional wrapper class. */
  className?: string;
  /** Children – the content inside the border. */
  children?: React.ReactNode;
  /** Gradient stops – first is start, last is end. */
  gradientColors?: [string, string];
  /** Background color/class for the content area */
  background?: string;
  /** ARIA label for the wrapper */
  ariaLabel?: string;
  /** ARIA-describedby for the content area */
  ariaDescribedBy?: string;
  /** ARIA role for the wrapper */
  role?: string;
  /** Reduce motion for users who prefer that (disables animation) */
  reduceMotion?: boolean;
  /** Static ID prefix to ensure SSR/CSR consistency */
  idPrefix?: string;
};

export const MovingBorder = ({
  width = '100%',
  height = '100%',
  strokeWidth = 2,
  duration = 28,
  opacity = 1,
  blur = 1,
  radius = 20,
  className = '',
  children,
  gradientColors = ['#ffc33e', '#cb2e12'],
  background = 'transparent',
  ariaLabel = 'Animated border container',
  ariaDescribedBy = '',
  role = 'region',
  reduceMotion = false,
  idPrefix = 'moving-border' // Static prefix to ensure consistency

}: MovingBorderProps) => {
  const rectRef = useRef<SVGRectElement>(null);
  
  // Use static IDs instead of useId() to prevent hydration mismatch
  const gradientId = `${idPrefix}-gradient`;
  const filterId = `${idPrefix}-filter`;

  useEffect(() => {
    if (reduceMotion) return;
    
    const rect = rectRef.current;
    if (!rect) return;

    const wrapper = rect.closest('[data-moving-border]') as HTMLElement;
    if (!wrapper) return;
    
    const w = typeof width === 'string' ? wrapper.clientWidth : Number(width);
    const h = typeof height === 'string' ? wrapper.clientHeight : Number(height);

    rect.setAttribute('x', '0');
    rect.setAttribute('y', '0');
    rect.setAttribute('width', w.toString());
    rect.setAttribute('height', h.toString());
    rect.setAttribute('rx', radius.toString());
    rect.setAttribute('ry', radius.toString());
    rect.style.opacity = opacity.toString();
    rect.style.strokeWidth = strokeWidth.toString();
    rect.style.filter = `url(#${filterId})`;

    const straight = 2 * (w + h - 2 * radius);
    const corners = 2 * Math.PI * radius;
    const perimeter = straight + corners;

    const dash = 0.8 * perimeter;
    const gap = 0.2 * perimeter;

    rect.style.strokeDasharray = `${dash} ${gap}`;
    rect.style.strokeDashoffset = '0';

    // Use a more stable animation name
    const animationName = `dashMove-${idPrefix}-${Math.round(perimeter)}`;
    
    const styleTag = document.createElement('style');
    styleTag.textContent = `
      @keyframes ${animationName} {
        0%   { stroke-dashoffset: 0; }
        100% { stroke-dashoffset: -${perimeter}; }
      }
    `;
    document.head.appendChild(styleTag);

    rect.style.animation = `${animationName} ${duration}s linear infinite`;

    return () => {
      if (document.head.contains(styleTag)) {
        document.head.removeChild(styleTag);
      }
    };
  }, [width, height, duration, radius, opacity, strokeWidth, filterId, reduceMotion, idPrefix]);

  return (
    <div
      data-moving-border
      className={`relative ${className}`}
      style={{ width, height, borderRadius: radius, overflow: 'hidden' }}
      role={role}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy || undefined}
    >
      <svg
        width="100%"
        height="100%"
        style={{ position: 'absolute', inset: 0, zIndex: 10 }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            {gradientColors.map((c, i) => (
              <stop
                key={i}
                offset={`${(i / (gradientColors.length - 1)) * 100}%`}
                stopColor={c}
              />
            ))}
          </linearGradient>

          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={blur} result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect
          ref={rectRef}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#${filterId})`}
          opacity={opacity}
        />
      </svg>

      {/* Content area with glass effect support */}
      <div 
        className="relative z-20 p-4" 
        style={{ 
          background: background,
          backdropFilter: background === 'transparent' ? 'blur(20px)' : undefined,
          WebkitBackdropFilter: background === 'transparent' ? 'blur(20px)' : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
};
