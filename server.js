const express      = require('express');
const mongoose     = require('mongoose');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const morgan       = require('morgan');
const { createServer } = require('http');
const { Server }   = require('socket.io');
require('dotenv').config();
 
const app        = express();
const httpServer = createServer(app);
 
// ── Socket.io ─────────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin:      process.env.CLIENT_URL,
    credentials: true,
  },
});
 
// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.CLIENT_URL,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use('/uploads', express.static('uploads'));
app.set('io', io);
 
// ── Database ──────────────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✓  MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));
 
// ── Routes ────────────────────────────────────────────────────────────────────
// app.use((req, res, next) => {
//   console.log('AUTH HEADER:', req.headers.authorization);
//   next();
// });
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/schools', require('./routes/schoolRoutes'));

// Health check
app.get('/', (req, res) =>
  res.json({ message: 'Skillzza CRM API running', version: '1.0.0' })
);
 
// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});
 
// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error.',
  });
});
 
// ── Socket.io ─────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  socket.on('join_school', (schoolId) => socket.join(`school_${schoolId}`));
  socket.on('disconnect', () => console.log(`Socket disconnected: ${socket.id}`));
});
 
// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () =>
  console.log(`✓  Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`)
);