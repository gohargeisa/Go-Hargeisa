/**
 * `PartnerMap` — a small native MapLibre map (OpenFreeMap tiles, keyless)
 * showing one partner's location, with a "Directions" tap.
 *
 * DEFENSIVE: MapLibre is a native module. On a correctly-prebuilt dev/prod
 * build it renders; anywhere the native view fails to mount (a stale build,
 * Expo Go) the error boundary swaps in a plain "Open in Maps" button so the
 * screen never crashes. The JS bundle is unaffected either way.
 */
import { Component, type ReactNode } from "react";
import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { MapView, Camera, MapMarker } from "@/components/maplibre";
import { MAP_STYLE_URL, openDirections, openInMaps } from "@/lib/maps";
import { useTheme } from "@/providers/theme-provider";
import { radii } from "@/theme";
import { AppText } from "@/ui";

interface PartnerMapProps {
  lat: number;
  lng: number;
  label: string;
  height?: number;
}

class MapErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function MapFallback({ lat, lng, label, height }: Required<PartnerMapProps>) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={() => openInMaps({ latitude: lat, longitude: lng }, label)}
      style={{
        height,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
      }}
    >
      <Ionicons name="map-outline" size={24} color={theme.colors.primary} />
      <AppText variant="label" color="primary">
        {t("partner.viewOnMap", "View on map")}
      </AppText>
    </Pressable>
  );
}

export function PartnerMap({ lat, lng, label, height = 180 }: PartnerMapProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const resolved = { lat, lng, label, height };

  if (!MapView || !Camera || !MapMarker) {
    return <MapFallback {...resolved} />;
  }

  return (
    <MapErrorBoundary fallback={<MapFallback {...resolved} />}>
      <View
        style={{
          height,
          borderRadius: radii.lg,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        <MapView
          style={{ flex: 1 }}
          mapStyle={MAP_STYLE_URL}
          logoEnabled={false}
          attributionEnabled
          compassEnabled={false}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
        >
          <Camera
            defaultSettings={{ centerCoordinate: [lng, lat], zoomLevel: 14 }}
          />
          <MapMarker coordinate={[lng, lat]}>
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: theme.colors.primary,
                borderWidth: 3,
                borderColor: "#fff",
              }}
            />
          </MapMarker>
        </MapView>
        <Pressable
          onPress={() => openDirections({ latitude: lat, longitude: lng })}
          style={{
            position: "absolute",
            right: 10,
            bottom: 10,
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            backgroundColor: theme.colors.chrome,
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderRadius: radii.pill,
          }}
        >
          <Ionicons name="navigate" size={13} color="#fff" />
          <AppText variant="label" color="inverse">
            {t("partner.directions", "Directions")}
          </AppText>
        </Pressable>
      </View>
    </MapErrorBoundary>
  );
}
