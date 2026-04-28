-- ============================================
-- JUBJUB BOOK STORE — Database
-- sec1_gr3_database.sql
-- ============================================

DROP DATABASE IF EXISTS jubjub;

CREATE DATABASE IF NOT EXISTS jubjub;
USE jubjub;



CREATE TABLE publisher (
    publisher_id      INT AUTO_INCREMENT PRIMARY KEY,
    publisher_name    VARCHAR(100),
    publisher_country VARCHAR(50)
);

CREATE TABLE category (
    category_id          INT AUTO_INCREMENT PRIMARY KEY,
    category_name        VARCHAR(50),
    category_description TEXT
);

CREATE TABLE author (
    author_id         INT AUTO_INCREMENT PRIMARY KEY,
    author_first_name VARCHAR(50),
    author_last_name  VARCHAR(50),
    nationality       VARCHAR(50),
    biography         TEXT
);

CREATE TABLE book (
    book_id      INT AUTO_INCREMENT PRIMARY KEY,
    book_title   VARCHAR(200) NOT NULL,
    cover_image  VARCHAR(255),
    price        DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    stock        INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    description  TEXT,
    isbn         VARCHAR(20) NOT NULL UNIQUE,
    pages        INT,
    publish_date DATE,
    language     VARCHAR(30),
    edition      VARCHAR(20),
    publisher_id INT,
    category_id  INT,
    FOREIGN KEY (publisher_id) REFERENCES publisher(publisher_id),
    FOREIGN KEY (category_id)  REFERENCES category(category_id)
);

CREATE TABLE book_author (
    book_id   INT,
    author_id INT,
    PRIMARY KEY (book_id, author_id),
    FOREIGN KEY (book_id)   REFERENCES book(book_id),
    FOREIGN KEY (author_id) REFERENCES author(author_id)
);

CREATE TABLE users (
    user_id    INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50),
    last_name  VARCHAR(50),
    email      VARCHAR(100) UNIQUE,
    password   VARCHAR(255),
    phone      VARCHAR(10),
    address    TEXT
);

CREATE TABLE admin (
    admin_id         INT AUTO_INCREMENT PRIMARY KEY,
    admin_first_name VARCHAR(50) NOT NULL,
    admin_last_name  VARCHAR(50) NOT NULL,
    username         VARCHAR(50) UNIQUE NOT NULL,
    password_hash    VARCHAR(255) NOT NULL,
    email            VARCHAR(100) UNIQUE
);

-- Admin login log
CREATE TABLE login_logs (
    log_id     INT AUTO_INCREMENT PRIMARY KEY,
    admin_id   INT,
    login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    status     VARCHAR(20),
    FOREIGN KEY (admin_id) REFERENCES admin(admin_id)
);

-- ============================================
-- INSERT DATA
-- ============================================

-- publisher (10 rows)
INSERT INTO publisher (publisher_name, publisher_country) VALUES
('Nanmeebooks Publishing',   'Thailand'),
('Amarin Printing',          'Thailand'),
('Jamsai Publishing',        'Thailand'),
('Butterfly Publishing',     'Thailand'),
('DMG Publishing',           'Thailand'),
('Penguin Random House',     'USA'),
('HarperCollins',            'USA'),
('Simon & Schuster',         'USA'),
('Bloomsbury Publishing',    'UK'),
('Scribner',                 'USA');

-- category (10 rows)
INSERT INTO category (category_name, category_description) VALUES
('Fiction',          'Thai and translated fiction novels'),
('Academic',         'Textbooks and academic references'),
('Children & Youth', 'Books for children and teenagers'),
('Lifestyle',        'Self-improvement and lifestyle books'),
('Business',         'Business, finance, and investment books'),
('Comics',           'Manga and Japanese comics'),
('History',          'History books and documentaries'),
('Science',          'Science and technology books'),
('Travel',           'Travel guides and maps'),
('Food & Cooking',   'Cookbooks and recipes');

-- author (10 rows)
INSERT INTO author (author_first_name, author_last_name, nationality, biography) VALUES
('Mala',    'Khamchan',      'Thai',      'Leading Thai fiction writer, author of Chua Fa Din Salai'),
('Thomayanti', '',           'Thai',      'Pen name of Khunying Wimon Chiamcharoen, romantic fiction writer'),
('James',   'Clear',         'American',  'Author of Atomic Habits, expert on habits and decision making'),
('Robert',  'Kiyosaki',      'American',  'Author of Rich Dad Poor Dad, entrepreneur and investor'),
('Dale',    'Carnegie',      'American',  'Author of How to Win Friends and Influence People'),
('Yuval',   'Harari',        'Israeli',   'Historian and author of Sapiens and Homo Deus'),
('Siriporn', 'Wongsawan',    'Thai',      'Well-known Thai romantic fiction writer'),
('Win',     'Lyovarin',      'Thai',      'SEA Write Award winner, author of Democracy on the Parallel Line'),
('Paulo',   'Coelho',        'Brazilian', 'Author of The Alchemist and many bestselling novels'),
('George',  'Orwell',        'British',   'Author of 1984 and Animal Farm');

-- book (10 rows)
INSERT INTO book (book_title, cover_image, price, stock, description, isbn, pages, publish_date, language, edition, publisher_id, category_id) VALUES
('Chua Fa Din Salai',              NULL, 195.00, 50, 'A historical novel set during World War II',                '978-974-484-001-1', 320, '2010-01-01', 'Thai',    '5th',  1, 1),
('One Night in Paris',             NULL, 175.00, 35, 'A romantic love story set in Paris',                        '978-974-484-002-2', 280, '2015-06-01', 'Thai',    '3rd',  2, 1),
('Atomic Habits',                  NULL, 295.00, 60, 'How to build good habits and break bad ones',               '978-073-521-122-5', 320, '2018-10-16', 'English', '1st',  6, 4),
('Rich Dad Poor Dad',              NULL, 245.00, 45, 'What the rich teach their kids about money',                '978-194-485-457-5', 336, '1997-04-01', 'English', '25th', 7, 5),
('How to Win Friends',             NULL, 220.00, 40, 'Timeless principles for dealing with people',               '978-067-142-517-9', 288, '1936-10-01', 'English', '1st',  8, 4),
('Sapiens',                        NULL, 350.00, 30, 'A brief history of humankind',                              '978-006-231-609-7', 443, '2011-01-01', 'English', '1st',  9, 7),
('Democracy on the Parallel Line', NULL, 260.00, 25, 'SEA Write Award novel about politics and humanity',         '978-974-484-003-3', 400, '1997-01-01', 'Thai',    '2nd',  4, 1),
('The Alchemist',                  NULL, 275.00, 55, 'A story about following your dreams',                       '978-006-231-500-7', 208, '1988-01-01', 'English', '1st', 10, 1),
('1984',                           NULL, 230.00, 42, 'A dystopian novel about a totalitarian society',            '978-045-152-849-3', 328, '1949-06-08', 'English', '1st',  9, 1),
('Introduction to Python',         NULL, 320.00, 20, 'Learn Python programming for beginners',                    '978-974-484-004-4', 360, '2022-03-01', 'Thai',    '1st',  5, 8);

-- book_author (10 rows)
INSERT INTO book_author (book_id, author_id) VALUES
(1,  1),
(2,  2),
(3,  3),
(4,  4),
(5,  5),
(6,  6),
(7,  8),
(8,  9),
(9,  10),
(10, 7);

-- users (10 rows)
INSERT INTO users (first_name, last_name, email, password, phone, address) VALUES
('Somchai',   'Jaidee',     'somchai@email.com',   '1234', '0812345671', '123 Sukhumvit Rd, Bangkok'),
('Somying',   'Rakdee',     'somying@email.com',   '1234', '0812345672', '456 Ratchada Rd, Bangkok'),
('Wichai',    'Mana',       'wichai@email.com',    '1234', '0812345673', '789 Rama 9 Rd, Bangkok'),
('Napa',      'Sawangjai',  'napa@email.com',      '1234', '0812345674', '101 Lat Phrao Rd, Bangkok'),
('Tana',      'Misap',      'tana@email.com',      '1234', '0812345675', '202 Ngam Wong Wan Rd, Nonthaburi'),
('Orathai',   'Saengthong', 'orathai@email.com',   '1234', '0812345676', '303 Phetchaburi Rd, Bangkok'),
('Prayut',    'Kengmak',    'prayut@email.com',    '1234', '0812345677', '404 Ramkhamhaeng Rd, Bangkok'),
('Manee',     'Ngamloet',   'manee@email.com',     '1234', '0812345678', '505 Sathorn Rd, Bangkok'),
('Chaichana', 'Deeден',     'chaichana@email.com', '1234', '0812345679', '606 Asok Rd, Bangkok'),
('Pim',       'Suayngam',   'pim@email.com',       '1234', '0812345670', '707 Silom Rd, Bangkok');

-- admin (10 rows)
INSERT INTO admin (admin_first_name, admin_last_name, username, password_hash, email) VALUES
('Somsak',    'Phudu',      'admin',     '1234', 'admin@jubjub.com'),
('Wanna',     'Jadkan',     'wanna',     '1234', 'wanna@jubjub.com'),
('Theerapong','Rabob',      'theera',    '1234', 'theera@jubjub.com'),
('Nongnuch',  'Dudeedee',   'nongnuch',  '1234', 'nongnuch@jubjub.com'),
('Kitti',     'Borihan',    'kitti',     '1234', 'kitti@jubjub.com'),
('Pranee',    'Rakngarn',   'pranee',    '1234', 'pranee@jubjub.com'),
('Surachai',  'Chiaochan',  'surachai',  '1234', 'surachai@jubjub.com'),
('Mayuree',   'Saijai',     'mayuree',   '1234', 'mayuree@jubjub.com'),
('Anan',      'Khayan',     'anan',      '1234', 'anan@jubjub.com'),
('Chanida',   'Phithiphan', 'chanida',   '1234', 'chanida@jubjub.com');

-- login_logs (10 rows)
INSERT INTO login_logs (admin_id, login_time, status) VALUES
(1, '2026-04-01 08:00:00', 'success'),
(1, '2026-04-02 09:15:00', 'success'),
(2, '2026-04-02 10:00:00', 'success'),
(3, '2026-04-03 08:30:00', 'success'),
(1, '2026-04-03 11:00:00', 'failed'),
(4, '2026-04-04 09:00:00', 'success'),
(2, '2026-04-05 10:30:00', 'success'),
(1, '2026-04-06 08:00:00', 'success'),
(5, '2026-04-07 14:00:00', 'success'),
(3, '2026-04-08 09:45:00', 'failed');

-- ============================================
-- VERIFY
-- ============================================
SHOW TABLES;
SELECT * FROM publisher;
SELECT * FROM category;
SELECT * FROM author;
SELECT book_title FROM book;
SELECT * FROM book_author;
SELECT * FROM users;
SELECT * FROM admin;
SELECT * FROM login_logs;


-- Add missing tables
CREATE TABLE cart (
    cart_id  INT AUTO_INCREMENT PRIMARY KEY,
    user_id  INT NOT NULL,
    book_id  INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (book_id) REFERENCES book(book_id)
);

CREATE TABLE orders (
    order_id   INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT NOT NULL,
    total      DECIMAL(10,2) NOT NULL,
    address    TEXT NOT NULL,
    status     VARCHAR(30) DEFAULT 'pending',
    ordered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE order_items (
    item_id  INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    book_id  INT NOT NULL,
    quantity INT NOT NULL,
    price    DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (book_id)  REFERENCES book(book_id)
);

CREATE TABLE book_images (
    image_id   INT AUTO_INCREMENT PRIMARY KEY,
    book_id    INT NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    is_primary TINYINT(1) DEFAULT 0,
    FOREIGN KEY (book_id) REFERENCES book(book_id)
);