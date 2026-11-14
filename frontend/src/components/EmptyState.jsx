import React from 'react'

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}) {
  return (
    <div
      className={`glass-card rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto ${className}`}
    >
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/5">
          <Icon className="w-7 h-7" />
        </div>
      )}
      {title && (
        <h3 className="font-heading text-lg sm:text-xl font-bold dark:text-white text-slate-900 tracking-tight">
          {title}
        </h3>
      )}
      {description && (
        <p className="text-sm dark:text-slate-400 text-slate-600 mt-1.5 max-w-sm leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
