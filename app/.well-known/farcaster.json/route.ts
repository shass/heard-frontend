import { NextResponse } from 'next/server';
import { env } from '../../../lib/env';

export async function GET() {
  // Block dev/staging from Base catalog
  if (env.ENVIRONMENT !== 'production') {
    return NextResponse.json(
      { error: 'Manifest only available in production' },
      { status: 404 }
    );
  }
  //
  // // Ensure required Farcaster variables exist in production
  if (!env.FARCASTER_HEADER || !env.FARCASTER_PAYLOAD || !env.FARCASTER_SIGNATURE) {
    return NextResponse.json(
      { error: 'Missing Farcaster configuration' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    accountAssociation: {
      header: env.FARCASTER_HEADER,
      payload: env.FARCASTER_PAYLOAD,
      signature: env.FARCASTER_SIGNATURE,
    },
    frame: {
      version: "1",
      name: env.APP_NAME,
      iconUrl: `${env.APP_URL}/icon-200x200.png`,
      homeUrl: env.APP_URL,
      imageUrl: `${env.APP_URL}/hero-1200x628.png`,
      buttonTitle: "Start Survey",
      splashImageUrl: `${env.APP_URL}/hero-banner.png`,
      splashBackgroundColor: "#ffffff"
    }
  });
}
