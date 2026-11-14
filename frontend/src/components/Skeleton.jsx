import React from 'react'

export function Skeleton({ className = '', width, height, rounded = 'rounded-[6px]' }) {
  const style = {}
  if (width) style.width = width
  if (height) style.height = height

  return (
    <div
      style={style}
      className={`skeleton-box animate-pulse ${rounded} ${className}`}
    />
  )
}

