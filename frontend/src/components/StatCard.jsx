import React from 'react'

export function StatCard({
  label,
  value,
  sublabel,
  icon: Icon,
  variant = 'emerald',
  className = '',
}) {
  const accentGlow = {
    emerald: 'from-emerald-500/10 to-transparent',
    cyan: 'from-cyan-500/10 to-transparent',
    amber: 'from-amber-500/10 to-transparent',
    purple: 'from-purple-500/10 to-transparent',
  }

  const iconColor = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  }

  return (
    <div
      className={`glass-card rounded-2xl p-4 sm:p-5 relative overflow-hidden text-left flex flex-col justify-between group ${className}`}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${
          accentGlow[variant] || accentGlow.emerald
        } opacity-50 pointer-events-none transition-opacity duration-300 group-hover:opacity-100`}
      />

      <div className="flex items-start justify-between gap-3 relative z-10">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400">
          {label}
        </span>
        {Icon && (
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${
              iconColor[variant] || iconColor.emerald
            }`}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3 relative z-10">
        <div className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight dark:text-white text-slate-900 tabular-nums">
          {value}
        </div>
        {sublabel && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {sublabel}
          </p>
        )}
      </div>
    </div>
  )
}
