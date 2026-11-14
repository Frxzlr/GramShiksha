import React from 'react'

export function Segmented({ options, value, onChange, className = '', size = 'md' }) {
  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-[12px] px-2.5 py-1',
  }

  return (
    <div
      role="group"
      className={`inline-flex items-center p-0.5 rounded-[6px] border border-white/[0.08] dark:border-white/[0.08] border-slate-200 bg-white/[0.03] dark:bg-white/[0.03] bg-slate-100 select-none ${className}`}
    >
      {options.map((opt) => {
        const isSelected = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-[4px] font-medium transition-colors cursor-pointer ${
              sizeClasses[size] || sizeClasses.md
            } ${
              isSelected
                ? 'bg-[#16181c] dark:bg-[#16181c] bg-white text-white dark:text-white text-slate-900 border border-white/[0.08] dark:border-white/[0.08] border-slate-200 shadow-xs'
                : 'text-slate-400 dark:text-slate-400 text-slate-600 hover:text-white dark:hover:text-white hover:text-slate-900 border border-transparent'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
