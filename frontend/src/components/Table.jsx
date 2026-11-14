import React from 'react'

export function Table({ children, className = '' }) {
  return (
    <div className={`w-full overflow-x-auto border border-white/[0.08] dark:border-white/[0.08] border-slate-200 rounded-[8px] bg-[#111214] dark:bg-[#111214] bg-white ${className}`}>
      <table className="w-full text-left border-collapse text-[13px]">
        {children}
      </table>
    </div>
  )
}

export function TableHead({ children, className = '' }) {
  return (
    <thead className={`border-b border-white/[0.08] dark:border-white/[0.08] border-slate-200 bg-white/[0.02] dark:bg-white/[0.02] bg-slate-50/50 ${className}`}>
      {children}
    </thead>
  )
}

export function TableBody({ children, className = '' }) {
  return (
    <tbody className={`divide-y divide-white/[0.06] dark:divide-white/[0.06] divide-slate-100 ${className}`}>
      {children}
    </tbody>
  )
}

export function TableRow({ children, className = '', isShortage = false }) {
  return (
    <tr
      className={`transition-colors hover:bg-white/[0.02] dark:hover:bg-white/[0.02] hover:bg-slate-50/70 ${
        isShortage ? 'border-l-2 border-l-red-500 bg-red-500/[0.02]' : ''
      } ${className}`}
    >
      {children}
    </tr>
  )
}

export function TableHeaderCell({ children, className = '' }) {
  return (
    <th className={`px-3 py-2.5 text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-400 text-slate-500 whitespace-nowrap select-none ${className}`}>
      {children}
    </th>
  )
}

export function TableCell({ children, className = '', mono = false }) {
  return (
    <td className={`px-3 py-2.5 text-slate-200 dark:text-slate-200 text-slate-800 ${mono ? 'font-mono text-xs tabular-nums' : ''} ${className}`}>
      {children}
    </td>
  )
}
