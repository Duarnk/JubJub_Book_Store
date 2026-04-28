# JUBJUB BOOK STORE — ITCS223 Project Phase II

> Section 1 / Group 3  
> Online Bookstore Web Application

---

## Installation Guide

### Prerequisites
- **Node.js** v14 or higher
- **MySQL** v8 or higher
- **npm** (comes with Node.js)

---

### 1. Import Database

**macOS / Linux:**
```bash
mysql -u root -p < sec1_gr3_database.sql
```

**Windows (if MySQL is not in PATH):**
```bash
"C:/Program Files/MySQL/MySQL Server 9.4/bin/mysql" --default-character-set=utf8mb4 -u root -p < sec1_gr3_database.sql
```

> If you encounter `ERROR 1050: Table already exists`, drop the old database first:
> ```bash
> mysql -u root -p -e "DROP DATABASE jubjub;"
> ```
> Then re-run the import command.

> If you encounter `ERROR 1406: Data too long`, add the `--default-character-set=utf8mb4` flag as shown in the Windows example above.

---

### 2. Set Up and Run the Back-end (Web Service Server)

```bash
cd sec1_gr3_ws_src
npm install
```

Create a `.env` file in the `sec1_gr3_ws_src` folder (see `.env.example` for reference):

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_actual_mysql_password
DB_NAME=jubjub
PORT=3000
JWT_SECRET=jubjub_secret_key_2026
```

> **Important:** `DB_PASSWORD` must match the MySQL root password you used with `mysql -u root -p`  
> If the password is empty, set `DB_PASSWORD=`  
> **Do not duplicate `DB_PASSWORD` on two lines** — dotenv only uses the first value.

Start the server:

```bash
npm start
```

The back-end will be running at `http://localhost:3000`

---

### 3. Set Up and Run the Front-end (Web Server)

**Open a new terminal window** (you need 2 terminals running simultaneously):

```bash
cd sec1_gr3_fe_src
npx -y http-server . -p 5500 -c-1
```

Open your browser at `http://localhost:5500/main.html`

> **Very Important:**  
> - Front-end and Back-end **must run on different ports** (e.g. 5500 and 3000)  
> - **Always start the Back-end (port 3000) first**, then start the Front-end  
> - **Use `http-server` instead of `serve`** because `serve` strips `.html` from URLs,  
>   causing `detail.html?id=1` to become `/detail` and losing the `?id=1` query parameter

If a port is already in use, run these commands, then try step 2 and 3 again:

```bash
# Kill whatever is on port 3000
lsof -ti:3000 | xargs kill -9

# Kill whatever is on port 5500
lsof -ti:5500 | xargs kill -9

# Kill multiple ports at once
lsof -ti:3000,5500 | xargs kill -9
```

---

### 4. Test Credentials

| Role  | Username / Email       | Password | Notes                          |
|-------|------------------------|----------|--------------------------------|
| Admin | admin                  | 1234     | Can access the management page |
| User  | somchai@email.com      | 1234     | Can use the cart and checkout  |

---

## Troubleshooting

### Issue: `Cannot connect to the server`
**Cause:** The back-end server is not running, or it's running on the wrong port.  
**Fix:**
1. Make sure the back-end is running — open `http://localhost:3000` in your browser and you should see `{"message":"JUBJUB BOOK STORE API is running"}`
2. If not, run `cd sec1_gr3_ws_src && npm start`
3. Verify that `.env` has the correct `DB_PASSWORD`

### Issue: `Access denied for user 'root'@'localhost'`
**Cause:** The `DB_PASSWORD` in your `.env` file doesn't match the MySQL password.  
**Fix:** Update `DB_PASSWORD` in the `.env` file to match the password you use when `mysql -u root -p` succeeds.

### Issue: `Error: listen EADDRINUSE: address already in use :::3000`
**Cause:** An old process is still occupying port 3000.  
**Fix:**
```bash
# macOS/Linux
kill $(lsof -ti:3000)

# Windows (Git Bash)
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F
```
Then run `npm start` again.

### Issue: `Book data not found` when clicking book details
**Cause:** Could be one of two issues:
1. **Back-end is not running** — verify that `http://localhost:3000/api/books/1` returns book data
2. **Using `npx serve` instead of `http-server`** — `serve` strips `.html` from URLs, causing the `?id=1` query parameter to be lost  
   **Fix:** Use `npx -y http-server . -p 5500 -c-1` instead of `npx serve`

### Issue: Port conflict — Frontend and Backend using the same port
**Cause:** Both the frontend server and backend server are running on port 3000.  
**Fix:** Start the back-end first (port 3000), then start the front-end on a different port (e.g. 5500):
```bash
# Terminal 1 (back-end)
cd sec1_gr3_ws_src && npm start

# Terminal 2 (front-end)
cd sec1_gr3_fe_src && npx -y http-server . -p 5500 -c-1
```

### Issue: `bash: mysql: command not found` (Windows)
**Cause:** MySQL is not in the system PATH.  
**Fix:** Use the full path:
```bash
"C:/Program Files/MySQL/MySQL Server {your SQL server version}}/bin/mysql" -u root -p < sec1_gr3_database.sql
```
(Adjust the version number to match your installation)

### Issue: `ERROR 1406: Data too long for column`
**Cause:** MySQL is not using UTF-8 encoding, causing Thai text to exceed column size limits.  
**Fix:** Add `--default-character-set=utf8mb4` to the import command:
```bash
mysql --default-character-set=utf8mb4 -u root -p < sec1_gr3_database.sql
```

---

## Project Structure

```
sec1_gr3_fe_src/          ← Front-end (port 5500)
├── main.html             (Home Page)
├── search.html           (Search Page)
├── detail.html           (Book Detail Page)
├── user-login.html       (User Login)
├── user-register.html    (User Registration)
├── admin-login.html      (Admin Login)
├── admin-register.html   (Admin Registration)
├── management.html       (Admin Book Management)
├── cart.html              (Shopping Cart)
├── checkout.html          (Checkout)
├── orders.html            (Order History)
├── team.html              (Team Page)
├── css/                   (Stylesheets)
│   ├── global.css
│   ├── main.css, search.css, detail.css
│   ├── login.css, management.css
│   ├── cart.css, team.css
└── js/                    (JavaScript)
    ├── navbar.js, google-books.js
    ├── login-admin.js, login-user.js
    ├── search.js, detail.js
    ├── management.js, cart.js

sec1_gr3_ws_src/          ← Back-end (port 3000)
├── server.js             (Entry point)
├── db.js                 (MySQL connection pool)
├── .env                  (Must be created manually — see .env.example)
├── routes/
│   ├── auth.js           (Login & Register)
│   ├── books.js          (Search, Detail, CRUD)
│   ├── cart.js           (Shopping Cart)
│   └── orders.js         (Checkout & Order History)
├── package.json
└── README.md

sec1_gr3_database.sql     ← Database (import once)
```

---

## API Endpoints

### Authentication (routes/auth.js)
| Method | URL                     | Description              |
|--------|-------------------------|--------------------------|
| POST   | /api/login-admin        | Admin login              |
| POST   | /api/login-user         | User login               |
| POST   | /api/register-user      | User registration        |
| POST   | /api/register-admin     | Admin registration       |

### Books (routes/books.js)
| Method | URL                     | Description                                                |
|--------|-------------------------|------------------------------------------------------------|
| GET    | /api/books/search       | Search books (query: name, author, category_id, maxPrice)  |
| GET    | /api/books/:id          | Get book details                                           |
| POST   | /api/books              | Add a book (admin only)                                    |
| PUT    | /api/books/:id          | Edit a book (admin only)                                   |
| DELETE | /api/books/:id          | Delete a book (admin only)                                 |

### Cart (routes/cart.js)
| Method | URL                     | Description                   |
|--------|-------------------------|-------------------------------|
| GET    | /api/cart               | View user's cart               |
| POST   | /api/cart               | Add a book to cart             |
| PUT    | /api/cart/:cart_id      | Update cart item quantity      |
| DELETE | /api/cart/:cart_id      | Remove a book from cart        |

### Orders (routes/orders.js)
| Method | URL                     | Description              |
|--------|-------------------------|--------------------------|
| POST   | /api/checkout           | Place an order (checkout)|
| GET    | /api/orders             | View order history       |

### Headers for protected routes
```
Authorization: Bearer <token>
```

---

## Public Web Service

Uses the **Google Books API** to recommend additional books.  
Endpoint: `https://www.googleapis.com/books/v1/volumes?q={query}&maxResults=5`

Displayed on `main.html` and `search.html`.

---

## Notes
- Passwords are stored in plain text for educational purposes only.
- CORS is enabled on the back-end to support cross-origin requests.
- MySQL must be running before starting the back-end server.
- Front-end and Back-end must run on separate ports as required by the project specifications.
