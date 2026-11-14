import React from 'react'

export function Card({
  children,
  className = '',
  hover = false,
  glow = false,
  as: Component = 'div',
  ...props
}) {
  return (
    <Component
      className={`glass-card rounded-2xl p-5 sm:p-6 text-left relative overflow-hidden transition-all duration-200 ${
        hover
          ? 'hover:border-white/20 hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-0.5'
          : ''
      } ${
        glow
          ? 'before:absolute before:inset-0 before:bg-gradient-to-br before:from-emerald-500/5 before:to-transparent before:pointer-events-none'
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
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06] dark:border-white/[0.06] border-slate-200/80 ${className}`}>
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          {title && (
            <h3 className="font-heading text-lg sm:text-xl font-bold tracking-tight dark:text-white text-slate-900 truncate">
              {title}
            </h3>
          )}
          {badge}
        </div>
        {description && (
          <p className="text-xs sm:text-sm dark:text-slate-400 text-slate-600 line-clamp-2">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
    </div>
  )
}
