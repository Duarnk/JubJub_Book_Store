const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  loginError.style.display = 'none';

  if (!username || !password) {
    loginError.textContent = 'Please enter your username and password';
    loginError.style.display = 'block';
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/api/login-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (data.success) {
      sessionStorage.setItem('adminToken', data.token);
      window.location.href = 'management.html';
    } else {
      loginError.textContent = data.message;
      loginError.style.display = 'block';
    }
  } catch (err) {
    loginError.textContent = 'Unable to connect to the server';
    loginError.style.display = 'block';
  }
});