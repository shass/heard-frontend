'use client'

import { useEffect } from 'react'

export function MobileDevTools() {
  useEffect(() => {
    // Only load in development or when explicitly enabled
    const shouldLoadDevTools =
      process.env.NODE_ENV === 'development' ||
      process.env.NEXT_PUBLIC_ENABLE_MOBILE_DEVTOOLS === 'true'

    if (!shouldLoadDevTools) return

    // Load Eruda from CDN
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/eruda'
    script.onload = () => {
      // @ts-ignore - Eruda is loaded from CDN
      if (window.eruda) {
        // @ts-ignore
        window.eruda.init()

        console.log('%c📱 HEARD Mobile DevTools', 'font-size: 20px; font-weight: bold; color: #00ff88;')
        console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #00ff88;')
        console.log('')
        console.log('%c✅ Eruda DevTools активированы!', 'font-size: 14px; color: #00ff88;')
        console.log('')
        console.log('%c🔧 Как использовать:', 'font-size: 14px; font-weight: bold;')
        console.log('  1. Найдите плавающую кнопку в правом нижнем углу')
        console.log('  2. Нажмите на кнопку чтобы открыть DevTools')
        console.log('  3. Вкладка Console - все логи и ошибки')
        console.log('  4. Вкладка Network - все HTTP запросы')
        console.log('  5. Вкладка Elements - DOM inspector')
        console.log('')
        console.log('%c📊 Отладка Auth:', 'font-size: 14px; font-weight: bold;')
        console.log('  • Ищите логи с префиксом [BaseAppAuth]')
        console.log('  • Красные алерты = ошибки auth')
        console.log('  • Network tab → фильтр "/auth/" для auth запросов')
        console.log('')
        console.log('%c📖 Полная документация: MOBILE_DEBUGGING.md', 'color: #00aaff;')
        console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #00ff88;')
      }
    }
    document.body.appendChild(script)

    return () => {
      // Cleanup on unmount
      document.body.removeChild(script)
    }
  }, [])

  return null
}
