'use client';

import { useMiniKitReady } from '@/src/platforms/base-app/hooks/useMiniKitReady';

export function MiniKitReady() {
  // Хук сам обрабатывает всю логику retry
  useMiniKitReady();
  
  return null;
}
