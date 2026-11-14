import React from 'react'

export function Skeleton({ className = '', width, height, rounded = 'rounded-xl' }) {
  const style = {}
  if (width) style.width = width
  if (height) style.height = height

  return (
    <div
      style={style}
      className={`bg-white/[0.06] dark:bg-white/[0.06] bg-slate-200/80 animate-shimmer ${rounded} ${className}`}
    />
  )
}
