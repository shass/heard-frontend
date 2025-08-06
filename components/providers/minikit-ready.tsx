'use client';

import { useEffect } from 'react';

export function MiniKitReady() {
  useEffect(() => {
    // Проверяем, что мы в контексте Farcaster Mini App
    if (typeof window !== 'undefined') {
      // Эмулируем вызов ready() для Farcaster SDK
      // Этот вызов скрывает splash screen когда приложение готово
      const farcasterReady = () => {
        if ((window as any).Farcaster?.SDK?.ready) {
          (window as any).Farcaster.SDK.ready();
        }
        // Альтернативный способ для MiniKit
        if ((window as any).MiniKit?.ready) {
          (window as any).MiniKit.ready();
        }
      };

      // Вызываем после небольшой задержки чтобы убедиться что DOM готов
      setTimeout(farcasterReady, 100);
    }
  }, []);

  return null;
}