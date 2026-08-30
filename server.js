require('dotenv').config({ path: '.env' });

const express = require('express');
const http = require('http');
const next = require('next');
const { Server } = require('socket.io');
const mongoose = require('mongoose');

const dev = process.env.NODE_ENV !== 'production';
const port = process.env.PORT || 3000;
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('MongoDB connected');
    } catch (error) {
      console.error('MongoDB connection failed:', error.message);
    }
  }

  const expressApp = express();
  const server = http.createServer(expressApp);
  const allowedOrigins = [
    process.env.CLIENT_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    'http://localhost:3000',
    'http://localhost:5000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5000',
  ].filter(Boolean);

  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        // Allow same-origin (no origin header) and explicitly listed origins
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        // Allow any *.onrender.com origin in production
        if (origin.endsWith('.onrender.com')) {
          callback(null, true);
          return;
        }
        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    },
  });
  global.__treasureHuntIO = io;

  expressApp.use((req, res, nextFn) => {
    req.io = io;
    nextFn();
  });

  io.on('connection', (socket) => {
    socket.on('join_leaderboard', () => socket.join('leaderboard_room'));
    socket.on('join_team_room', ({ teamId, accessCode } = {}) => {
      if (teamId) {
        socket.join(`team_${String(teamId)}`);
      }
      if (accessCode) {
        socket.join(`team_${String(accessCode).toUpperCase()}`);
      }
    });
  });

  expressApp.all('*', (req, res) => handle(req, res));

  server.listen(port, '0.0.0.0', () => {
    console.log(`Treasure Hunt server ready on http://localhost:${port}`);
  });
});
