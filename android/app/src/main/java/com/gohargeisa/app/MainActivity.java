package com.gohargeisa.app;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.animation.ObjectAnimator;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.view.View;
import android.view.ViewGroup;
import android.view.animation.LinearInterpolator;
import android.webkit.WebView;
import android.widget.FrameLayout;
import android.widget.ImageView;
import androidx.annotation.Nullable;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;

/**
 * Android 12+ (API 31+)'s own system splash screen (Theme.SplashScreen, see
 * res/values/styles.xml's AppTheme.NoActionBarLaunch) can only ever show a
 * small centred launcher icon on a solid background — a hard platform
 * restriction (developer.android.com/develop/ui/views/launch/splash-screen),
 * true for every Android app, not something any theme attribute or Capacitor
 * config can override. It cannot show the real Go Hargeisa launch artwork
 * (drawable/splash — the city skyline + logo composited on the same navy
 * canvas). @capacitor/splash-screen's own Android implementation
 * (SplashScreen.java's showWithAndroid12API) confirms this: on 31+ it only
 * calls androidx.core.splashscreen.SplashScreen.installSplashScreen() and
 * never falls back to its own full-image ImageView path — that path is
 * pre-12 only.
 *
 * To still show the actual artwork on 12+ (matching the pre-12 experience,
 * where the Capacitor plugin's own ImageView already renders it with
 * androidScaleType FIT_CENTER per capacitor.config.ts), this adds one plain
 * ImageView of that exact same drawable, added AFTER Capacitor's own content
 * so it draws on top of the WebView — not on top of, or competing with, the
 * OS's own transient icon view, which is a separate window-level decoration
 * the OS removes on its own. The moment the OS removes its icon view, this
 * overlay is already sitting there underneath it, so the hand-off is
 * seamless with no listener/timing hook into the OS's own splash needed
 * (avoids double-registering SplashScreen.setOnExitAnimationListener/
 * setKeepOnScreenCondition, which @capacitor/splash-screen's own plugin
 * already registers during its load() call inside super.onCreate() below —
 * a second registration from here would silently overwrite/fight it).
 *
 * Repainting: Capacitor's own SplashScreen plugin holds a
 * ViewTreeObserver.OnPreDrawListener on this SAME content view
 * (android.R.id.content) that returns false ("not ready to draw yet") for
 * its own launchShowDuration window — confirmed empirically to suppress ANY
 * draw of this view tree, not just the WebView's, meaning this overlay's own
 * addView() can have its natural first-paint request swallowed the same
 * way. Once that listener clears, nothing else necessarily asks for a fresh
 * frame if the WebView itself is still stalled (slow connection), so the
 * poll loop below calls postInvalidate() every tick until the overlay
 * actually shows — verified working via a real on-device build (see
 * session notes): without this repeated nudge the overlay is added to the
 * hierarchy but never visibly painted; with it, the artwork reliably shows.
 *
 * Dismissal is tied to the WebView's own load progress (a plain read-only
 * WebView.getProgress() poll — doesn't touch/replace Capacitor's own
 * WebViewClient, so none of its existing behaviour changes) rather than a
 * fixed timer: a fixed timer independent of real load state would fade this
 * overlay away on its own schedule regardless of whether the real page is
 * actually ready yet, which under a slow connection means the overlay can
 * finish fading before there's anything to reveal. getProgress() reaching
 * 100 means resources finished loading but not necessarily that React has
 * hydrated/painted yet — confirmed empirically (a brief blank frame of the
 * WebView's own background colour, no content, right after fading on
 * progress alone) — so SETTLE_DELAY_MS gives hydration a short buffer
 * first. An absolute ceiling (MAX_WAIT_MS) still applies so this can never
 * hang indefinitely, and skips the settle buffer so the ceiling stays a
 * true worst-case bound.
 *
 * Gated to API 31+ only: pre-12 devices already get the real artwork from
 * the Capacitor plugin's own legacy splash view — adding this overlay there
 * too would show it twice.
 */
public class MainActivity extends BridgeActivity {

    private static final long POLL_INTERVAL_MS = 150;
    private static final long SETTLE_DELAY_MS = 600;
    private static final long MAX_WAIT_MS = 8000;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        // No-op on its own beyond silencing an AndroidX "call before
        // super.onCreate" warning — the Capacitor SplashScreen plugin (its
        // own load() call, fired inside super.onCreate() below) still owns
        // showing/hiding the OS-level icon splash exactly as before.
        SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return;

        int drawableId = getResources().getIdentifier("splash", "drawable", getPackageName());
        if (drawableId == 0) return;

        final ViewGroup root = (ViewGroup) findViewById(android.R.id.content);
        final ImageView overlay = new ImageView(this);
        overlay.setScaleType(ImageView.ScaleType.FIT_CENTER);
        overlay.setBackgroundColor(0xFF051427); // matches @color/splashBackground
        overlay.setImageResource(drawableId);
        root.addView(
            overlay,
            new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        );

        final Handler handler = new Handler(getMainLooper());
        final long startedAt = System.currentTimeMillis();
        final Runnable[] poll = new Runnable[1];
        poll[0] = () -> {
            if (overlay.getParent() == null) return; // already dismissed

            overlay.postInvalidate();

            WebView webView = getBridge() != null ? getBridge().getWebView() : null;
            boolean ready = webView != null && webView.getProgress() >= 100;
            boolean timedOut = System.currentTimeMillis() - startedAt >= MAX_WAIT_MS;

            if (timedOut) {
                fadeOutOverlay(root, overlay);
            } else if (ready) {
                handler.postDelayed(() -> fadeOutOverlay(root, overlay), SETTLE_DELAY_MS);
            } else {
                handler.postDelayed(poll[0], POLL_INTERVAL_MS);
            }
        };
        handler.postDelayed(poll[0], POLL_INTERVAL_MS);
    }

    private void fadeOutOverlay(ViewGroup root, ImageView overlay) {
        if (overlay.getParent() == null) return;
        ObjectAnimator fade = ObjectAnimator.ofFloat(overlay, View.ALPHA, 1f, 0f);
        fade.setDuration(300);
        fade.setInterpolator(new LinearInterpolator());
        fade.addListener(
            new AnimatorListenerAdapter() {
                @Override
                public void onAnimationEnd(Animator animation) {
                    if (overlay.getParent() != null) root.removeView(overlay);
                }
            }
        );
        fade.start();
    }
}
