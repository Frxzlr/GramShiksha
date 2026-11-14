import React from 'react'

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  icon: Icon,
  className = '',
}) {
  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5 min-h-[22px]',
    md: 'text-[12px] px-2.5 py-1 gap-1.5 min-h-[26px]',
    lg: 'text-[13px] px-3 py-1 gap-2 min-h-[30px]',
  }

  const variantClasses = {
    emerald:
      'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20',
    green:
      'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20',
    amber:
      'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    red:
      'bg-red-500/10 text-red-400 border border-red-500/20',
    neutral:
      'bg-white/[0.04] dark:bg-white/[0.04] bg-slate-100 text-slate-300 dark:text-slate-300 text-slate-700 border border-white/[0.08] dark:border-white/[0.08] border-slate-200',
    cyan:
      'bg-white/[0.04] dark:bg-white/[0.04] bg-slate-100 text-slate-300 dark:text-slate-300 text-slate-700 border border-white/[0.08] dark:border-white/[0.08] border-slate-200',
    purple:
      'bg-white/[0.04] dark:bg-white/[0.04] bg-slate-100 text-slate-300 dark:text-slate-300 text-slate-700 border border-white/[0.08] dark:border-white/[0.08] border-slate-200',
  }

  const dotColors = {
    emerald: 'bg-[#22c55e]',
    green: 'bg-[#22c55e]',
    amber: 'bg-amber-400',
    red: 'bg-red-400',
    neutral: 'bg-slate-400',
    cyan: 'bg-slate-400',
    purple: 'bg-slate-400',
  }

  return (
    <span
      className={`inline-flex items-center font-medium rounded-[4px] whitespace-nowrap select-none ${
        sizeClasses[size] || sizeClasses.md
      } ${variantClasses[variant] || variantClasses.neutral} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            dotColors[variant] || dotColors.neutral
          }`}
        />
      )}
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{children}</span>
    </span>
  )
}

