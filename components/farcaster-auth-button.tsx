'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';
import { useAuthenticate } from '@coinbase/onchainkit/minikit';
import { useMiniKitContext } from '@/hooks/use-minikit-context';
import { useNotifications } from '@/components/ui/notifications';
import { env } from '@/lib/env';
import { 
  useCompatibleAuth, 
  useMigrationChoice, 
  PlatformSwitch
} from '@/src/platforms';

interface FarcasterAuthButtonProps {
  onSuccess?: (result: any) => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

// Legacy implementation for backward compatibility
function LegacyFarcasterAuthButton({ 
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

// Modern platform-aware implementation
function ModernFarcasterAuthButton({ 
  onSuccess,
  variant = 'outline', 
  size = 'default',
  className 
}: FarcasterAuthButtonProps) {
  const auth = useCompatibleAuth();
  const notifications = useNotifications();

  const handleAuth = async () => {
    try {
      if (auth.isAuthenticated) {
        await auth.logout();
        notifications.success('Signed out successfully');
      } else {
        await auth.login();
        notifications.success('Authentication successful!');
        onSuccess?.(auth.user);
      }
    } catch (error) {
      console.error('Auth failed:', error);
      notifications.error('Authentication failed', 'Please try again');
    }
  };

  return (
    <PlatformSwitch
      web={null} // Don't show on web platform
      baseApp={
        <Button
          variant={variant}
          size={size}
          onClick={handleAuth}
          disabled={auth.isLoading}
          className={className}
        >
          <LogIn className="h-4 w-4 mr-2" />
          {auth.isLoading ? 'Processing...' : 
           auth.isAuthenticated ? 'Sign Out' : 'Sign in with Base'}
        </Button>
      }
      farcaster={
        <Button
          variant={variant}
          size={size}
          onClick={handleAuth}
          disabled={auth.isLoading}
          className={className}
        >
          <LogIn className="h-4 w-4 mr-2" />
          {auth.isLoading ? 'Signing in...' : 
           auth.isAuthenticated ? 'Sign Out' : 'Quick Auth'}
        </Button>
      }
    />
  );
}

// Export the platform-aware component
export function FarcasterAuthButton(props: FarcasterAuthButtonProps) {
  const migrationChoice = useMigrationChoice();
  
  // For now, always use the modern implementation
  return <ModernFarcasterAuthButton {...props} />;
}