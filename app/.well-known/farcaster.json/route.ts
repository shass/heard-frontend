import { NextResponse } from 'next/server';
import { env } from '../../../lib/env';

export async function GET() {
  const isProduction = env.ENVIRONMENT === 'production'
  
  // Ensure required Farcaster variables exist in production
  if (isProduction && (!env.FARCASTER_HEADER || !env.FARCASTER_PAYLOAD || !env.FARCASTER_SIGNATURE)) {
    return NextResponse.json(
      { error: 'Missing Farcaster configuration' },
      { status: 500 }
    );
  }

  const manifest = {
    // Base mini app manifest
    ...(env.FARCASTER_HEADER && env.FARCASTER_PAYLOAD && env.FARCASTER_SIGNATURE && {
      accountAssociation: {
        header: env.FARCASTER_HEADER,
        payload: env.FARCASTER_PAYLOAD,
        signature: env.FARCASTER_SIGNATURE,
      }
    }),
    
    // Core frame config
    frame: {
      version: "1",
      name: env.APP_NAME || "HEARD",
      iconUrl: `${env.PUBLIC_URL}/icon-200x200.png`,
      homeUrl: env.PUBLIC_URL,
      imageUrl: `${env.PUBLIC_URL}/hero-1200x628.png`,
      buttonTitle: "Start Survey",
      splashImageUrl: `${env.PUBLIC_URL}/hero-banner.png`,
      splashBackgroundColor: "#ffffff",
      
      // Extended metadata fields (recommended by Base)
      description: "Earn crypto rewards by completing surveys on the Web3 platform",
      category: "social", // Primary category for discovery
      // screenshots: [] // TODO: Add screenshots when available
      
      // Development flag
      ...(!isProduction && { noindex: true })
    }
  };

  return NextResponse.json(manifest);
}
