/**
 * useNetworkStatus — subscribes to network state changes via expo-network.
 */

import { useRef, useState, useEffect } from 'react';
import * as Network from 'expo-network';

export function useNetworkStatus(onReconnect?: () => void): { isOnline: boolean } {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const wasOnlineRef = useRef<boolean>(true);
  const onReconnectRef = useRef(onReconnect);

  useEffect(() => {
    onReconnectRef.current = onReconnect;
  });

  useEffect(() => {
    const subscription = Network.addNetworkStateListener((state) => {
      const nowOnline =
        state.isConnected === true && state.isInternetReachable !== false;

      setIsOnline(nowOnline);

      if (nowOnline && !wasOnlineRef.current) {
        onReconnectRef.current?.();
      }

      wasOnlineRef.current = nowOnline;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return { isOnline };
}
