import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Remote-URL architecture: the native shell loads the live production site
 * (https://gohargeisa.com) directly rather than bundling a static export.
 * This is a deliberate choice, not a placeholder — the web app is built on
 * Next.js Server Components, Server Actions, cookie-based Supabase auth, and
 * ISR, none of which survive a static `next export`. `webDir` below only
 * matters for the small offline fallback shell (see public-mobile/), which
 * Capacitor bundles locally and MainActivity/AppDelegate show when the
 * remote URL can't be reached.
 */
const config: CapacitorConfig = {
  appId: 'com.gohargeisa.app',
  appName: 'Go Hargeisa',
  webDir: 'public-mobile',
  server: {
    url: 'https://gohargeisa.com',
    cleartext: false,
    // Keeps the Google OAuth redirect chain (gohargeisa.com -> supabase.co
    // -> accounts.google.com -> back) inside the app's own WebView instead
    // of Capacitor kicking unlisted-origin navigations out to the system
    // browser, which would break the redirectTo callback finding its way
    // back into the app. Deliberately narrow (just the OAuth consent host,
    // not a `*.google.com` wildcard) — Capacitor's own Bridge.launchIntent()
    // already hands off any URL whose host isn't here to the native
    // ACTION_VIEW intent, which is exactly what makes tel:/mailto:/wa.me/
    // Google Maps links open their respective native apps for free; a
    // wildcard here would swallow maps.google.com links into the WebView
    // instead of letting Google Maps open natively.
    allowNavigation: ['*.supabase.co', 'accounts.google.com'],
    // Built into Capacitor's own BridgeWebViewClient (Android)/
    // WebViewDelegationHandler (iOS): when the main-frame load of `url`
    // above fails (no connectivity, DNS, 5xx), both platforms automatically
    // load this bundled page instead of the native browser error page — no
    // custom WebViewClient/WKNavigationDelegate subclass needed. Path is
    // relative to webDir (public-mobile/offline.html).
    errorPath: 'offline.html',
  },
  ios: {
    contentInset: 'always',
    // The app already renders its own splash; suppress the extra native
    // status-bar blank flash some iOS WKWebView setups show on cold start.
    backgroundColor: '#FBF8F3',
  },
  android: {
    backgroundColor: '#FBF8F3',
  },
  plugins: {
    SplashScreen: {
      // Hidden manually from JS once the remote page signals it has
      // painted (see lib/mobile/native-bootstrap.ts), rather than a fixed
      // timer — avoids both "flash of blank white" and "splash lingers
      // after content is ready."
      launchAutoHide: false,
      backgroundColor: '#FBF8F3',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: false,
      showSpinner: false,
    },
    StatusBar: {
      // Edge-to-edge like every modern native app; the web layer pads for
      // it with env(safe-area-inset-*) (see app/globals.css).
      overlay: true,
      style: 'DARK', // dark icons/text — the app's header is light (cream/white)
      backgroundColor: '#00000000',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
