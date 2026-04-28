// detail.js — Fetch book data from Detail Web Service

const API_URL = 'http://localhost:3000';

const COVER_GRADIENTS = [
  'linear-gradient(135deg,#3b82f6,#1d4ed8)',
  'linear-gradient(135deg,#60a5fa,#2563eb)',
  'linear-gradient(135deg,#6c8ebf,#2a4a8a)',
  'linear-gradient(135deg,#7ec8a0,#1e6640)',
  'linear-gradient(135deg,#d4a5d0,#8e4a8e)',
  'linear-gradient(135deg,#e8c87c,#b07820)',
];

let currentStock = 0;

function getToken() {
  return sessionStorage.getItem('userToken') || '';
}

window.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const bookId = params.get('id');
  if (!bookId) { showError(); return; }

  try {
    const response = await fetch(`${API_URL}/api/books/${bookId}`);
    if (!response.ok) { showError(); return; }
    const data = await response.json();
    renderDetail(data.book);
  } catch (err) {
    showError();
  }
});

function renderDetail(book) {
  document.getElementById('detailLoading').classList.add('hidden');
  document.getElementById('detailContent').classList.remove('hidden');

  currentStock = book.stock || 0;

  const gradient = COVER_GRADIENTS[book.book_id % COVER_GRADIENTS.length];
  const coverEl = document.getElementById('detailCover');
  if (book.cover_image) {
    // Has image from server — display real image
    coverEl.style.background = '#0f1e3d';
    coverEl.style.padding = '0';
    coverEl.style.overflow = 'hidden';
    coverEl.innerHTML = `<img src="http://localhost:3000/${book.cover_image}"
      alt="${book.book_title}"
      style="width:100%; height:100%; object-fit:cover; display:block;"
      onerror="this.parentElement.style.background='${gradient}'; this.remove();" />`;
  } else {
    // No image — use gradient
    coverEl.style.background = gradient;
    coverEl.innerHTML = `<span class="book-cover-title" style="padding:1.5rem;">${book.book_title}</span>`;
  }
  document.title = `${book.book_title} | JUBJUB BOOK STORE`;

  document.getElementById('detailTitle').textContent     = book.book_title;
  document.getElementById('detailAuthor').textContent    = `By ${book.author_name || '—'}`;
  document.getElementById('detailPrice').textContent     = `฿${Number(book.price).toLocaleString()}`;
  document.getElementById('detailType').textContent      = book.category_name  || '—';
  document.getElementById('detailISBN').textContent      = book.isbn           || '—';
  document.getElementById('detailPublisher').textContent = book.publisher_name || '—';
  document.getElementById('detailPages').textContent     = book.pages ? `${book.pages} pages` : '—';
  document.getElementById('detailYear').textContent      = book.publish_date
    ? new Date(book.publish_date).getFullYear() : '—';

  // Show stock with status color
  const stockEl = document.getElementById('detailStock');
  if (currentStock === 0) {
    stockEl.innerHTML = '<span style="color:#ef4444; font-weight:700;">Out of Stock</span>';
    document.getElementById('addCartBtn').disabled = true;
    document.getElementById('addCartBtn').style.opacity = '0.5';
  } else if (currentStock <= 5) {
    stockEl.innerHTML = `<span style="color:#f59e0b; font-weight:700;">${currentStock} book(s) (Low Stock)</span>`;
  } else {
    stockEl.innerHTML = `<span style="color:#22c55e; font-weight:700;">${currentStock} book(s)</span>`;
  }

  document.getElementById('detailDesc').textContent = book.description || 'No description available';

  // Set max qty
  document.getElementById('qtyInput').max = currentStock;
}

// +/- buttons
function changeQty(delta) {
  const input = document.getElementById('qtyInput');
  let val = parseInt(input.value) + delta;
  val = Math.max(1, Math.min(val, currentStock));
  input.value = val;

  // Check warning
  document.getElementById('stockWarning').style.display =
    val > currentStock ? 'block' : 'none';
}

// Add to cart
async function addToCart(bookId) {
  const token = getToken();
  if (!token) {
    alert('Please log in before adding items to the cart');
    window.location.href = 'user-login.html';
    return;
  }

  const quantity = parseInt(document.getElementById('qtyInput').value) || 1;

  if (quantity > currentStock) {
    document.getElementById('stockWarning').style.display = 'block';
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ book_id: bookId, quantity }),
    });

    const data = await response.json();

    if (data.success) {
      alert(`Added to cart successfully 🛒 (Quantity: ${quantity} book(s))`);
      loadCartBadge(token);
    } else {
      alert(data.message);
    }
  } catch (err) {
    alert('Unable to connect to the server');
  }
}

async function loadCartBadge(token) {
  try {
    const response = await fetch(`${API_URL}/api/cart`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    const badge = document.getElementById('cart-badge');
    if (badge && data.cart && data.cart.length > 0) {
      badge.textContent = data.cart.length;
      badge.classList.remove('hidden');
    }
  } catch (err) {}
}

function showError() {
  document.getElementById('detailLoading').classList.add('hidden');
  document.getElementById('detailError').classList.remove('hidden');
}