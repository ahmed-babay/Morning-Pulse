import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'

import { cn } from '../../lib/utils'
import { IconButton } from './primitives'

export function ScrollCarousel({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  function updateArrows() {
    const el = trackRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 8)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8)
  }

  useEffect(() => {
    updateArrows()
    const el = trackRef.current
    if (!el) return
    const observer = new ResizeObserver(updateArrows)
    observer.observe(el)
    return () => observer.disconnect()
  }, [children])

  function scrollBy(direction: 1 | -1) {
    trackRef.current?.scrollBy({
      left: direction * trackRef.current.clientWidth * 0.85,
      behavior: 'smooth',
    })
  }

  return (
    <div className={cn('relative', className)}>
      <div
        ref={trackRef}
        onScroll={updateArrows}
        className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1"
      >
        {children}
      </div>
      {canScrollLeft && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[var(--panel-solid)] to-transparent"
        />
      )}
      {canScrollRight && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[var(--panel-solid)] to-transparent"
        />
      )}
      {canScrollLeft && (
        <IconButton
          label="Scroll left"
          className="absolute top-1/2 left-1 size-8 -translate-y-1/2 shadow-md"
          onClick={() => scrollBy(-1)}
        >
          <ChevronLeft className="size-4" />
        </IconButton>
      )}
      {canScrollRight && (
        <IconButton
          label="Scroll right"
          className="absolute top-1/2 right-1 size-8 -translate-y-1/2 shadow-md"
          onClick={() => scrollBy(1)}
        >
          <ChevronRight className="size-4" />
        </IconButton>
      )}
    </div>
  )
}
