/**
 * Connectivity state. Thin wrapper over `@react-native-community/netinfo` so
 * screens import one project path and the rest of the app never depends on
 * that package directly.
 */
import { useEffect, useState } from "react";
import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";

export interface Connectivity {
  /** `null` until the first probe resolves; then `true` / `false`. */
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
}

export function useNetInfo(): Connectivity {
  const [state, setState] = useState<Connectivity>({
    isConnected: null,
    isInternetReachable: null,
  });

  useEffect(() => {
    const apply = (s: NetInfoState) =>
      setState({
        isConnected: s.isConnected,
        isInternetReachable: s.isInternetReachable,
      });
    NetInfo.fetch().then(apply);
    return NetInfo.addEventListener(apply);
  }, []);

  return state;
}

export async function isOnline(): Promise<boolean> {
  const s = await NetInfo.fetch();
  return s.isConnected !== false;
}
