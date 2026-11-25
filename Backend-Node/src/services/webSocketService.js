// WebSocket Service

import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { redis } from '../config/redis.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

const channels = new Map();

export function attachWebSocketServer(server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request, decoded);
      });
    });
  });

  wss.on('connection', (ws, req, user) => {
    ws.user = user;
    ws.channels = new Set();
    console.info('[WS] Client connected', { userId: user.id, username: user.username });

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        handleMessage(ws, msg);
      } catch (error) {
        console.error('[WS] Invalid message:', error.message);
        ws.send(JSON.stringify({ type: 'error', message: 'Format pesan tidak valid' }));
      }
    });

    ws.on('close', () => {
      for (const channel of ws.channels) {
        const subs = channels.get(channel);
        if (subs) {
          subs.delete(ws);
          if (subs.size === 0) channels.delete(channel);
        }
      }
      console.info('[WS] Client disconnected', { userId: user.id });
    });

    ws.on('error', (error) => {
      console.error('[WS] Error:', error.message);
    });
  });

  console.info('[WS] WebSocket server attached');
  return wss;
}

function handleMessage(ws, msg) {
  switch (msg.type) {
    case 'subscribe':
      if (msg.channel && typeof msg.channel === 'string') {
        subscribeChannel(ws, msg.channel);
        ws.send(JSON.stringify({ type: 'subscribed', channel: msg.channel }));
      }
      break;
    case 'unsubscribe':
      if (msg.channel && typeof msg.channel === 'string') {
        unsubscribeChannel(ws, msg.channel);
        ws.send(JSON.stringify({ type: 'unsubscribed', channel: msg.channel }));
      }
      break;
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      break;
    default:
      ws.send(JSON.stringify({ type: 'error', message: `Tipe pesan tidak dikenal: ${msg.type}` }));
  }
}

function subscribeChannel(ws, channel) {
  if (!channels.has(channel)) channels.set(channel, new Set());
  channels.get(channel).add(ws);
  ws.channels.add(channel);
}

function unsubscribeChannel(ws, channel) {
  const subs = channels.get(channel);
  if (subs) {
    subs.delete(ws);
    if (subs.size === 0) channels.delete(channel);
  }
  ws.channels.delete(channel);
}

// Broadcast ke channel
export function broadcast(channel, event, data) {
  const message = JSON.stringify({
    type: 'event', channel, event, data, timestamp: Date.now(),
  });
  const subs = channels.get(channel);
  if (subs) {
    for (const ws of subs) {
      if (ws.readyState === 1) ws.send(message);
    }
  }
  redis.publish(`ws:${channel}`, message).catch((err) => console.error('[WS] Redis publish error:', err.message));
}

// Subscribe Redis channel untuk multi-instance
export async function subscribeRedisChannels() {
  try {
    // Use shared redis instance for subscribing
    await redis.subscribe('ws:lab', 'ws:queue', 'ws:billing', 'ws:dashboard');
    redis.on('message', (channel, message) => {
      const wsChannel = channel.replace('ws:', '');
      broadcast(wsChannel, 'sync', JSON.parse(message));
    });
    console.info('[WS] Subscribed to Redis channels');
  } catch (err) {
    console.warn('[WS] Redis subscribe failed (will work in single-instance mode):', err.message);
  }
}

// Channel helpers
export const Channels = {
  LAB: 'lab',
  QUEUE: 'queue',
  BILLING: 'billing',
  DASHBOARD: 'dashboard',

  labUpdate(labId, status, data) {
    broadcast(this.LAB, 'update', { labId, status, ...data });
  },

  queueUpdate(poliId, queueData) {
    broadcast(this.QUEUE, 'update', { poliId, ...queueData });
  },

  billingUpdate(billingId, status, data) {
    broadcast(this.BILLING, 'update', { billingId, status, ...data });
  },

  dashboardRefresh() {
    broadcast(this.DASHBOARD, 'refresh', {});
  },
};

export default {
  attachWebSocketServer,
  broadcast,
  subscribeRedisChannels,
  Channels,
};
