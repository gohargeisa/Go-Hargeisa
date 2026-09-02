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
    // Navy (not the old cream) so any edge visible around the splash photo
    // or during the WebView's own first paint matches the dark splash
    // rather than flashing pale against it.
    backgroundColor: '#051427',
  },
  android: {
    backgroundColor: '#051427',
  },
  plugins: {
    SplashScreen: {
      // Hidden manually from JS as soon as the remote page hydrates (see
      // components/shared/capacitor-bootstrap.tsx) for the fast path, BUT
      // launchAutoHide stays on with a real ceiling as a native-level
      // safety net. A previous version of this config set
      // launchAutoHide: false with no timer at all — meaning if the JS
      // hide() call ever didn't fire for any reason (the deployed website
      // not yet containing that code, a JS error, a slow/dead network),
      // the splash would hang forever with nothing to recover it. This
      // config can never fully brick the app again: SplashScreen.hide()
      // still hides it immediately when the page is ready, and if it
      // never fires, the plugin's own native timer force-hides at 4s.
      launchAutoHide: true,
      launchShowDuration: 4000,
      backgroundColor: '#051427',
      androidSplashResourceName: 'splash',
      // FIT_CENTER (not CENTER_CROP): the splash artwork is a full portrait
      // scene that must never be cropped — the drawable is already composed
      // onto a navy #051427 canvas at ~device aspect, and the plugin paints
      // the same navy (backgroundColor below) behind it, so any letterbox
      // edge on an odd aspect ratio is invisible rather than a lost strip
      // of artwork.
      androidScaleType: 'FIT_CENTER',
      splashFullScreen: true,
      splashImmersive: false,
      showSpinner: false,
    },
    StatusBar: {
      // Edge-to-edge like every modern native app; the web layer pads for
      // it with env(safe-area-inset-*) (see app/globals.css). Property is
      // overlaysWebView, not overlay — the old key silently no-opped
      // against the plugin's actual config shape (caught by tsc).
      overlaysWebView: true,
      // Capacitor's Style.Dark ("DARK") means light/white icon+text color
      // — the name refers to the background it's designed for (dark), not
      // the icon color itself. Set to DARK because the very first thing a
      // cold launch shows is the dark navy splash + Hero photo, where white
      // icons are the only readable choice. This is just the launch value:
      // components/shared/capacitor-bootstrap.tsx calls StatusBar.setStyle
      // dynamically once the user scrolls past the Hero into a page's solid
      // white/cream header, so icons stay readable at every scroll position.
      style: 'DARK',
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
