require('dotenv').config();
const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');

// Database connection
require('./utils/MongooseUtil');

const app    = express();
const server = http.createServer(app);

// ── Socket.io ────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',  // admin
      'http://localhost:3002',  // customer
      'http://localhost:3001'
    ],
    methods: ['GET', 'POST']
  }
});

// Make io available to route handlers via req.app.get('io')
app.set('io', io);

io.on('connection', (socket) => {
  console.log('[Socket.io] Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('[Socket.io] Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

// ── Middlewares ──────────────────────────────────────────────────────────────
const bodyParser = require('body-parser');
const path = require('path');
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '100mb' }));

// Serve static files from uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-access-token');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/admin',    require('./api/admin.js'));
app.use('/api/customer', require('./api/customer.js'));
app.use('/api/customer', require('./api/cart.js'));       // cart routes
app.use('/api',          require('./api/checkout.js'));    // new checkout routes
app.get('/hello', (req, res) => {
  res.json({ message: 'Hello from server!' });
});

// ── Error handling ───────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
});
