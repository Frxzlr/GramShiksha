import React from 'react'

export function Card({
  children,
  className = '',
  hover = false,
  as: Component = 'div',
  ...props
}) {
  return (
    <Component
      className={`bg-[#111214] dark:bg-[#111214] bg-white border border-white/[0.08] dark:border-white/[0.08] border-slate-200 rounded-[8px] p-4 sm:p-5 text-left transition-colors ${
        hover
          ? 'hover:border-white/[0.14] dark:hover:border-white/[0.14] hover:border-slate-300'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </Component>
  )
}

export function CardHeader({ title, description, badge, action, className = '' }) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-white/[0.08] dark:border-white/[0.08] border-slate-200 ${className}`}>
      <div className="space-y-0.5 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {title && (
            <h3 className="text-[14px] font-semibold tracking-tight text-white dark:text-white text-slate-900 truncate">
              {title}
            </h3>
          )}
          {badge}
        </div>
        {description && (
          <p className="text-[12px] text-slate-400 dark:text-slate-400 text-slate-600 line-clamp-1">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
    </div>
  )
}

