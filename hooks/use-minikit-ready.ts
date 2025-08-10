'use client';

import { useEffect, useRef } from 'react';
import { useMiniKit } from '@coinbase/onchainkit/minikit';

const MAX_RETRY_TIME = 30000; // 30 секунд
const RETRY_INTERVAL = 3000; // 3 секунды

export function useMiniKitReady() {
  const { setFrameReady, isFrameReady } = useMiniKit();
  const startTimeRef = useRef<number>(Date.now());
  const intervalRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    // Если уже готово, ничего не делаем
    if (isFrameReady) {
      return;
    }

    const trySetReady = () => {
      const elapsed = Date.now() - startTimeRef.current;

      // Превышен лимит времени - прекращаем попытки
      if (elapsed > MAX_RETRY_TIME) {
        console.log('MiniKit ready timeout - running as regular website');
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        return;
      }

      // Вызываем ready
      setFrameReady();
      console.log(`MiniKit frame ready called after ${elapsed}ms`);

      // Останавливаем интервал (setFrameReady должен изменить isFrameReady)
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };

    // Первая попытка через 1 секунду (даём DOM загрузиться)
    const initialTimer = setTimeout(() => {
      trySetReady();

      // Если не сработало с первого раза, запускаем retry
      if (!isFrameReady) {
        intervalRef.current = setInterval(trySetReady, RETRY_INTERVAL);
      }
    }, 1000);

    // Cleanup
    return () => {
      clearTimeout(initialTimer);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [setFrameReady, isFrameReady]);

  return { isFrameReady };
}
