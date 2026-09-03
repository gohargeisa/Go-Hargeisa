/**
 * Error handling, two entry points:
 *
 *   <RootErrorBoundary>  — a class boundary wrapping the whole app in
 *                          `src/app/_layout.tsx`. Catches render errors that
 *                          escape a route segment.
 *   RouteErrorView       — re-exported from `_layout.tsx` as `ErrorBoundary`,
 *                          which expo-router renders (with `{ error, retry }`)
 *                          for an uncaught error inside a route.
 *
 * Both show the same themed "something went wrong" view. Theme/i18n context
 * may be gone when the root boundary fires, so that path uses static colours.
 */
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { brand, palette } from "@/theme";

function Fallback({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: brand.navyDeep,
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        gap: 12,
      }}
    >
      <Text style={{ color: palette.white, fontSize: 18, fontWeight: "700" }}>
        Something went wrong
      </Text>
      <Text
        style={{
          color: "rgba(255,255,255,0.7)",
          fontSize: 14,
          textAlign: "center",
        }}
      >
        {message ?? "The app hit an unexpected error. Please try again."}
      </Text>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          style={{
            marginTop: 8,
            backgroundColor: brand.blue,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 999,
          }}
        >
          <Text style={{ color: palette.white, fontWeight: "600" }}>
            Try again
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** expo-router route-level error UI. */
export function RouteErrorView({
  error,
  retry,
}: {
  error: Error;
  retry: () => Promise<void>;
}) {
  return <Fallback message={error.message} onRetry={() => void retry()} />;
}

interface State {
  error: Error | null;
}

export class RootErrorBoundary extends Component<
  { children: ReactNode },
  State
> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[RootErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <Fallback
          message={this.state.error.message}
          onRetry={() => this.setState({ error: null })}
        />
      );
    }
    return this.props.children;
  }
}
