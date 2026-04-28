# JUBJUB BOOK STORE — Web Service (sec1_gr3_ws_src)

## วิธีติดตั้งและรัน

### 1. ติดตั้ง dependencies
```bash
npm install
```

### 2. ตั้งค่า .env
แก้ไขไฟล์ `.env` ให้ตรงกับ MySQL ของคุณ
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=jubjub
PORT=3000
JWT_SECRET=jubjub_secret_key_2026
```

### 3. Import database
```bash
mysql -u root -p < ../sec1_gr3_database.sql
```

### 4. รัน server
```bash
npm start
```
Server จะรันที่ `http://localhost:3000`

---

## API Endpoints

### Auth
| Method | URL | Description |
|--------|-----|-------------|
| POST | /api/login-admin | Admin login |
| POST | /api/login-user  | User login  |

### Books
| Method | URL | Description |
|--------|-----|-------------|
| GET | /api/books/search | ค้นหาหนังสือ (query: name, author, category_id, maxPrice) |
| GET | /api/books/:id | รายละเอียดหนังสือ |
| POST | /api/books | เพิ่มหนังสือ (admin) |
| PUT | /api/books/:id | แก้ไขหนังสือ (admin) |
| DELETE | /api/books/:id | ลบหนังสือ (admin) |

### Headers สำหรับ admin routes
```
Authorization: Bearer <token>
```
