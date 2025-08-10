'use client';

import { useMiniKitReady } from '@/hooks/use-minikit-ready';

export function MiniKitReady() {
  // Хук сам обрабатывает всю логику retry
  useMiniKitReady();
  
  return null;
}
