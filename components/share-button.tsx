'use client';

import React from 'react';
import { Button } from './ui/button';
import { Share2 } from 'lucide-react';
import { useShare } from '@/src/platforms/_core';

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
  const { share, canShare } = useShare();

  const handleShare = async () => {
    if (!url || !canShare) return;

    try {
      await share({
        url,
        text,
        title: 'HEARD Survey'
      });
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleShare}
      className={className}
      disabled={!canShare || !url}
    >
      <Share2 className="h-4 w-4 mr-2" />
      Share
    </Button>
  );
}