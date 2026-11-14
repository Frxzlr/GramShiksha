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
      className={`bg-[#111214] dark:bg-[#111214] bg-white border border-white/[0.08] dark:border-white/[0.08] border-slate-200 rounded-[8px] p-8 text-center flex flex-col items-center justify-center max-w-md mx-auto ${className}`}
    >
      {Icon && (
        <div className="w-9 h-9 rounded-[6px] bg-white/[0.04] dark:bg-white/[0.04] bg-slate-100 border border-white/[0.08] dark:border-white/[0.08] border-slate-200 text-slate-400 flex items-center justify-center mb-3">
          <Icon className="w-4 h-4" />
        </div>
      )}
      {title && (
        <h3 className="text-[14px] font-semibold text-white dark:text-white text-slate-900">
          {title}
        </h3>
      )}
      {description && (
        <p className="text-[13px] text-slate-400 dark:text-slate-400 text-slate-600 mt-1 max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

