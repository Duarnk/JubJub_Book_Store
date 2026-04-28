// routes/cart.js — Cart Web Service
// ============================================

const express = require('express');
const jwt     = require('jsonwebtoken');
const db      = require('../db');
const router  = express.Router();

// Middleware — Verify JWT token (user)
function verifyUser(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Please log in first.' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
}

// ============================================
// GET /api/cart — Get user's cart
// ============================================
// Test case 1 — cart with items
// method: GET
// URL: http://localhost:3000/api/cart
// headers: { Authorization: "Bearer <token>" }
// expected: { success: true, cart: [...], total: 1825 }
//
// Test case 2 — empty cart
// method: GET
// URL: http://localhost:3000/api/cart
// headers: { Authorization: "Bearer <token>" }
// expected: { success: true, cart: [], total: 0 }

router.get('/cart', verifyUser, async (req, res) => {
  const user_id = req.user.user_id;
  try {
    const [rows] = await db.query(
      `SELECT c.cart_id, c.quantity, c.added_at,
              b.book_id, b.book_title, b.price, b.stock, b.cover_image,
              cat.category_name,
              CONCAT(a.author_first_name, ' ', a.author_last_name) AS author_name
       FROM cart c
       JOIN book b            ON c.book_id     = b.book_id
       LEFT JOIN category cat ON b.category_id = cat.category_id
       LEFT JOIN book_author ba ON b.book_id   = ba.book_id
       LEFT JOIN author a       ON ba.author_id = a.author_id
       WHERE c.user_id = ?
       ORDER BY c.added_at DESC`,
      [user_id]
    );
    const total = rows.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
    return res.json({ success: true, cart: rows, total });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================
// POST /api/cart — Add book to cart
// ============================================
// Test case 1 — add new book
// method: POST
// URL: http://localhost:3000/api/cart
// headers: { Authorization: "Bearer <token>" }
// body: { "book_id": 1, "quantity": 2 }
// expected: { success: true, message: "Book added to cart successfully." }
//
// Test case 2 — insufficient stock
// method: POST
// URL: http://localhost:3000/api/cart
// headers: { Authorization: "Bearer <token>" }
// body: { "book_id": 1, "quantity": 999 }
// expected: { success: false, message: "Insufficient stock." }

router.post('/cart', verifyUser, async (req, res) => {
  const user_id = req.user.user_id;
  const { book_id, quantity = 1 } = req.body;

  if (!book_id) return res.status(400).json({ success: false, message: 'Please specify a book.' });

  try {
    // Check stock
    const [bookRows] = await db.query('SELECT stock FROM book WHERE book_id = ?', [book_id]);
    if (bookRows.length === 0) return res.status(404).json({ success: false, message: 'Book not found.' });

    const stock = bookRows[0].stock;
    if (quantity > stock) {
      return res.status(400).json({ success: false, message: `Insufficient stock. (${stock} left)` });
    }

    // Check if already in cart
    const [existing] = await db.query(
      'SELECT cart_id, quantity FROM cart WHERE user_id = ? AND book_id = ?',
      [user_id, book_id]
    );

    if (existing.length > 0) {
      const newQty = existing[0].quantity + quantity;
      if (newQty > stock) {
        return res.status(400).json({ success: false, message: `Insufficient stock. (${stock} left)` });
      }
      await db.query('UPDATE cart SET quantity = ? WHERE cart_id = ?', [newQty, existing[0].cart_id]);
      return res.json({ success: true, message: 'Cart quantity updated successfully.' });
    }

    await db.query(
      'INSERT INTO cart (user_id, book_id, quantity) VALUES (?, ?, ?)',
      [user_id, book_id, quantity]
    );
    return res.json({ success: true, message: 'Book added to cart successfully.' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================
// PUT /api/cart/:cart_id — Update cart item quantity
// ============================================
// Test case 1 — update quantity successfully
// method: PUT
// URL: http://localhost:3000/api/cart/1
// headers: { Authorization: "Bearer <token>" }
// body: { "quantity": 3 }
// expected: { success: true, message: "Cart quantity updated successfully." }
//
// Test case 2 — quantity exceeds stock
// method: PUT
// URL: http://localhost:3000/api/cart/1
// headers: { Authorization: "Bearer <token>" }
// body: { "quantity": 999 }
// expected: { success: false, message: "Insufficient stock." }

router.put('/cart/:cart_id', verifyUser, async (req, res) => {
  const user_id  = req.user.user_id;
  const { cart_id } = req.params;
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    return res.status(400).json({ success: false, message: 'Quantity must be greater than 0.' });
  }

  try {
    // Check that the cart item belongs to this user
    const [check] = await db.query(
      'SELECT c.cart_id, b.stock FROM cart c JOIN book b ON c.book_id = b.book_id WHERE c.cart_id = ? AND c.user_id = ?',
      [cart_id, user_id]
    );
    if (check.length === 0) return res.status(404).json({ success: false, message: 'Cart item not found.' });

    if (quantity > check[0].stock) {
      return res.status(400).json({ success: false, message: `Insufficient stock. (${check[0].stock} left)` });
    }

    await db.query('UPDATE cart SET quantity = ? WHERE cart_id = ?', [quantity, cart_id]);
    return res.json({ success: true, message: 'Cart quantity updated successfully.' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================
// DELETE /api/cart/:cart_id — Remove book from cart
// ============================================
// Test case 1 — remove successfully
// method: DELETE
// URL: http://localhost:3000/api/cart/1
// headers: { Authorization: "Bearer <token>" }
// expected: { success: true, message: "Item removed from cart successfully." }
//
// Test case 2 — item does not belong to this user
// method: DELETE
// URL: http://localhost:3000/api/cart/999
// headers: { Authorization: "Bearer <token>" }
// expected: { success: false, message: "Cart item not found." }

router.delete('/cart/:cart_id', verifyUser, async (req, res) => {
  const user_id = req.user.user_id;
  const { cart_id } = req.params;
  try {
    const [check] = await db.query(
      'SELECT cart_id FROM cart WHERE cart_id = ? AND user_id = ?',
      [cart_id, user_id]
    );
    if (check.length === 0) return res.status(404).json({ success: false, message: 'Cart item not found.' });

    await db.query('DELETE FROM cart WHERE cart_id = ?', [cart_id]);
    return res.json({ success: true, message: 'Item removed from cart successfully.' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;