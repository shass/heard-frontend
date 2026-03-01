import type { Metadata } from 'next'
import ErrorBoundary from '@/components/ui/error-boundary'
import { AppProviders } from '@/src/core/components/AppProviders'
import { PlatformLayoutRenderer } from '@/src/core/components/PlatformLayoutRenderer'
import { env } from '@/lib/env'
import './globals.css'
import React from 'react'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL(env.PUBLIC_URL || ''),
  title: 'HEARD - Everyone Will Be HEARD',
  description: 'Surveys gated by verified Web2 & Web3 behavior. Earn crypto rewards for your opinions.',
  category: 'Social',
  openGraph: {
    title: 'HEARD - Everyone Will Be HEARD',
    description: 'Surveys gated by verified Web2 & Web3 behavior. Earn crypto rewards for your opinions.',
    url: env.PUBLIC_URL,
    siteName: 'HEARD',
    images: [
      {
        url: '/hero-1200x630.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HEARD - Everyone Will Be HEARD',
    description: 'Surveys gated by verified Web2 & Web3 behavior. Earn crypto rewards for your opinions.',
    images: ['/hero-1200x630.png'],
  },
  other: {
    // Farcaster Mini App metadata for sharing
    'fc:miniapp': JSON.stringify({
      version: 'next',
      imageUrl: `${env.PUBLIC_URL}/hero-1200x630.png`,
      button: {
        title: 'Open HEARD',
        action: {
          type: 'launch_frame',
          name: 'Heard',
          url: env.PUBLIC_URL || '',
        },
      },
    }),
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <script dangerouslySetInnerHTML={{ __html: `
(function(){
  var el = document.createElement('div');
  el.id = 'dbg';
  el.style.cssText = 'position:fixed;bottom:0;left:0;right:0;padding:8px;background:#000;color:#0f0;font:11px/1.4 monospace;z-index:99999;max-height:50vh;overflow:auto';
  document.body.appendChild(el);

  function log(msg) {
    el.innerHTML += new Date().toISOString().substr(11,12) + ' ' + msg + '<br>';
    el.scrollTop = el.scrollHeight;
  }

  log('diag loaded');
  log('UA: ' + navigator.userAgent.substr(0, 80));
  log('RNWebView: ' + !!window.ReactNativeWebView);
  log('parent===self: ' + (window.parent === window));

  window.onerror = function(msg, src, line) {
    log('ERR: ' + msg + ' @ ' + (src||'?').split('/').pop() + ':' + line);
    // Auto-reload once on chunk load failure (SyntaxError = truncated JS)
    if (msg && msg.toString().indexOf('SyntaxError') !== -1 && src && src.indexOf('.js') !== -1) {
      var key = '__chunk_reload';
      var count = parseInt(sessionStorage.getItem(key) || '0', 10);
      if (count < 2) {
        sessionStorage.setItem(key, String(count + 1));
        log('Chunk corrupted, reloading (attempt ' + (count + 1) + ')...');
        setTimeout(function() { location.reload(); }, 500);
      } else {
        log('Chunk reload limit reached');
      }
    }
  };
  window.onunhandledrejection = function(e) {
    log('REJECT: ' + (e.reason ? (e.reason.message || String(e.reason)).substr(0,200) : '?'));
  };

  var t0 = Date.now();
  var checks = 0;
  var iv = setInterval(function() {
    checks++;
    var elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    var scripts = document.querySelectorAll('script[src]').length;
    var hasNext = !!document.getElementById('__next');
    var bodyLen = (document.body.innerText || '').length;
    log(elapsed + 's: scripts=' + scripts + ' __next=' + hasNext + ' bodyChars=' + bodyLen);
    if (checks >= 20) { clearInterval(iv); log('done monitoring'); }
  }, 1500);
})();
` }} />
        <ErrorBoundary>
          <AppProviders>
            {/* Platform-specific layout renderer */}
            <PlatformLayoutRenderer>
              {children}
            </PlatformLayoutRenderer>
          </AppProviders>
        </ErrorBoundary>
      </body>
    </html>
  )
}
