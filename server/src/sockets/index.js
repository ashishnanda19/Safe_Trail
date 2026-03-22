import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

let io = null;

/**
 * Initialize Socket.io on the HTTP server.
 * Call once from server.js.
 */
export const initSocketIO = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // JWT authentication middleware for WebSocket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('Authentication required. Provide token in socket.handshake.auth.token'));
    }

    try {
      const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET);
      socket.userId = decoded.id;
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Invalid or expired token.'));
    }
  });

  io.on('connection', async (socket) => {
    const { userId } = socket;
    console.log(`🔌 Socket connected: userId=${userId}`);

    // Auto-join personal SOS room and private User room
    socket.join(`sos:${userId}`);
    socket.join(`user:${userId}`);

    // Fetch and join rooms for everyone this user is a guardian for
    try {
      const { db } = await import('../config/db.js');
      const result = await db.query(
        `SELECT user_id FROM guardian_circles
         WHERE guardian_id = $1 AND status = 'accepted'`,
        [userId]
      );
      result.rows.forEach(row => {
        socket.join(`sos:${row.user_id}`);
      });
      console.log(`👥 User ${userId} auto-joined ${result.rows.length} guardian rooms`);
    } catch (err) {
      console.error(`[Socket] Failed to auto-join guardian rooms for user ${userId}:`, err.message);
    }

    // Register SOS room handlers
    socket.on('sos:join', ({ targetUserId }) => {
      socket.join(`sos:${targetUserId}`);
      console.log(`👀 User ${userId} joined SOS room for user ${targetUserId}`);
    });

    socket.on('sos:leave', ({ targetUserId }) => {
      socket.leave(`sos:${targetUserId}`);
    });

    // Register map/location tracking handlers
    socket.on('map:join-sos', async ({ sosEventId }) => {
      socket.join(`map:${sosEventId}`);
      console.log(`🗺️  User ${userId} joined map room sos:${sosEventId}`);

      // Emit last 10 pings as catch-up for the joining client
      try {
        const { db } = await import('../config/db.js');
        const result = await db.query(
          `SELECT
             ST_X(coordinates::geometry) AS longitude,
             ST_Y(coordinates::geometry) AS latitude,
             accuracy, pinged_at
           FROM location_pings
           WHERE sos_event_id = $1
           ORDER BY pinged_at DESC
           LIMIT 10`,
          [sosEventId]
        );
        socket.emit('map:catch-up', {
          sosEventId,
          pings: result.rows.reverse(),
        });
      } catch (err) {
        console.error('[Socket] map:join-sos catch-up error:', err.message);
      }
    });

    socket.on('map:location-update', async ({ sosEventId, lat, lng, accuracy }) => {
      try {
        const { db } = await import('../config/db.js');
        const coordinates = `SRID=4326;POINT(${lng} ${lat})`;
        await db.query(
          `INSERT INTO location_pings (sos_event_id, coordinates, accuracy)
           VALUES ($1, ST_GeomFromEWKT($2), $3)`,
          [sosEventId, coordinates, accuracy || null]
        );

        io.to(`map:${sosEventId}`).emit('map:position', {
          lat,
          lng,
          accuracy,
          timestamp: new Date().toISOString(),
          sosEventId,
        });
      } catch (err) {
        console.error('[Socket] map:location-update error:', err.message);
      }
    });

    socket.on('map:sos-resolved', ({ sosEventId }) => {
      io.to(`map:${sosEventId}`).emit('map:tracking-ended', { sosEventId });
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: userId=${userId}, reason=${reason}`);
    });
  });

  return io;
};

/**
 * Emit an event to all sockets in a named room.
 * Used by services to broadcast without direct io reference.
 */
export const emitToRoom = (room, event, data) => {
  if (!io) {
    console.warn(`[Socket] emitToRoom called before Socket.io initialized: room=${room} event=${event}`);
    return;
  }
  io.to(room).emit(event, data);
};

export const getIO = () => io;
