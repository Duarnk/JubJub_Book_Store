// routes/orders.js — Checkout & Order History
// ============================================

const express = require('express');
const jwt     = require('jsonwebtoken');
const db      = require('../db');
const router  = express.Router();

// Middleware — ตรวจสอบ JWT token (user)
function verifyUser(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'login first' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token out of date' });
  }
}

// ============================================
// POST /api/checkout — สั่งซื้อ
// ============================================
// Test case 1 — checkout สำเร็จ
// method: POST
// URL: http://localhost:3000/api/checkout
// headers: { Authorization: "Bearer <token>" }
// body: { "address": "123 ถ.สุขุมวิท กรุงเทพฯ" }
// expected: { success: true, message: "สั่งซื้อสำเร็จ", order_id: 1 }
//
// Test case 2 — ตะกร้าว่าง
// method: POST
// URL: http://localhost:3000/api/checkout
// headers: { Authorization: "Bearer <token>" }
// body: { "address": "123 ถ.สุขุมวิท กรุงเทพฯ" }
// expected: { success: false, message: "ไม่มีสินค้าในตะกร้า" }

router.post('/checkout', verifyUser, async (req, res) => {
  const user_id = req.user.user_id;
  const { address } = req.body;

  if (!address) {
    return res.status(400).json({ success: false, message: 'fill in the address' });
  }

  try {
    // ดึงรายการในตะกร้า
    const [cartItems] = await db.query(
      `SELECT c.cart_id, c.book_id, c.quantity, b.price, b.stock, b.book_title
       FROM cart c
       JOIN book b ON c.book_id = b.book_id
       WHERE c.user_id = ?`,
      [user_id]
    );

    if (cartItems.length === 0) {
      return res.status(400).json({ success: false, message: 'no items in cart' });
    }

    // ตรวจสอบ stock ทุกรายการ
    for (const item of cartItems) {
      if (item.quantity > item.stock) {
        return res.status(400).json({
          success: false,
          message: `"${item.book_title}" stock not enough (only ${item.stock} left)`
        });
      }
    }

    // คำนวณยอดรวม
    const total = cartItems.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);

    // สร้าง order
    const [orderResult] = await db.query(
      'INSERT INTO orders (user_id, total, address, status) VALUES (?, ?, ?, ?)',
      [user_id, total, address, 'pending']
    );
    const order_id = orderResult.insertId;

    // สร้าง order_items + ลด stock
    for (const item of cartItems) {
      await db.query(
        'INSERT INTO order_items (order_id, book_id, quantity, price) VALUES (?, ?, ?, ?)',
        [order_id, item.book_id, item.quantity, item.price]
      );
      await db.query(
        'UPDATE book SET stock = stock - ? WHERE book_id = ?',
        [item.quantity, item.book_id]
      );
    }

    // ล้างตะกร้า
    await db.query('DELETE FROM cart WHERE user_id = ?', [user_id]);

    return res.json({ success: true, message: 'order placed successfully', order_id });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================
// GET /api/orders — ดู order history
// ============================================
// Test case 1 — ดู orders ที่มี
// method: GET
// URL: http://localhost:3000/api/orders
// headers: { Authorization: "Bearer <token>" }
// expected: { success: true, orders: [...] }
//
// Test case 2 — ยังไม่มี order
// method: GET
// URL: http://localhost:3000/api/orders
// headers: { Authorization: "Bearer <token>" }
// expected: { success: true, orders: [] }

router.get('/orders', verifyUser, async (req, res) => {
  const user_id = req.user.user_id;

  try {
    const [orders] = await db.query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY ordered_at DESC',
      [user_id]
    );

    // ดึง order_items ของแต่ละ order
    for (const order of orders) {
      const [items] = await db.query(
        `SELECT oi.quantity, oi.price,
                b.book_title, b.book_id
         FROM order_items oi
         JOIN book b ON oi.book_id = b.book_id
         WHERE oi.order_id = ?`,
        [order.order_id]
      );
      order.items = items;
    }

    return res.json({ success: true, orders });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
