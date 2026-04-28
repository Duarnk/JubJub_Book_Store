// routes/auth.js — Authentication Web Service
// ============================================

const express = require('express');
const jwt     = require('jsonwebtoken');
const db      = require('../db');
const router  = express.Router();

// ============================================
// POST /api/login-admin
// ============================================
// Test case 1 — successful login
// method: POST
// URL: http://localhost:3000/api/login-admin
// body: { "username": "admin", "password": "1234" }
// expected: { success: true, token: "..." }
//
// Test case 2 — wrong password
// method: POST
// URL: http://localhost:3000/api/login-admin
// body: { "username": "admin", "password": "wrong" }
// expected: { success: false, message: "Invalid username or password" }

router.post('/login-admin', async (req, res) => {
  const { username, password } = req.body;

  // Validate input
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
  }

  try {
    // Find admin by username
    const [rows] = await db.query(
      'SELECT * FROM admin WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    const admin = rows[0];

    // Compare password (plain text)
    const isMatch = password === admin.password;

    if (!isMatch) {
      // Record login log — failed
      await db.query(
        'INSERT INTO login_logs (admin_id, status) VALUES (?, ?)',
        [admin.admin_id, 'failed']
      );
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    // Record login log — success
    await db.query(
      'INSERT INTO login_logs (admin_id, status) VALUES (?, ?)',
      [admin.admin_id, 'success']
    );

    // Generate JWT token
    const token = jwt.sign(
      { admin_id: admin.admin_id, username: admin.username, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({
      success: true,
      token,
      admin: {
        admin_id:   admin.admin_id,
        username:   admin.username,
        first_name: admin.admin_first_name,
        last_name:  admin.admin_last_name,
      },
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================
// POST /api/login-user
// ============================================
// Test case 1 — successful login
// method: POST
// URL: http://localhost:3000/api/login-user
// body: { "username": "somchai@email.com", "password": "1234" }
// expected: { success: true, token: "..." }
//
// Test case 2 — user not found
// method: POST
// URL: http://localhost:3000/api/login-user
// body: { "username": "notexist@email.com", "password": "1234" }
// expected: { success: false, message: "Invalid username or password" }

router.post('/login-user', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
  }

  try {
    // Find user by email
    const [rows] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    const user = rows[0];

    // Compare password (plain text)
    const isMatch = password === user.password;

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({
      success: true,
      token,
      user: {
        user_id:    user.user_id,
        first_name: user.first_name,
        last_name:  user.last_name,
        email:      user.email,
      },
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================
// POST /api/register-user
// ============================================
// Test case 1 — successful registration
// method: POST
// URL: http://localhost:3000/api/register-user
// body: { "first_name": "Test", "last_name": "User", "email": "test@email.com", "password": "1234", "phone": "0812345699" }
// expected: { success: true, message: "Registration successful" }
//
// Test case 2 — duplicate email
// method: POST
// URL: http://localhost:3000/api/register-user
// body: { "email": "somchai@email.com", "password": "1234", ... }
// expected: { success: false, message: "This email is already in use." }

router.post('/register-user', async (req, res) => {
  const { first_name, last_name, email, password, phone, address } = req.body;

  if (!first_name || !last_name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
  }

  try {
    // Check for duplicate email
    const [existing] = await db.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'This email is already in use.' });
    }

    await db.query(
      'INSERT INTO users (first_name, last_name, email, password, phone, address) VALUES (?, ?, ?, ?, ?, ?)',
      [first_name, last_name, email, password, phone || null, address || null]
    );

    return res.json({ success: true, message: 'Registration successful.' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================
// POST /api/register-admin
// ============================================
// Test case 1 — successful admin registration
// method: POST
// URL: http://localhost:3000/api/register-admin
// body: { "admin_first_name": "Test", "admin_last_name": "Admin", "username": "newadmin", "password": "1234", "email": "newadmin@jubjub.com" }
// expected: { success: true, message: "Admin account created successfully" }
//
// Test case 2 — duplicate username
// method: POST
// URL: http://localhost:3000/api/register-admin
// body: { "username": "admin", ... }
// expected: { success: false, message: "This username is already in use." }

router.post('/register-admin', async (req, res) => {
  const { admin_first_name, admin_last_name, username, password, email } = req.body;

  if (!admin_first_name || !admin_last_name || !username || !password) {
    return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
  }

  try {
    // Check for duplicate username
    const [existing] = await db.query('SELECT admin_id FROM admin WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'This username is already in use.' });
    }

    await db.query(
      'INSERT INTO admin (admin_first_name, admin_last_name, username, password, email) VALUES (?, ?, ?, ?, ?)',
      [admin_first_name, admin_last_name, username, password, email || null]
    );

    return res.json({ success: true, message: 'Admin account created successfully.' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;