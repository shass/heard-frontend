'use client';

import { MiniKitProvider } from '@coinbase/onchainkit/minikit';
import { base } from 'viem/chains';
import React from 'react';
import env from '@/lib/env';

interface MiniKitContextProviderProps {
  children: React.ReactNode;
}

export function MiniKitContextProvider({ children }: MiniKitContextProviderProps) {
  return (
    <MiniKitProvider
      apiKey={env.CDP_CLIENT_API_KEY}
      chain={base}
    >
      {children}
    </MiniKitProvider>
  );
}
