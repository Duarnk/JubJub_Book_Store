// navbar.js — Manage navbar based on login state + cart badge

document.addEventListener('DOMContentLoaded', () => {
  const userToken  = sessionStorage.getItem('userToken');
  const adminToken = sessionStorage.getItem('adminToken');

  const navLinks   = document.querySelector('.navbar-links');
  const mobileMenu = document.getElementById('mobileMenu');

  if (adminToken) {
    navLinks.innerHTML = `
      <a href="main.html"       class="nav-link">Home</a>
      <a href="search.html"     class="nav-link">Search Books</a>
      <a href="team.html"       class="nav-link">Team</a>
      <a href="management.html" class="nav-link">Manage</a>
      <span class="nav-user">Admin</span>
      <button class="nav-btn-login" onclick="logout()">Logout</button>
    `;
    mobileMenu.innerHTML = `
      <a href="main.html">Home</a>
      <a href="search.html">Search Books</a>
      <a href="team.html">Team</a>
      <a href="management.html">Manage</a>
      <a href="#" onclick="logout()">Logout</a>
    `;
  } else if (userToken) {
    const userData = sessionStorage.getItem('userData');
    const user = userData ? JSON.parse(userData) : null;
    const displayName = user ? user.first_name : 'User';

    navLinks.innerHTML = `
      <a href="main.html"   class="nav-link">Home</a>
      <a href="search.html" class="nav-link">Search Books</a>
      <a href="team.html"   class="nav-link">Team</a>
      <a href="cart.html"   class="nav-link nav-cart">
        🛒 <span id="cart-badge" class="cart-badge hidden">0</span>
      </a>
      <a href="orders.html" class="nav-link">Orders</a>
      <span class="nav-user">${displayName}</span>
      <button class="nav-btn-login" onclick="logout()">Logout</button>
    `;
    mobileMenu.innerHTML = `
      <a href="main.html">Home</a>
      <a href="search.html">Search Books</a>
      <a href="team.html">Team</a>
      <a href="cart.html">Cart</a>
      <a href="#" onclick="logout()">Logout</a>
    `;

    // Load cart badge
    loadCartBadge(userToken);

  } else {
    navLinks.innerHTML = `
      <a href="main.html"       class="nav-link">Home</a>
      <a href="search.html"     class="nav-link">Search Books</a>
      <a href="team.html"       class="nav-link">Team</a>
      <a href="user-login.html"  class="nav-btn-login">Login</a>
      <a href="admin-login.html" class="nav-btn-login">Admin</a>
    `;
    mobileMenu.innerHTML = `
      <a href="main.html">Home</a>
      <a href="search.html">Search Books</a>
      <a href="team.html">Team</a>
      <a href="user-login.html">Login</a>
      <a href="admin-login.html">Login (Admin)</a>
    `;
  }

  // Hamburger toggle
  document.getElementById('hamburgerBtn').addEventListener('click', () => {
    document.getElementById('mobileMenu').classList.toggle('open');
  });
});

// Fetch cart count and display on badge
async function loadCartBadge(token) {
  try {
    const response = await fetch('http://localhost:3000/api/cart', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();

    if (data.cart && data.cart.length > 0) {
      const badge = document.getElementById('cart-badge');
      if (badge) {
        badge.textContent = data.cart.length;
        badge.classList.remove('hidden');
      }
    }
  } catch (err) {
    // Suppress error silently
  }
}

function logout() {
  sessionStorage.removeItem('userToken');
  sessionStorage.removeItem('adminToken');
  sessionStorage.removeItem('userData');
  window.location.href = 'main.html';
}