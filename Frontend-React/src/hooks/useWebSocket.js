import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';

const listeners = new Map();
let globalWs = null;
let reconnectTimer = null;

function getWsUrl() {
  const token = useAuthStore.getState().accessToken;
  if (!token) return null;
  return `ws://localhost:3001/?token=${encodeURIComponent(token)}`;
}

export function useWebSocket(url, options = {}) {
  const { onConnect, onDisconnect, onError, autoConnect = true } = options;
  const [connected, setConnected] = useState(globalWs?.readyState === WebSocket.OPEN);
  const [lastMessage, setLastMessage] = useState(null);

  const connect = useCallback(() => {
    if (globalWs && (globalWs.readyState === WebSocket.OPEN || globalWs.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const wsUrl = getWsUrl();
    if (!wsUrl) return;

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setConnected(true);
        onConnect?.();
        // Subscribe to standard channels
        ['queue', 'lab', 'billing', 'dashboard', 'notification'].forEach(channel => {
          ws.send(JSON.stringify({ type: 'subscribe', channel }));
        });
      };

      ws.onclose = (event) => {
        setConnected(false);
        onDisconnect?.(event);
        if (autoConnect) {
          clearTimeout(reconnectTimer);
          reconnectTimer = setTimeout(connect, 3000);
        }
      };

      ws.onerror = (err) => {
        onError?.(err);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          setLastMessage(payload);
          if (payload.type === 'event' && payload.event) {
            const eventKey = `${payload.channel}:${payload.event}`;
            listeners.get(eventKey)?.forEach(cb => cb(payload.data));
            listeners.get(payload.event)?.forEach(cb => cb(payload.data));
          }
        } catch (e) {
          // ignore non-json
        }
      };

      globalWs = ws;
    } catch (e) {
      console.warn('[WS] Native connect failed:', e);
    }
  }, [autoConnect, onConnect, onDisconnect, onError]);

  const disconnect = useCallback(() => {
    clearTimeout(reconnectTimer);
    if (globalWs) {
      globalWs.close();
      globalWs = null;
    }
    setConnected(false);
  }, []);

  const subscribe = useCallback((event, callback) => {
    if (!listeners.has(event)) {
      listeners.set(event, new Set());
    }
    listeners.get(event).add(callback);
    return () => {
      listeners.get(event)?.delete(callback);
    };
  }, []);

  const emit = useCallback((type, data = {}) => {
    if (globalWs?.readyState === WebSocket.OPEN) {
      globalWs.send(JSON.stringify({ type, ...data }));
    }
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }
  }, [autoConnect, connect]);

  return {
    connected,
    lastMessage,
    connect,
    disconnect,
    subscribe,
    emit,
  };
}

export function useQueueWebSocket(poliId, onUpdate) {
  const { subscribe, connected } = useWebSocket();

  useEffect(() => {
    if (!connected) return;
    const unsubscribe = subscribe('queue:update', (data) => {
      if (!poliId || data?.poli_id === poliId || data?.poliId === poliId) {
        onUpdate?.(data);
      }
    });
    return unsubscribe;
  }, [connected, poliId, subscribe, onUpdate]);

  return { connected };
}

export function useLabWebSocket(onUpdate) {
  const { subscribe, connected } = useWebSocket();

  useEffect(() => {
    if (!connected) return;
    const unsubscribe = subscribe('lab:update', onUpdate);
    return unsubscribe;
  }, [connected, subscribe, onUpdate]);

  return { connected };
}

export function useBillingWebSocket(onUpdate) {
  const { subscribe, connected } = useWebSocket();

  useEffect(() => {
    if (!connected) return;
    const unsubscribe = subscribe('billing:update', onUpdate);
    return unsubscribe;
  }, [connected, subscribe, onUpdate]);

  return { connected };
}

export function useNotificationWebSocket(onNotification) {
  const { subscribe, connected } = useWebSocket();

  useEffect(() => {
    if (!connected) return;
    const unsubscribe = subscribe('notification', onNotification);
    return unsubscribe;
  }, [connected, subscribe, onNotification]);

  return { connected };
}
