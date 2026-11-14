import React from 'react'

export function StatCard({
  label,
  value,
  sublabel,
  className = '',
}) {
  return (
    <div
      className={`bg-[#111214] dark:bg-[#111214] bg-white border border-white/[0.08] dark:border-white/[0.08] border-slate-200 rounded-[8px] p-3.5 sm:p-4 text-left flex flex-col justify-between ${className}`}
    >
      <div className="text-[12px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-400 text-slate-500">
        {label}
      </div>

      <div className="mt-2">
        <div className="text-[22px] sm:text-[24px] font-semibold tracking-tight text-white dark:text-white text-slate-900 font-mono tabular-nums">
          {value}
        </div>
        {sublabel && (
          <p className="text-[12px] text-slate-400 dark:text-slate-400 text-slate-500 mt-0.5 truncate">
            {sublabel}
          </p>
        )}
      </div>
    </div>
  )
}

