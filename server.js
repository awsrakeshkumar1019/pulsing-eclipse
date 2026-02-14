const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Store rooms and their participants
const rooms = new Map();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join a room
    socket.on('join-room', ({ roomId, userName }) => {
      socket.join(roomId);

      // Initialize room if it doesn't exist
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Map());
      }

      const room = rooms.get(roomId);
      room.set(socket.id, {
        userName: userName || `User-${socket.id.slice(0, 4)}`,
        joinedAt: Date.now(),
      });

      console.log(`${userName} joined room ${roomId}. Room size: ${room.size}`);

      // Send existing participants to the new user
      const existingUsers = [];
      room.forEach((user, id) => {
        if (id !== socket.id) {
          existingUsers.push({ id, userName: user.userName });
        }
      });
      socket.emit('existing-users', existingUsers);

      // Notify others in the room
      socket.to(roomId).emit('user-joined', {
        id: socket.id,
        userName: room.get(socket.id).userName,
      });

      // Update participant count for everyone
      io.to(roomId).emit('participant-count', room.size);
    });

    // WebRTC signaling: sending offer
    socket.on('signal-offer', ({ to, signal, userName }) => {
      io.to(to).emit('signal-offer', {
        from: socket.id,
        signal,
        userName,
      });
    });

    // WebRTC signaling: sending answer
    socket.on('signal-answer', ({ to, signal }) => {
      io.to(to).emit('signal-answer', {
        from: socket.id,
        signal,
      });
    });

    // Chat message
    socket.on('chat-message', ({ roomId, message, userName }) => {
      io.to(roomId).emit('chat-message', {
        id: Date.now().toString(),
        senderId: socket.id,
        userName,
        message,
        timestamp: new Date().toISOString(),
      });
    });

    // Toggle audio/video status
    socket.on('media-toggle', ({ roomId, type, enabled }) => {
      socket.to(roomId).emit('media-toggle', {
        userId: socket.id,
        type,
        enabled,
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);

      // Remove user from all rooms
      rooms.forEach((room, roomId) => {
        if (room.has(socket.id)) {
          room.delete(socket.id);

          // Notify others
          socket.to(roomId).emit('user-left', { id: socket.id });
          io.to(roomId).emit('participant-count', room.size);

          // Clean up empty rooms
          if (room.size === 0) {
            rooms.delete(roomId);
          }
        }
      });
    });

    // Leave room explicitly
    socket.on('leave-room', ({ roomId }) => {
      socket.leave(roomId);
      const room = rooms.get(roomId);
      if (room) {
        room.delete(socket.id);
        socket.to(roomId).emit('user-left', { id: socket.id });
        io.to(roomId).emit('participant-count', room.size);

        if (room.size === 0) {
          rooms.delete(roomId);
        }
      }
    });
  });

  server.listen(port, () => {
    console.log(`> MeetUp ready on http://${hostname}:${port}`);
  });
});
