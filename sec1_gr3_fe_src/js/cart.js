// cart.js — Shopping Cart (used only on cart.html)

const CART_API = 'http://localhost:3000';

const CART_GRADIENTS = [
  'linear-gradient(135deg,#3b82f6,#1d4ed8)',
  'linear-gradient(135deg,#60a5fa,#2563eb)',
  'linear-gradient(135deg,#6c8ebf,#2a4a8a)',
  'linear-gradient(135deg,#7ec8a0,#1e6640)',
  'linear-gradient(135deg,#d4a5d0,#8e4a8e)',
  'linear-gradient(135deg,#e8c87c,#b07820)',
];

function getCartToken() {
  return sessionStorage.getItem('userToken') || '';
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(loadCart, 100);
});

async function loadCart() {
  const token = getCartToken();
  if (!token) {
    window.location.href = 'user-login.html';
    return;
  }

  try {
    const response = await fetch(`${CART_API}/api/cart`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();

    document.getElementById('cart-loading').classList.add('hidden');

    if (!data.cart || data.cart.length === 0) {
      document.getElementById('cart-empty').classList.remove('hidden');
      return;
    }

    renderCart(data.cart, data.total);

  } catch (err) {
    document.getElementById('cart-loading').textContent = 'Unable to load data';
  }
}

function renderCart(items, total) {
  const cartList = document.getElementById('cart-list');
  cartList.innerHTML = '';

  items.forEach(item => {
    const gradient = CART_GRADIENTS[item.book_id % CART_GRADIENTS.length];
    const div = document.createElement('article');
    div.className = 'cart-item';
    div.innerHTML = `
      <div class="cart-cover" style="background:${gradient};">
        ${item.book_title.substring(0, 20)}
      </div>
      <div class="cart-info">
        <p class="cart-title">${item.book_title}</p>
        <p class="cart-author">${item.author_name || '—'}</p>
        <p class="cart-price">฿${Number(item.price).toLocaleString()} / book</p>
        <p style="font-size:0.8rem; color:var(--color-text-muted);">In stock: ${item.stock} book(s)</p>
      </div>
      <div class="cart-qty">
        <button class="qty-btn" onclick="updateQty(${item.cart_id}, ${item.quantity - 1}, ${item.stock})">−</button>
        <span id="qty-${item.cart_id}" style="min-width:30px; text-align:center; font-weight:700;">${item.quantity}</span>
        <button class="qty-btn" onclick="updateQty(${item.cart_id}, ${item.quantity + 1}, ${item.stock})">+</button>
      </div>
      <div class="cart-qty">
        Subtotal: <strong>฿${(Number(item.price) * item.quantity).toLocaleString()}</strong>
      </div>
      <button class="cart-remove" onclick="removeItem(${item.cart_id})">🗑️ Remove</button>
    `;
    cartList.appendChild(div);
  });

  document.getElementById('summary-count').textContent = `${items.length} item(s)`;
  document.getElementById('summary-total').textContent = `Total ฿${Number(total).toLocaleString()}`;

  cartList.classList.remove('hidden');
  document.getElementById('cart-summary').classList.remove('hidden');
}

// Update item quantity in cart
async function updateQty(cartId, newQty, stock) {
  if (newQty < 1) {
    if (confirm('Do you want to remove this book from the cart?')) {
      removeItem(cartId);
    }
    return;
  }

  if (newQty > stock) {
    alert(`Not enough stock available (only ${stock} book(s) left)`);
    return;
  }

  try {
    const response = await fetch(`${CART_API}/api/cart/${cartId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getCartToken()}`,
      },
      body: JSON.stringify({ quantity: newQty }),
    });

    const data = await response.json();
    if (data.success) loadCart();
    else alert(data.message);

  } catch (err) {
    alert('Unable to update quantity');
  }
}

// Remove a book from the cart
async function removeItem(cartId) {
  try {
    const response = await fetch(`${CART_API}/api/cart/${cartId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${getCartToken()}` },
    });
    const data = await response.json();
    if (data.success) loadCart();
  } catch (err) {
    alert('Unable to remove item. Please try again.');
  }
}