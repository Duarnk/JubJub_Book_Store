// login-user.js — User authentication

const loginForm  = document.getElementById('loginForm');
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
    const response = await fetch('http://localhost:3000/api/login-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (data.success) {
      // Store token and user data
      sessionStorage.setItem('userToken', data.token);
      sessionStorage.setItem('userData', JSON.stringify(data.user));
      window.location.href = 'main.html';
    } else {
      loginError.textContent = data.message;
      loginError.style.display = 'block';
    }
  } catch (err) {
    loginError.textContent = 'Unable to connect to the server';
    loginError.style.display = 'block';
  }
});