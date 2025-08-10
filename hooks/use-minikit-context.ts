'use client';

import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { useMemo } from 'react';

export interface MiniKitContext {
  isBaseApp: boolean;
  isFarcasterApp: boolean;
  isWebsite: boolean;
  clientFid?: string | number;
  contextInfo: any;
}

export function useMiniKitContext(): MiniKitContext {
  const { context } = useMiniKit();

  return useMemo(() => {
    // Determine if we're running in Base App
    const isBaseApp = Boolean(context?.client?.clientFid);
    
    // Determine if we're in Farcaster context (different from Base)
    const isFarcasterApp = Boolean(
      typeof window !== 'undefined' && 
      (window as any).Farcaster?.SDK
    );
    
    // If neither, we're a regular website
    const isWebsite = !isBaseApp && !isFarcasterApp;

    return {
      isBaseApp,
      isFarcasterApp,
      isWebsite,
      clientFid: context?.client?.clientFid ? String(context.client.clientFid) : undefined,
      contextInfo: context
    };
  }, [context]);
}