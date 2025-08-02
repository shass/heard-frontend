"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { Survey } from "@/lib/types"

interface AnimatedListProps {
  items: Survey[]
  renderItem: (survey: Survey, index: number) => React.ReactNode
  className?: string
}

export function AnimatedList({ items, renderItem, className = "" }: AnimatedListProps) {
  const [displayItems, setDisplayItems] = useState(items)
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const firstRender = useRef(true)

  useLayoutEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      setDisplayItems(items)
      return
    }

    // Calculate positions before update
    const firstRects = new Map<string, DOMRect>()
    itemRefs.current.forEach((el, id) => {
      if (el) firstRects.set(id, el.getBoundingClientRect())
    })

    // Update items
    setDisplayItems(items)

    // Force layout
    requestAnimationFrame(() => {
      // Calculate positions after update
      const lastRects = new Map<string, DOMRect>()
      itemRefs.current.forEach((el, id) => {
        if (el) lastRects.set(id, el.getBoundingClientRect())
      })

      // Animate items that moved
      itemRefs.current.forEach((el, id) => {
        if (!el) return
        
        const firstRect = firstRects.get(id)
        const lastRect = lastRects.get(id)
        
        if (firstRect && lastRect) {
          const deltaY = firstRect.top - lastRect.top
          
          if (Math.abs(deltaY) > 1) {
            // Apply instant transform
            el.style.transform = `translateY(${deltaY}px)`
            el.style.transition = ''
            
            // Force reflow
            el.getBoundingClientRect()
            
            // Animate to final position
            el.style.transform = ''
            el.style.transition = 'transform 300ms ease-out'
          }
        } else if (!firstRect && lastRect) {
          // New item - fade in
          el.style.opacity = '0'
          el.style.transform = 'translateY(20px)'
          el.style.transition = ''
          
          requestAnimationFrame(() => {
            el.style.opacity = '1'
            el.style.transform = ''
            el.style.transition = 'opacity 300ms ease-out, transform 300ms ease-out'
          })
        }
      })

      // Clean up removed items with fade out
      const currentIds = new Set(items.map(item => item.id))
      firstRects.forEach((_, id) => {
        if (!currentIds.has(id)) {
          const el = itemRefs.current.get(id)
          if (el) {
            el.style.opacity = '0'
            el.style.transform = 'scale(0.95)'
            el.style.transition = 'opacity 200ms ease-out, transform 200ms ease-out'
          }
        }
      })
    })
  }, [items])

  return (
    <div className={className}>
      {displayItems.map((item, index) => (
        <div
          key={item.id}
          ref={el => {
            if (el) itemRefs.current.set(item.id, el)
            else itemRefs.current.delete(item.id)
          }}
          style={{ willChange: 'transform' }}
        >
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  )
}