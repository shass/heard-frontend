'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';
import { useAuthenticate } from '@coinbase/onchainkit/minikit';
import { useMiniKitContext } from '@/hooks/use-minikit-context';
import { useNotifications } from '@/components/ui/notifications';
import { env } from '@/lib/env';

interface FarcasterAuthButtonProps {
  onSuccess?: (result: any) => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function FarcasterAuthButton({ 
  onSuccess,
  variant = 'outline', 
  size = 'default',
  className 
}: FarcasterAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const domain = typeof window !== 'undefined' ? window.location.hostname : new URL(env.PUBLIC_URL || 'https://heardlabs.xyz').hostname;
  const { signIn } = useAuthenticate(domain);
  const { isFarcasterApp, isBaseApp } = useMiniKitContext();
  const notifications = useNotifications();

  // Only show in Farcaster/Base App context
  if (!isFarcasterApp && !isBaseApp) {
    return null;
  }

  const handleFarcasterSignIn = async () => {
    setIsLoading(true);
    
    try {
      const result = await signIn();

      if (result) {
        notifications.success('Farcaster authentication successful!');
        onSuccess?.(result);
      }
    } catch (error) {
      console.error('Farcaster auth failed:', error);
      notifications.error('Farcaster authentication failed', 'Please try again');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleFarcasterSignIn}
      disabled={isLoading}
      className={className}
    >
      <LogIn className="h-4 w-4 mr-2" />
      {isLoading ? 'Signing in...' : 'Sign in with Farcaster'}
    </Button>
  );
}