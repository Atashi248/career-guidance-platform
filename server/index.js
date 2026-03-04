const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.',
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/Profile'));
app.use('/api/readiness', require('./routes/readiness'));
app.use('/api/roadmap', require('./routes/roadmap'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/progress', require('./routes/progress'));

// Base route
app.get('/', (req, res) => {
  res.send('Career Guidance Platform API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
