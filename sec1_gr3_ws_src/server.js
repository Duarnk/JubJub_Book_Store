// server.js — JUBJUB BOOK STORE Web Service Entry Point

const express = require('express');
const cors    = require('cors');
const path    = require('path');
require('dotenv').config();

const authRouter   = require('./routes/auth');
const booksRouter  = require('./routes/books');
const cartRouter   = require('./routes/cart');
const ordersRouter = require('./routes/orders');

const app  = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files จาก frontend (สำหรับรูปปกหนังสือ)
app.use('/images', express.static(path.join(__dirname, '../sec1_gr3_fe_src/images')));

// Routes
app.use('/api', authRouter);
app.use('/api', booksRouter);
app.use('/api', cartRouter);
app.use('/api', ordersRouter);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'JUBJUB BOOK STORE API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
