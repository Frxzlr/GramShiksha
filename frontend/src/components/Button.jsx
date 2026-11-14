import React from 'react'

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  type = 'button',
  ...props
}) {
  const sizeClasses = {
    sm: 'min-h-[36px] px-3 py-1.5 text-xs gap-1.5',
    md: 'min-h-[40px] sm:min-h-[36px] px-3.5 py-1.5 text-sm gap-2',
    lg: 'min-h-[44px] px-4 py-2 text-sm gap-2',
    icon: 'min-h-[36px] min-w-[36px] w-9 h-9 p-0 justify-center items-center',
  }

  const variantClasses = {
    primary:
      'bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0a0b] font-medium border border-transparent',
    secondary:
      'bg-white/[0.04] dark:bg-white/[0.04] bg-slate-100 hover:bg-white/[0.08] dark:hover:bg-white/[0.08] hover:bg-slate-200 text-slate-200 dark:text-slate-200 text-slate-800 border border-white/[0.08] dark:border-white/[0.08] border-slate-200 font-medium',
    ghost:
      'bg-transparent hover:bg-white/[0.05] dark:hover:bg-white/[0.05] hover:bg-slate-100 text-slate-400 dark:text-slate-400 text-slate-600 hover:text-white dark:hover:text-white hover:text-slate-900 border border-transparent font-medium',
    outline:
      'bg-transparent hover:bg-white/[0.04] dark:hover:bg-white/[0.04] hover:bg-slate-100 text-slate-300 dark:text-slate-300 text-slate-700 border border-white/[0.12] dark:border-white/[0.12] border-slate-300 font-medium',
    danger:
      'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-medium',
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-sans tracking-tight rounded-[6px] transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22c55e] focus-visible:ring-offset-1 dark:focus-visible:ring-offset-[#0a0a0b] focus-visible:ring-offset-white disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed ${
        sizeClasses[size] || sizeClasses.md
      } ${variantClasses[variant] || variantClasses.primary} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : Icon && iconPosition === 'left' ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}

      {children && <span>{children}</span>}

      {!loading && Icon && iconPosition === 'right' && (
        <Icon className="w-4 h-4 shrink-0" />
      )}
    </button>
  )
}

