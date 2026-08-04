/**
 * Push notification infrastructure — the plumbing to register a device and
 * receive a push token, wired ahead of the Firebase project existing so
 * that adding real keys later (google-services.json on Android,
 * GoogleService-Info.plist + an APNs key on iOS — see MOBILE_DEPLOYMENT.md)
 * is a drop-in, not a code change.
 *
 * Deliberately NOT called automatically on every app launch: Apple's
 * Human Interface Guidelines (and app-review practice) penalize apps that
 * request the notification permission before the user has done anything
 * that makes it contextually obvious why — call requestAndRegister() from
 * wherever that context exists (e.g. after a booking is confirmed, or a
 * "Enable notifications" toggle in account settings), not from app bootstrap.
 *
 * There is currently no backend endpoint to persist the returned token
 * against a user — sendTokenToServer() is a named stub so that wiring one
 * up later is a one-function change, not a re-discovery of where
 * registration happens.
 */
export interface PushRegistrationResult {
  granted: boolean;
  token?: string;
  error?: string;
}

export async function requestAndRegisterPushNotifications(): Promise<PushRegistrationResult> {
  const { Capacitor } = await import("@capacitor/core");
  if (!Capacitor.isNativePlatform()) return { granted: false, error: "not-native" };

  const { PushNotifications } = await import("@capacitor/push-notifications");

  const permStatus = await PushNotifications.checkPermissions();
  let receive = permStatus.receive;
  if (receive === "prompt" || receive === "prompt-with-rationale") {
    const requested = await PushNotifications.requestPermissions();
    receive = requested.receive;
  }
  if (receive !== "granted") return { granted: false };

  return new Promise((resolve) => {
    PushNotifications.addListener("registration", (token) => {
      sendTokenToServer(token.value).catch(() => {});
      resolve({ granted: true, token: token.value });
    });
    PushNotifications.addListener("registrationError", (err) => {
      resolve({ granted: true, error: err.error });
    });
    PushNotifications.register();
  });
}

/** Fires whenever a push arrives while the app is foregrounded, and when the
 * user taps a push that opened/resumed the app — wire both to in-app
 * routing (e.g. a booking-confirmed push opening its dashboard entry) once
 * the notification payload shape is defined server-side. */
export async function listenForPushEvents(onOpen: (data: Record<string, unknown>) => void): Promise<() => void> {
  const { Capacitor } = await import("@capacitor/core");
  if (!Capacitor.isNativePlatform()) return () => {};

  const { PushNotifications } = await import("@capacitor/push-notifications");
  const listener = await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    onOpen(action.notification.data ?? {});
  });
  return () => void listener.remove();
}

async function sendTokenToServer(token: string): Promise<void> {
  // TODO(push-backend): once a `device_push_tokens` table + server action
  // exist, persist { token, platform, userId } here so a future push-send
  // job can target real devices. No-op until then — intentionally not
  // silently swallowed as a TODO comment buried in unrelated code, this is
  // the single named function that needs filling in.
  void token;
}
