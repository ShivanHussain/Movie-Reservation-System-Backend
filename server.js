// server.js
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import app from './app.js';

dotenv.config({ path: 'config/config.env' });

const PORT = process.env.PORT || 5000;
const server = createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('seatSelected', (data) => {
    socket.broadcast.emit('updateSeats', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`API Docs: http://localhost:${PORT}/api/docs`);
});
