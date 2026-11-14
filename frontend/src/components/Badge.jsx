import React from 'react'

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  pulse = false,
  icon: Icon,
  className = '',
}) {
  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1 min-h-[22px]',
    md: 'text-xs px-2.5 py-1 gap-1.5 min-h-[28px]',
    lg: 'text-sm px-3.5 py-1.5 gap-2 min-h-[32px]',
  }

  const variantClasses = {
    emerald:
      'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30 text-emerald-700 border-emerald-300 bg-emerald-50',
    cyan:
      'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/30 text-cyan-700 border-cyan-300 bg-cyan-50',
    amber:
      'bg-amber-500/10 text-amber-400 border border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30 text-amber-700 border-amber-300 bg-amber-50',
    red:
      'bg-rose-500/10 text-rose-400 border border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30 text-rose-700 border-rose-300 bg-rose-50',
    neutral:
      'bg-white/[0.06] text-slate-300 border border-white/10 dark:bg-white/[0.06] dark:text-slate-300 dark:border-white/10 text-slate-700 border-slate-300 bg-slate-100',
    purple:
      'bg-purple-500/10 text-purple-400 border border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/30 text-purple-700 border-purple-300 bg-purple-50',
  }

  const dotColors = {
    emerald: 'bg-emerald-400',
    cyan: 'bg-cyan-400',
    amber: 'bg-amber-400',
    red: 'bg-rose-400',
    neutral: 'bg-slate-400',
    purple: 'bg-purple-400',
  }

  return (
    <span
      className={`inline-flex items-center font-medium font-sans rounded-full whitespace-nowrap backdrop-blur-xs select-none ${
        sizeClasses[size] || sizeClasses.md
      } ${variantClasses[variant] || variantClasses.neutral} ${className}`}
    >
      {dot && (
        <span className="relative flex h-2 w-2 shrink-0">
          {pulse && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                dotColors[variant] || dotColors.neutral
              }`}
            />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              dotColors[variant] || dotColors.neutral
            }`}
          />
        </span>
      )}
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{children}</span>
    </span>
  )
}
