# JUBJUB BOOK STORE — ITCS223 Project Phase II

> Section 1 / Group 3  
> Online Bookstore Web Application

---

## วิธีติดตั้งและรัน (Installation Guide)

### ข้อกำหนดเบื้องต้น (Prerequisites)
- **Node.js** v14 ขึ้นไป
- **MySQL** v8 ขึ้นไป
- **npm** (มาพร้อม Node.js)

---

### 1. Import Database

**macOS / Linux:**
```bash
mysql -u root -p < sec1_gr3_database.sql
```

**Windows (MySQL ไม่อยู่ใน PATH):**
```bash
"C:/Program Files/MySQL/MySQL Server 9.4/bin/mysql" --default-character-set=utf8mb4 -u root -p < sec1_gr3_database.sql
```

> หากพบ `ERROR 1050: Table already exists` ให้ลบ database เก่าก่อน:
> ```bash
> mysql -u root -p -e "DROP DATABASE jubjub;"
> ```
> แล้วรัน import ใหม่อีกครั้ง

> หากพบ `ERROR 1406: Data too long` ให้ใช้ `--default-character-set=utf8mb4` flag ตามตัวอย่าง Windows ด้านบน

---

### 2. ตั้งค่าและรัน Back-end (Web Service Server)

```bash
cd sec1_gr3_ws_src
npm install
```

สร้างไฟล์ `.env` ในโฟลเดอร์ `sec1_gr3_ws_src` (ดูตัวอย่างจาก `.env.example`):

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_actual_mysql_password
DB_NAME=jubjub
PORT=3000
JWT_SECRET=jubjub_secret_key_2026
```

> **สำคัญ:** `DB_PASSWORD` ต้องตรงกับรหัสผ่าน MySQL root ที่ใช้ตอน `mysql -u root -p`  
> หากรหัสผ่านเป็นค่าว่าง ให้ใส่ `DB_PASSWORD=`  
> **อย่าใส่ DB_PASSWORD ซ้ำ 2 บรรทัด** — dotenv จะใช้ค่าแรกเท่านั้น

รันเซิร์ฟเวอร์:

```bash
npm start
```

Back-end จะรันที่ `http://localhost:3000`

---

### 3. ตั้งค่าและรัน Front-end (Web Server)

**เปิด Terminal ใหม่อีกหน้าต่างหนึ่ง** (ต้องรัน 2 terminal พร้อมกัน):

```bash
cd sec1_gr3_fe_src
npx -y http-server . -p 5500 -c-1
```

เปิดเบราว์เซอร์ที่ `http://localhost:5500/main.html`

> **สำคัญมาก:**  
> - Front-end และ Back-end **ต้องรันบนคนละ port** (เช่น 5500 และ 3000)  
> - **ต้องเปิด Back-end (port 3000) ก่อนเสมอ** แล้วค่อยเปิด Front-end  
> - **ใช้ `http-server` แทน `serve`** เพราะ `serve` จะตัด `.html` ออกจาก URL  
>   ทำให้ `detail.html?id=1` กลายเป็น `/detail` แล้วหาย query parameter `?id=1`

---

### 4. ข้อมูลทดสอบ (Test Credentials)

| Role  | Username / Email       | Password | หมายเหตุ                   |
|-------|------------------------|----------|----------------------------|
| Admin | admin                  | 1234     | เข้าหน้า management ได้     |
| User  | somchai@email.com      | 1234     | ใช้งานตะกร้าและสั่งซื้อได้  |

---

## แก้ปัญหาที่พบบ่อย (Troubleshooting)

### ปัญหา: `ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้`
**สาเหตุ:** Back-end server ไม่ได้รันอยู่ หรือรันผิด port  
**วิธีแก้:**
1. ตรวจสอบว่า Back-end กำลังรันอยู่ — เปิด `http://localhost:3000` ในเบราว์เซอร์ ต้องเห็น `{"message":"JUBJUB BOOK STORE API is running"}`
2. ถ้าไม่เห็น ให้รัน `cd sec1_gr3_ws_src && npm start`
3. ตรวจสอบว่า `.env` มี `DB_PASSWORD` ที่ถูกต้อง

### ปัญหา: `Access denied for user 'root'@'localhost'`
**สาเหตุ:** `DB_PASSWORD` ในไฟล์ `.env` ไม่ตรงกับรหัสผ่าน MySQL  
**วิธีแก้:** แก้ไข `DB_PASSWORD` ในไฟล์ `.env` ให้ตรงกับรหัสผ่านที่ใช้ตอน `mysql -u root -p` สำเร็จ

### ปัญหา: `Error: listen EADDRINUSE: address already in use :::3000`
**สาเหตุ:** มี process เก่าค้างอยู่บน port 3000  
**วิธีแก้:**
```bash
# macOS/Linux
kill $(lsof -ti:3000)

# Windows (Git Bash)
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F
```
แล้วรัน `npm start` ใหม่

### ปัญหา: `ไม่พบข้อมูลหนังสือ` เมื่อคลิกดูรายละเอียดหนังสือ
**สาเหตุ:** อาจเกิดจาก 2 กรณี
1. **Back-end ไม่ได้รัน** — ตรวจสอบว่า `http://localhost:3000/api/books/1` ตอบกลับข้อมูลหนังสือ
2. **ใช้ `npx serve` แทน `http-server`** — `serve` จะตัด `.html` ออกจาก URL ทำให้ query parameter `?id=1` หายไป  
   **วิธีแก้:** ใช้ `npx -y http-server . -p 5500 -c-1` แทน `npx serve`

### ปัญหา: Port conflict — Frontend กับ Backend ใช้ port เดียวกัน
**สาเหตุ:** ทั้ง frontend server และ backend server รันบน port 3000  
**วิธีแก้:** เปิด Back-end ก่อน (port 3000) แล้วเปิด Front-end บน port อื่น (เช่น 5500):
```bash
# Terminal 1 (back-end)
cd sec1_gr3_ws_src && npm start

# Terminal 2 (front-end)
cd sec1_gr3_fe_src && npx -y http-server . -p 5500 -c-1
```

### ปัญหา: `bash: mysql: command not found` (Windows)
**สาเหตุ:** MySQL ไม่ได้อยู่ใน system PATH  
**วิธีแก้:** ใช้ full path:
```bash
"C:/Program Files/MySQL/MySQL Server 9.4/bin/mysql" -u root -p < sec1_gr3_database.sql
```
(ปรับเลข version ตามที่ติดตั้ง)

### ปัญหา: `ERROR 1406: Data too long for column`
**สาเหตุ:** MySQL ไม่ได้ใช้ UTF-8 encoding ทำให้ข้อความภาษาไทยเกินขนาดคอลัมน์  
**วิธีแก้:** เพิ่ม `--default-character-set=utf8mb4` ในคำสั่ง import:
```bash
mysql --default-character-set=utf8mb4 -u root -p < sec1_gr3_database.sql
```

---

## โครงสร้างโปรเจกต์ (Project Structure)

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
├── .env                  (ต้องสร้างเอง — ดู .env.example)
├── routes/
│   ├── auth.js           (Login & Register)
│   ├── books.js          (Search, Detail, CRUD)
│   ├── cart.js           (Shopping Cart)
│   └── orders.js         (Checkout & Order History)
├── package.json
└── README.md

sec1_gr3_database.sql     ← Database (import ครั้งเดียว)
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
| Method | URL                     | Description                                              |
|--------|-------------------------|----------------------------------------------------------|
| GET    | /api/books/search       | ค้นหาหนังสือ (query: name, author, category_id, maxPrice) |
| GET    | /api/books/:id          | รายละเอียดหนังสือ                                          |
| POST   | /api/books              | เพิ่มหนังสือ (admin only)                                  |
| PUT    | /api/books/:id          | แก้ไขหนังสือ (admin only)                                  |
| DELETE | /api/books/:id          | ลบหนังสือ (admin only)                                     |

### Cart (routes/cart.js)
| Method | URL                     | Description                   |
|--------|-------------------------|-------------------------------|
| GET    | /api/cart               | ดูตะกร้าของ user               |
| POST   | /api/cart               | เพิ่มหนังสือเข้าตะกร้า         |
| PUT    | /api/cart/:cart_id      | อัปเดตจำนวนในตะกร้า           |
| DELETE | /api/cart/:cart_id      | ลบหนังสือออกจากตะกร้า          |

### Orders (routes/orders.js)
| Method | URL                     | Description              |
|--------|-------------------------|--------------------------|
| POST   | /api/checkout           | สั่งซื้อ (checkout)       |
| GET    | /api/orders             | ดูประวัติการสั่งซื้อ       |

### Headers สำหรับ protected routes
```
Authorization: Bearer <token>
```

---

## Public Web Service

ใช้ **Google Books API** สำหรับแนะนำหนังสือเพิ่มเติม  
Endpoint: `https://www.googleapis.com/books/v1/volumes?q={query}&maxResults=5`

แสดงผลในหน้า `main.html` และ `search.html`

---

## หมายเหตุ (Notes)
- รหัสผ่านเก็บแบบ plain text สำหรับโปรเจกต์การศึกษา
- CORS เปิดใช้งานบน back-end เพื่อรองรับ cross-origin requests
- ต้องรัน MySQL ก่อนเริ่ม back-end server
- Front-end และ Back-end ต้องรันบนคนละ port ตาม requirement ของโปรเจกต์