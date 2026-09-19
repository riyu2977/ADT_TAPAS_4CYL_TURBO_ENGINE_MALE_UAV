import { useEffect, useRef, useState } from 'react';

const WS_URL = 'ws://localhost:8000/ws/telemetry';

export interface BackendSocketOptions {
  enabled?: boolean;
  onMessage?: (data: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function useBackendSocket(options: BackendSocketOptions = {}) {
  const { enabled = true, onMessage, onConnect, onDisconnect } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [lastFrame, setLastFrame] = useState<any | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    let isMounted = true;

    function connect() {
      try {
        const ws = new WebSocket(WS_URL);
        socketRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          setIsConnected(true);
          onConnect?.();
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            setLastFrame(data);
            onMessage?.(data);
          } catch (err) {
            console.error('Failed to parse WebSocket frame:', err);
          }
        };

        ws.onerror = (err) => {
          console.warn('WebSocket connection error:', err);
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setIsConnected(false);
          onDisconnect?.();
          socketRef.current = null;
          // Attempt reconnect after 2 seconds
          reconnectTimerRef.current = window.setTimeout(connect, 2000);
        };
      } catch (err) {
        console.warn('Failed to establish WebSocket connection:', err);
        setIsConnected(false);
        reconnectTimerRef.current = window.setTimeout(connect, 2000);
      }
    }

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [enabled, onMessage, onConnect, onDisconnect]);

  return {
    isConnected,
    lastFrame
  };
}
