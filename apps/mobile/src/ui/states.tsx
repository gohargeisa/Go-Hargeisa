/**
 * Full-bleed status views: `EmptyState`, `ErrorState`, `OfflineBanner`.
 * All copy is passed in (translated by the caller).
 */
import type { ReactNode } from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
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

/** Tinted circular badge around an icon — the same visual language already
 *  used for booking-success confirmations (e.g. hotels/appointment success
 *  screens), reused here so every empty/error state carries a matching
 *  visual anchor instead of being bare text, without introducing a new
 *  pattern of its own. */
function StateBadge({ name, tone }: { name: keyof typeof Ionicons.glyphMap; tone: "muted" | "danger" }) {
  const { theme } = useTheme();
  const color = tone === "danger" ? "#DC2626" : theme.colors.primary;
  return (
    <View
      style={{
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: color + "1A",
        marginBottom: 4,
      }}
    >
      <Ionicons name={name} size={30} color={color} />
    </View>
  );
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
      {icon ?? <StateBadge name="file-tray-outline" tone="muted" />}
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
  icon,
  title,
  message,
  actionLabel = "Try again",
  onAction,
}: StateProps) {
  return (
    <EmptyState
      icon={icon ?? <StateBadge name="cloud-offline-outline" tone="danger" />}
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
