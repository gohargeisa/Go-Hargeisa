import UIKit
import Capacitor

/// Enables WKWebView's native edge-swipe back/forward gesture. Off by
/// default in a stock Capacitor project (Main.storyboard declares
/// CAPBridgeViewController directly, with nothing to override this on).
/// Safe for this app specifically because Next.js App Router client-side
/// navigations use the History API (pushState/replaceState), which
/// WKWebView's own back-forward list already tracks — so the gesture
/// correctly steps through in-app route history, not just full page loads.
class ViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        webView?.allowsBackForwardNavigationGestures = true
    }
}
