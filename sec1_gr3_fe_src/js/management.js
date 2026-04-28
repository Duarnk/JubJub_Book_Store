// management.js — CRUD Web Service Interaction

const API_URL = 'http://localhost:3000';

const GRADIENTS = [
  'linear-gradient(135deg,#3b82f6,#1d4ed8)',
  'linear-gradient(135deg,#60a5fa,#2563eb)',
  'linear-gradient(135deg,#6c8ebf,#2a4a8a)',
  'linear-gradient(135deg,#7ec8a0,#1e6640)',
  'linear-gradient(135deg,#d4a5d0,#8e4a8e)',
  'linear-gradient(135deg,#e8c87c,#b07820)',
];

const CATEGORY_MAP = {
  novel:1, academic:2, children:3, lifestyle:4,
  business:5, comic:6, history:7, science:8, travel:9, food:10
};

const CATEGORY_LABEL = {
  1:'Novel', 2:'Academic', 3:'Children & Youth', 4:'Lifestyle',
  5:'Business', 6:'Comic', 7:'History', 8:'Science',
  9:'Travel', 10:'Food & Cooking'
};

function getToken() { return sessionStorage.getItem('adminToken') || ''; }

// Load book list
async function loadBooks() {
  try {
    const response = await fetch(`${API_URL}/api/books/search`);
    const data = await response.json();
    document.getElementById('mgmtLoading').classList.add('hidden');
    document.getElementById('mgmtTableWrapper').classList.remove('hidden');
    renderMgmtTable(data.books || []);
  } catch (err) {
    document.getElementById('mgmtLoading').textContent = 'Unable to load data';
  }
}

function renderMgmtTable(books) {
  const tbody = document.getElementById('mgmtBody');
  tbody.innerHTML = '';

  books.forEach((book, index) => {
    const gradient = GRADIENTS[index % GRADIENTS.length];
    const categoryLabel = book.category_name || CATEGORY_LABEL[book.category_id] || '—';

    const coverHTML = book.cover_image
      ? `<img src="${API_URL}/${book.cover_image}" class="cover-thumb"
             onerror="this.outerHTML='<div class=cover-thumb-placeholder style=background:${gradient}>📖</div>'" />`
      : `<div class="cover-thumb-placeholder" style="background:${gradient}">📖</div>`;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${coverHTML}</td>
      <td style="font-weight:600; max-width:160px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${book.book_title}</td>
      <td style="color:var(--color-text-muted); white-space:nowrap;">${book.author_name || '—'}</td>
      <td><span class="book-type">${categoryLabel}</span></td>
      <td style="font-weight:700; color:var(--color-primary); white-space:nowrap;">฿${Number(book.price).toLocaleString()}</td>
      <td style="text-align:center; ${book.stock <= 5 ? 'color:#ef4444; font-weight:700;' : ''}">${book.stock}</td>
      <td style="display:flex; gap:0.35rem; flex-wrap:nowrap;">
        <button class="action-btn edit" onclick="editBook(${book.book_id})">✏️ Edit</button>
        <button class="action-btn delete" onclick="deleteBook(${book.book_id}, '${book.book_title.replace(/'/g,"\\'")}')">🗑️ Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Submit form (Insert or Update)
async function submitForm() {
  const editId = document.getElementById('editBookId').value;
  const isEdit = editId !== '';

  const book = {
    book_title:   document.getElementById('fName').value.trim(),
    price:        document.getElementById('fPrice').value,
    isbn:         document.getElementById('fISBN').value.trim(),
    category_id:  CATEGORY_MAP[document.getElementById('fType').value] || 1,
    description:  document.getElementById('fDesc').value.trim(),
    pages:        document.getElementById('fPages').value || null,
    stock:        document.getElementById('fStock').value || 0,
    publisher_id: null,
  };

  if (!book.book_title || !book.price || !book.isbn) {
    showMsg('Please fill in the required fields (Title, Price, ISBN)', 'error');
    return;
  }

  try {
    let response;
    if (isEdit) {
      response = await fetch(`${API_URL}/api/books/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify(book),
      });
    } else {
      response = await fetch(`${API_URL}/api/books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify(book),
      });
    }

    const data = await response.json();

    if (response.ok && data.success) {
      // If there is a cover image, upload it as well
      const fileInput = document.getElementById('fCover');
      const bookId = isEdit ? editId : data.book_id;

      if (fileInput.files[0] && bookId) {
        await uploadCoverById(bookId, fileInput.files[0]);
      }

      showMsg(isEdit ? 'Book updated successfully' : 'Book added successfully', 'success');
      resetForm();
      loadBooks();
    } else {
      showMsg(data.message || 'An error occurred', 'error');
    }
  } catch (err) {
    showMsg('Unable to connect to the server', 'error');
  }
}

// Upload cover image
async function uploadCoverById(bookId, file) {
  const formData = new FormData();
  formData.append('cover', file);

  try {
    await fetch(`${API_URL}/api/books/${bookId}/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getToken()}` },
      body: formData,
    });
  } catch (err) {}
}

// Load book data into form for editing
async function editBook(bookId) {
  try {
    const response = await fetch(`${API_URL}/api/books/${bookId}`);
    const data = await response.json();
    const book = data.book;

    document.getElementById('editBookId').value  = book.book_id;
    document.getElementById('fName').value       = book.book_title    || '';
    document.getElementById('fPrice').value      = book.price         || '';
    document.getElementById('fISBN').value       = book.isbn          || '';
    document.getElementById('fPages').value      = book.pages         || '';
    document.getElementById('fStock').value      = book.stock         || '';
    document.getElementById('fDesc').value       = book.description   || '';
    document.getElementById('fPublisher').value  = book.publisher_name|| '';

    // Set category
    const typeMap = {
      'Novel':'novel', 'Academic':'academic', 'Children & Youth':'children',
      'Lifestyle':'lifestyle', 'Business':'business', 'Comic':'comic',
      'History':'history', 'Science':'science',
      'Travel':'travel', 'Food & Cooking':'food'
    };
    document.getElementById('fType').value = typeMap[book.category_name] || 'novel';

    // Show cover preview
    const preview = document.getElementById('cover-preview');
    if (book.cover_image) {
      preview.innerHTML = `<img src="${API_URL}/${book.cover_image}" style="width:100%; height:100%; object-fit:cover;"
        onerror="this.parentElement.innerHTML='<span style=color:rgba(255,255,255,0.5);font-size:2rem>📖</span>'" />`;
    }

    document.getElementById('formTitle').textContent    = 'Edit Book';
    document.getElementById('submitBtn').textContent    = 'Save Changes';
    document.getElementById('cancelBtn').style.display = 'inline-block';
    document.getElementById('uploadMsg').textContent   = '';
    document.getElementById('extra-images-section').style.display = 'block';

    loadExtraImages(bookId);

    document.getElementById('mgmt-form-panel').scrollIntoView({ behavior: 'smooth' });

  } catch (err) {
    showMsg('Unable to load book data', 'error');
  }
}

// Delete book
async function deleteBook(bookId, bookName) {
  if (!confirm(`Are you sure you want to delete "${bookName}"?`)) return;
  try {
    const response = await fetch(`${API_URL}/api/books/${bookId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${getToken()}` },
    });
    const data = await response.json();
    if (response.ok && data.success) {
      showMsg('Book deleted successfully', 'success');
      loadBooks();
    } else {
      showMsg(data.message || 'An error occurred', 'error');
    }
  } catch (err) {
    showMsg('Unable to connect to the server', 'error');
  }
}

// Reset form
function resetForm() {
  document.getElementById('editBookId').value          = '';
  document.getElementById('fName').value               = '';
  document.getElementById('fAuthor') && (document.getElementById('fAuthor').value = '');
  document.getElementById('fType').value               = 'novel';
  document.getElementById('fPrice').value              = '';
  document.getElementById('fISBN').value               = '';
  document.getElementById('fPublisher').value          = '';
  document.getElementById('fPages').value              = '';
  document.getElementById('fStock').value              = '';
  document.getElementById('fDesc').value               = '';
  document.getElementById('fCover').value              = '';
  document.getElementById('cover-preview').innerHTML   = '<span style="color:rgba(255,255,255,0.5); font-size:1.5rem;">&#128214;</span>';
  document.getElementById('uploadMsg').textContent     = '';
  document.getElementById('formTitle').textContent     = 'Add New Book';
  document.getElementById('submitBtn').textContent     = 'Save';
  document.getElementById('cancelBtn').style.display  = 'none';
  document.getElementById('extra-images-section').style.display = 'none';
  document.getElementById('extra-images-list').innerHTML = '';
}

// Load extra images for a book
async function loadExtraImages(bookId) {
  try {
    const res  = await fetch(`${API_URL}/api/books/${bookId}/images`);
    const data = await res.json();
    const list = document.getElementById('extra-images-list');
    list.innerHTML = '';

    data.images.forEach(img => {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'position:relative; width:56px; height:75px;';
      wrap.innerHTML = `
        <img src="${API_URL}/${img.image_path}"
          style="width:56px; height:75px; object-fit:cover; border-radius:4px;
          border:2px solid ${img.is_primary ? 'var(--color-primary)' : 'var(--color-border)'};"
          onerror="this.style.display='none'" />
        ${img.is_primary ? '<span style="position:absolute;top:2px;left:2px;background:var(--color-primary);color:#fff;font-size:0.6rem;padding:1px 4px;border-radius:3px;">Primary</span>' : ''}
      `;
      list.appendChild(wrap);
    });
  } catch (err) {}
}

// Upload extra image
async function uploadExtraImage(event) {
  const editId = document.getElementById('editBookId').value;
  if (!editId) return;

  const file = event.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('image', file);

  try {
    const res  = await fetch(`${API_URL}/api/books/${editId}/images`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getToken()}` },
      body: formData,
    });
    const data = await res.json();
    if (data.success) {
      loadExtraImages(editId);
      showMsg('Image uploaded successfully', 'success');
    }
  } catch (err) {
    showMsg('Unable to upload image', 'error');
  }
}

// Show feedback message
function showMsg(text, type) {
  const el = document.getElementById('mgmt-msg');
  el.textContent = text;
  el.style.background = type === 'success' ? '#e8f5e9' : '#fee2e2';
  el.style.color      = type === 'success' ? '#2e7d32' : '#b91c1c';
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 3000);
}