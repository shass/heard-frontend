'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { useComposeCast } from '@/src/platforms/base-app/hooks/useComposeCast';
import { useMiniKitContext } from '@/src/platforms/base-app/hooks/useMiniKitContext';

interface ShareButtonProps {
  text: string;
  url?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function ShareButton({ 
  text, 
  url, 
  variant = 'outline', 
  size = 'sm',
  className 
}: ShareButtonProps) {
  const { composeCast } = useComposeCast();
  const { isBaseApp, isFarcasterApp, isWebsite } = useMiniKitContext();

  const handleShare = () => {
    // Full share text with URL if provided
    const shareText = url ? `${text}\n\n${url}` : text;

    if (isBaseApp || isFarcasterApp) {
      // Use Farcaster compose cast in Mini App context
      composeCast({
        text: shareText,
        embeds: url ? [url] : undefined
      });
    } else {
      // Fallback to Web Share API or clipboard in regular websites
      if (navigator.share && /mobile/i.test(navigator.userAgent)) {
        navigator.share({
          title: 'Heard Labs Survey',
          text: shareText,
          url: url
        }).catch((error) => {
          console.log('Share failed:', error);
          fallbackShare(shareText);
        });
      } else {
        fallbackShare(shareText);
      }
    }
  };

  const fallbackShare = (shareText: string) => {
    // Copy to clipboard as fallback
    navigator.clipboard.writeText(shareText).then(() => {
      // Could add toast notification here
      console.log('Share text copied to clipboard');
    }).catch((error) => {
      console.error('Failed to copy to clipboard:', error);
    });
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleShare}
      className={className}
    >
      <Share2 className="h-4 w-4 mr-2" />
      Share
    </Button>
  );
}