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
 * To still show the actual artwork on 12+, this adds one plain ImageView of
 * that exact same drawable inside this Activity's own content view. That is
 * NOT enough on its own, though: the platform's real android.window.
 * SplashScreenView is a full-screen view added as a separate sibling
 * directly on the DecorView, above this Activity's entire content tree —
 * confirmed via a live dumpsys view-hierarchy capture, which showed it
 * listed after (and so painted over) android.R.id.content in its entirety,
 * not just over the WebView. So this overlay, however correctly it's added,
 * sized and painted underneath, is completely hidden for as long as that
 * platform view exists, regardless of z-order tricks inside content.
 *
 * That view is removed once @capacitor/splash-screen's own
 * setKeepOnScreenCondition (registered in its load(), during super.onCreate
 * below) flips false, which happens on its own schedule based on
 * capacitor.config.ts's SplashScreen.launchShowDuration — a timer entirely
 * independent of this overlay's own WebView-progress-based dismissal below.
 * A first version of this file dismissed this overlay purely on WebView
 * progress + a short settle delay: on a fast load, that finished well under
 * launchShowDuration, meaning this overlay had already faded out and been
 * removed — invisible, underneath the platform view — before that view was
 * ever removed, so the user went straight from the icon splash to the bare
 * WebView, never seeing this artwork at all (root-caused via on-device
 * dumpsys + screenshot sequencing; see session notes). The fix is to poll
 * for that platform view's actual presence (isOsSplashScreenViewPresent)
 * and never dismiss this overlay while it's still there, rather than
 * guessing a fixed duration — correct regardless of device speed or any
 * future change to launchShowDuration. MAX_WAIT_MS is still an unconditional
 * ceiling so this can never hang if that view were somehow never removed.
 *
 * Repainting: the same OnPreDrawListener that gates the platform view also
 * suppresses this content view's own draw traversal while it's active, so
 * this overlay's natural first-paint request can be swallowed the same way
 * — confirmed empirically. The poll loop below calls postInvalidate() every
 * tick to force a repaint attempt until it actually shows.
 *
 * Dismissal is tied to the WebView's own load progress (a plain read-only
 * WebView.getProgress() poll — doesn't touch/replace Capacitor's own
 * WebViewClient, so none of its existing behaviour changes) rather than a
 * fixed timer: getProgress() reaching 100 means resources finished loading
 * but not necessarily that React has hydrated/painted yet — confirmed
 * empirically (a brief blank frame of the WebView's own background colour)
 * — so SETTLE_DELAY_MS gives hydration a short buffer first.
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
            if (overlay.getParent() == null) return;

            overlay.postInvalidate();

            WebView webView = getBridge() != null ? getBridge().getWebView() : null;
            boolean ready = webView != null && webView.getProgress() >= 100;
            boolean timedOut = System.currentTimeMillis() - startedAt >= MAX_WAIT_MS;
            boolean osSplashGone = !isOsSplashScreenViewPresent();

            if (timedOut) {
                fadeOutOverlay(root, overlay);
            } else if (ready && osSplashGone) {
                handler.postDelayed(() -> fadeOutOverlay(root, overlay), SETTLE_DELAY_MS);
            } else {
                handler.postDelayed(poll[0], POLL_INTERVAL_MS);
            }
        };
        handler.postDelayed(poll[0], POLL_INTERVAL_MS);
    }

    private boolean isOsSplashScreenViewPresent() {
        View decor = getWindow().getDecorView();
        if (!(decor instanceof ViewGroup)) return false;
        ViewGroup decorGroup = (ViewGroup) decor;
        for (int i = 0; i < decorGroup.getChildCount(); i++) {
            if (decorGroup.getChildAt(i) instanceof android.window.SplashScreenView) return true;
        }
        return false;
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
