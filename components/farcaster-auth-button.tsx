'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';
import { useNotifications } from '@/components/ui/notifications';
import {
  useAuth,
  PlatformSwitch
} from '@/src/platforms';

interface FarcasterAuthButtonProps {
  onSuccess?: (result: any) => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

// Modern platform-aware implementation
function ModernFarcasterAuthButton({
  onSuccess,
  variant = 'outline',
  size = 'default',
  className
}: FarcasterAuthButtonProps) {
  const auth = useAuth();
  const notifications = useNotifications();

  const handleAuth = async () => {
    try {
      if (auth.isAuthenticated) {
        await auth.logout();
        notifications.success('Signed out successfully');
      } else {
        await auth.authenticate();
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
  // For now, always use the modern implementation
  return <ModernFarcasterAuthButton {...props} />;
}
