const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const connectDB = require('./config/db');
const compression = require('compression');

// Connect to database
connectDB();

const app = express();

// High-Performance Payload Compression
app.use(compression());

const server = http.createServer(app);

// CORS origin check helper supporting wildcard Vercel deployments
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'];

const isOriginAllowed = (origin) => {
  if (!origin) return true; // Allow backend-to-backend / server calls
  if (allowedOrigins.includes(origin)) return true;
  try {
    const hostname = new URL(origin).hostname;
    // Allow any Vercel branch previews or custom vercel apps
    if (hostname.endsWith('.vercel.app')) return true;
  } catch (err) {}
  return false;
};

// Socket.io initialization
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Blocked by Socket.io CORS strategy'));
      }
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Initialize Crons
const { initCronJobs } = require('./services/cronService');
initCronJobs(io);

// Pass io to request object
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Socket.io JWT Authentication Middleware
const jwt = require('jsonwebtoken');

io.use((socket, next) => {
  try {
    let token = socket.handshake.auth?.token;
    
    // Fallback: parse from cookie header if the frontend relies on browser cookies for sockets
    if (!token && socket.handshake.headers.cookie) {
      const match = socket.handshake.headers.cookie.match(/accessToken_(?:admin|driver|user)=([^;]+)/);
      if (match) token = match[1];
    }

    if (!token) return next(new Error('Authentication Error: No token provided'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    socket.user = decoded; // Attach user claims { id, role } to socket instance
    next();
  } catch (err) {
    next(new Error('Authentication Error: Invalid token'));
  }
});

// Socket.io connection logic
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  socket.on('join_booking_room', (bookingId) => {
    if (bookingId) {
      socket.join(bookingId);
      console.log(`Socket ${socket.id} joined room: ${bookingId}`);
    }
  });

  socket.on('join_driver', async (driverId) => {
    if (driverId) {
      socket.join(`driver_${driverId}`);
      // Join global pool for dispatching
      socket.join('available_drivers');
      console.log(`Driver ${driverId} connected to secure room.`);

      // Automatically set driver to online in database and broadcast profile sync
      try {
        const Driver = require('./models/Driver');
        const updatedDriver = await Driver.findByIdAndUpdate(driverId, { isOnline: true }, { new: true }).select('-password');
        if (updatedDriver) {
          io.to(`driver_${driverId}`).emit('driver_updated', updatedDriver);
          console.log(`Driver ${driverId} status set to online in DB.`);
        }
      } catch (err) {
        console.error('Failed to update driver status on join:', err);
      }
    }
  });

  socket.on('join_user', (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} connected to secure room.`);
    }
  });

  socket.on('driver_location_update', (data) => {
    // data: { driverId, lat, lng, bookingId }
    // Instantly stream back to the specific booking's private room
    if (data.bookingId) {
       io.to(data.bookingId).emit('live_location', {
         lat: data.lat, 
         lng: data.lng, 
         driverId: data.driverId 
       });
    }
  });

  socket.on('send_message', async (data) => {
    try {
      const ChatMessage = require('./models/Chat');
      const chat = await ChatMessage.create({
        booking: data.bookingId,
        sender: data.senderId,
        senderModel: data.senderModel,
        message: data.message
      });
      io.to(data.bookingId).emit('receive_message', chat);
    } catch (err) {
      console.error('Chat error:', err);
    }
  });

  socket.on('disconnect', async () => {
    console.log(`User disconnected: ${socket.id}`);
    if (socket.user && socket.user.role === 'driver') {
      try {
        const Driver = require('./models/Driver');
        await Driver.findByIdAndUpdate(socket.user.id, { isOnline: false });
        console.log(`Driver ${socket.user.id} status set to offline on disconnect.`);
      } catch (err) {
        console.error('Failed to update driver status on disconnect:', err);
      }
    }
  });
});

// Global Security Middleware (using the unified allowed origins helper)
app.use(cors({
  origin: function(origin, callback) {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by Express CORS strategy'));
    }
  },
  credentials: true, // Crucial for HTTP-only cookies
}));

// Set HTTP response headers for enhanced security
app.use(helmet());

// Prevent completely NoSQL injection attacks
app.use(mongoSanitize());

// Global Rate Limiter to prevent Brute-Force/DDoS
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 300, // Limits each IP to 300 requests per 15 min window
  message: { message: 'Too many requests generated from this IP, please try again after 15 minutes' }
});
app.use('/api', globalLimiter);

app.use(express.json({ limit: '10kb' })); // Limits payload to 10kb
app.use(cookieParser());

// Basic route
app.get('/', (req, res) => {
  res.send('Cargex API is running');
});

// Define Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/drivers', require('./routes/driverRoutes'));
app.use('/api/driver', require('./routes/driverRoutes')); // Alias for Dashboard compatibility
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/wallet', require('./routes/walletRoutes'));
// app.use('/api/coupons', require('./routes/couponRoutes'));
// app.use('/api/reviews', require('./routes/reviewRoutes'));
// app.use('/api/safety', require('./routes/safetyRoutes'));
// app.use('/api/heatmap', require('./routes/heatmapRoutes'));

app.use('/api/agency', require('./routes/agencyRoutes'));

// Pricing Engine API
app.use('/api/fare', require('./routes/fareRoutes'));

// Phase 2 Universal Logistics Routes — with HTTP caching for static data
app.use('/api/universal', (req, res, next) => {
  // Categories and cargo types change infrequently — cache for 1 hour
  if (req.method === 'GET') {
    res.set('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  }
  next();
}, require('./routes/universalBookingRoutes'));
app.use('/api/admin-system', require('./routes/adminSystemRoutes'));

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
