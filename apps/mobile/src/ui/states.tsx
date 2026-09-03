/**
 * Full-bleed status views: `EmptyState`, `ErrorState`, `OfflineBanner`.
 * All copy is passed in (translated by the caller).
 */
import type { ReactNode } from "react";
import { View } from "react-native";
import { useNetInfo } from "@/lib/net-info";

import { useTheme } from "@/providers/theme-provider";
import { spacing } from "@/theme";
import { AppText } from "@/ui/text";
import { Button } from "@/ui/button";

interface StateProps {
  icon?: ReactNode;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: StateProps) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: spacing.section,
        gap: 8,
      }}
    >
      {icon}
      <AppText variant="heading" style={{ textAlign: "center" }}>
        {title}
      </AppText>
      {message ? (
        <AppText
          variant="body"
          color="muted"
          style={{ textAlign: "center", marginBottom: 8 }}
        >
          {message}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="secondary"
          size="sm"
          fullWidth={false}
        />
      ) : null}
    </View>
  );
}

export function ErrorState({
  title,
  message,
  actionLabel = "Try again",
  onAction,
}: StateProps) {
  return (
    <EmptyState
      title={title}
      message={message}
      actionLabel={onAction ? actionLabel : undefined}
      onAction={onAction}
    />
  );
}

/** A slim banner pinned under the header while the device is offline. */
export function OfflineBanner({ label }: { label: string }) {
  const { theme } = useTheme();
  const net = useNetInfo();
  if (net.isConnected !== false) return null;

  return (
    <View
      style={{
        backgroundColor: theme.colors.chrome,
        paddingVertical: 6,
        paddingHorizontal: spacing.screenX,
      }}
    >
      <AppText variant="label" color="inverse" style={{ textAlign: "center" }}>
        {label}
      </AppText>
    </View>
  );
}
