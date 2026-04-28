// routes/books.js — Book Web Services (Search, Detail, Insert, Update, Delete)
// ============================================

const express = require('express');
const jwt     = require('jsonwebtoken');
const db      = require('../db');
const multer  = require('multer');
const path    = require('path');
const router  = express.Router();

// Configure multer — store files in uploads/books/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../sec1_gr3_fe_src/images/books'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `book-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only image files are allowed.'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// ============================================
// Middleware — Verify JWT token (admin only)
// ============================================
function verifyAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Please log in first.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
}

// ============================================
// GET /api/books/search — Search & No-criteria search
// ============================================
// Test case 1 — search all (no criteria)
// method: GET
// URL: http://localhost:3000/api/books/search
// expected: { books: [...] } all books
//
// Test case 2 — search by title
// method: GET
// URL: http://localhost:3000/api/books/search?name=atomic
// expected: { books: [{ book_title: "Atomic Habits", ... }] }
//
// Test case 3 — search by category and price
// method: GET
// URL: http://localhost:3000/api/books/search?category_id=1&maxPrice=200
// expected: { books: [...] } fiction books priced at 200 or below

router.get('/books/search', async (req, res) => {
  const { name, author, category_id, maxPrice } = req.query;

  // Build dynamic query
  let query = `
    SELECT b.book_id, b.book_title, b.price, b.stock, b.isbn,
           b.pages, b.publish_date, b.language, b.description,
           b.cover_image,
           c.category_name,
           p.publisher_name,
           CONCAT(a.author_first_name, ' ', a.author_last_name) AS author_name
    FROM book b
    LEFT JOIN category    c ON b.category_id  = c.category_id
    LEFT JOIN publisher   p ON b.publisher_id = p.publisher_id
    LEFT JOIN book_author ba ON b.book_id     = ba.book_id
    LEFT JOIN author      a  ON ba.author_id  = a.author_id
    WHERE 1=1
  `;

  const params = [];

  // Criteria 1: book title
  if (name) {
    query += ' AND b.book_title LIKE ?';
    params.push(`%${name}%`);
  }

  // Criteria 2: author
  if (author) {
    query += ' AND CONCAT(a.author_first_name, " ", a.author_last_name) LIKE ?';
    params.push(`%${author}%`);
  }

  // Criteria 3: category
  if (category_id) {
    query += ' AND b.category_id = ?';
    params.push(category_id);
  }

  // Criteria 4: max price
  if (maxPrice) {
    query += ' AND b.price <= ?';
    params.push(maxPrice);
  }

  query += ' ORDER BY b.book_id ASC';

  try {
    const [rows] = await db.query(query, params);
    return res.json({ success: true, books: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================
// GET /api/books/:id — Book Detail
// ============================================
// Test case 1 — get details of an existing book
// method: GET
// URL: http://localhost:3000/api/books/1
// expected: { book: { book_id: 1, book_title: "Chua Fa Din Salai", ... } }
//
// Test case 2 — book not found
// method: GET
// URL: http://localhost:3000/api/books/999
// expected: { success: false, message: "Book not found." }

router.get('/books/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT b.book_id, b.book_title, b.price, b.stock, b.isbn,
              b.pages, b.publish_date, b.language, b.description,
              b.cover_image, b.edition,
              c.category_name,
              p.publisher_name,
              CONCAT(a.author_first_name, ' ', a.author_last_name) AS author_name
       FROM book b
       LEFT JOIN category    c  ON b.category_id  = c.category_id
       LEFT JOIN publisher   p  ON b.publisher_id = p.publisher_id
       LEFT JOIN book_author ba ON b.book_id      = ba.book_id
       LEFT JOIN author      a  ON ba.author_id   = a.author_id
       WHERE b.book_id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Book not found.' });
    }

    return res.json({ success: true, book: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================
// POST /api/books — Insert new book (admin only)
// ============================================
// Test case 1 — add new book successfully
// method: POST
// URL: http://localhost:3000/api/books
// headers: { Authorization: "Bearer <token>" }
// body: { "book_title": "Test Book", "price": 199, "stock": 10, "isbn": "978-000-000-000-1", "category_id": 1, "publisher_id": 1 }
// expected: { success: true, message: "Book added successfully.", book_id: ... }
//
// Test case 2 — no token
// method: POST
// URL: http://localhost:3000/api/books
// body: { "book_title": "Test Book", ... }
// expected: { success: false, message: "Please log in first." }

router.post('/books', verifyAdmin, async (req, res) => {
  const { book_title, price, stock, isbn, description, pages,
          publish_date, language, edition, cover_image,
          publisher_id, category_id } = req.body;

  // Validate required fields
  if (!book_title || !price || !isbn) {
    return res.status(400).json({ success: false, message: 'Please provide required fields (title, price, ISBN).' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO book (book_title, price, stock, isbn, description, pages,
                         publish_date, language, edition, cover_image,
                         publisher_id, category_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [book_title, price, stock || 0, isbn, description || null,
       pages || null, publish_date || null, language || null,
       edition || null, cover_image || null,
       publisher_id || null, category_id || null]
    );

    return res.json({ success: true, message: 'Book added successfully.', book_id: result.insertId });

  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'This ISBN already exists in the system.' });
    }
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================
// PUT /api/books/:id — Update book (admin only)
// ============================================
// Test case 1 — update price successfully
// method: PUT
// URL: http://localhost:3000/api/books/1
// headers: { Authorization: "Bearer <token>" }
// body: { "price": 250, "stock": 40 }
// expected: { success: true, message: "Book updated successfully." }
//
// Test case 2 — book not found
// method: PUT
// URL: http://localhost:3000/api/books/999
// headers: { Authorization: "Bearer <token>" }
// body: { "price": 250 }
// expected: { success: false, message: "Book not found." }

router.put('/books/:id', verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { book_title, price, stock, isbn, description, pages,
          publish_date, language, edition, cover_image,
          publisher_id, category_id } = req.body;

  try {
    // Check if book exists
    const [check] = await db.query('SELECT book_id FROM book WHERE book_id = ?', [id]);
    if (check.length === 0) {
      return res.status(404).json({ success: false, message: 'Book not found.' });
    }

    await db.query(
      `UPDATE book SET
        book_title   = COALESCE(?, book_title),
        price        = COALESCE(?, price),
        stock        = COALESCE(?, stock),
        isbn         = COALESCE(?, isbn),
        description  = COALESCE(?, description),
        pages        = COALESCE(?, pages),
        publish_date = COALESCE(?, publish_date),
        language     = COALESCE(?, language),
        edition      = COALESCE(?, edition),
        cover_image  = COALESCE(?, cover_image),
        publisher_id = COALESCE(?, publisher_id),
        category_id  = COALESCE(?, category_id)
       WHERE book_id = ?`,
      [book_title, price, stock, isbn, description, pages,
       publish_date, language, edition, cover_image,
       publisher_id, category_id, id]
    );

    return res.json({ success: true, message: 'Book updated successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================
// DELETE /api/books/:id — Delete book (admin only)
// ============================================
// Test case 1 — delete book successfully
// method: DELETE
// URL: http://localhost:3000/api/books/10
// headers: { Authorization: "Bearer <token>" }
// expected: { success: true, message: "Book deleted successfully." }
//
// Test case 2 — book not found
// method: DELETE
// URL: http://localhost:3000/api/books/999
// headers: { Authorization: "Bearer <token>" }
// expected: { success: false, message: "Book not found." }

router.delete('/books/:id', verifyAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    // Check if book exists
    const [check] = await db.query('SELECT book_id FROM book WHERE book_id = ?', [id]);
    if (check.length === 0) {
      return res.status(404).json({ success: false, message: 'Book not found.' });
    }

    // Delete book_author first (foreign key constraint)
    await db.query('DELETE FROM book_author WHERE book_id = ?', [id]);

    // Delete the book
    await db.query('DELETE FROM book WHERE book_id = ?', [id]);

    return res.json({ success: true, message: 'Book deleted successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================
// POST /api/books/:id/upload — Upload cover image (admin only)
// ============================================
// Test case 1 — upload image successfully
// method: POST
// URL: http://localhost:3000/api/books/1/upload
// headers: { Authorization: "Bearer <token>" }
// body: form-data, key: "cover" value: image file
// expected: { success: true, cover_image: "images/books/book-xxx.jpg" }
//
// Test case 2 — no file provided
// method: POST
// URL: http://localhost:3000/api/books/1/upload
// headers: { Authorization: "Bearer <token>" }
// expected: { success: false, message: "Please select an image file." }

router.post('/books/:id/upload', verifyAdmin, upload.single('cover'), async (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please select an image file.' });
  }

  const cover_image = `images/books/${req.file.filename}`;

  try {
    // Check if a primary image already exists
    const [existing] = await db.query(
      'SELECT image_id FROM book_images WHERE book_id = ? AND is_primary = 1',
      [id]
    );

    if (existing.length > 0) {
      // Update existing primary image
      await db.query(
        'UPDATE book_images SET image_path = ? WHERE book_id = ? AND is_primary = 1',
        [cover_image, id]
      );
    } else {
      // Insert new primary image
      await db.query(
        'INSERT INTO book_images (book_id, image_path, is_primary) VALUES (?, ?, 1)',
        [id, cover_image]
      );
    }

    // Also update cover_image in the book table
    await db.query('UPDATE book SET cover_image = ? WHERE book_id = ?', [cover_image, id]);

    return res.json({ success: true, cover_image, message: 'Cover image uploaded successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================
// POST /api/books/:id/images — Upload additional images (admin only)
// ============================================
// Test case 1 — upload additional image successfully
// method: POST
// URL: http://localhost:3000/api/books/1/images
// headers: { Authorization: "Bearer <token>" }
// body: form-data, key: "image" value: image file
// expected: { success: true, image_path: "images/books/book-xxx.jpg" }
//
// Test case 2 — no file provided
// method: POST
// URL: http://localhost:3000/api/books/1/images
// expected: { success: false, message: "Please select an image file." }

router.post('/books/:id/images', verifyAdmin, upload.single('image'), async (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please select an image file.' });
  }

  const image_path = `images/books/${req.file.filename}`;

  try {
    await db.query(
      'INSERT INTO book_images (book_id, image_path, is_primary) VALUES (?, ?, 0)',
      [id, image_path]
    );
    return res.json({ success: true, image_path, message: 'Image uploaded successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/books/:id/images — Get all images for a book
router.get('/books/:id/images', async (req, res) => {
  const { id } = req.params;
  try {
    const [images] = await db.query(
      'SELECT * FROM book_images WHERE book_id = ? ORDER BY is_primary DESC',
      [id]
    );
    return res.json({ success: true, images });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;