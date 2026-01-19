'use client';

import React from 'react';
import { Button } from './ui/button';
import { LogIn } from 'lucide-react';
import { useNotifications } from './ui/notifications';
import { useAuth } from '@/src/platforms';
import { usePlatform } from '@/src/core/hooks/usePlatform';

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
  const { platform } = usePlatform();

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

  // Don't show on web platform
  if (platform?.id === 'web') {
    return null;
  }

  // Get platform-specific button text
  const getButtonText = () => {
    if (auth.isLoading) {
      return platform?.id === 'base-app' ? 'Processing...' : 'Signing in...';
    }
    if (auth.isAuthenticated) {
      return 'Sign Out';
    }
    return platform?.id === 'base-app' ? 'Sign in with Base' : 'Quick Auth';
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleAuth}
      disabled={auth.isLoading}
      className={className}
    >
      <LogIn className="h-4 w-4 mr-2" />
      {getButtonText()}
    </Button>
  );
}

// Export the platform-aware component
export function FarcasterAuthButton(props: FarcasterAuthButtonProps) {
  // For now, always use the modern implementation
  return <ModernFarcasterAuthButton {...props} />;
}
