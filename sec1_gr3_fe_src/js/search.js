// search.js — Search Web Service + Google Books API

const API_URL = 'http://localhost:3000';

const SEARCH_GRADIENTS = [
  'linear-gradient(135deg,#3b82f6,#1d4ed8)',
  'linear-gradient(135deg,#60a5fa,#2563eb)',
  'linear-gradient(135deg,#6c8ebf,#2a4a8a)',
  'linear-gradient(135deg,#7ec8a0,#1e6640)',
  'linear-gradient(135deg,#d4a5d0,#8e4a8e)',
  'linear-gradient(135deg,#e8c87c,#b07820)',
];

async function doSearch() {
  const name     = document.getElementById('searchName').value.trim();
  const author   = document.getElementById('searchAuthor').value.trim();
  const type     = document.getElementById('searchType').value;
  const maxPrice = document.getElementById('searchMaxPrice').value.trim();

  showEl('loadingMsg');
  hideEl('tableWrapper');
  hideEl('noResult');
  hideEl('resultCount');

  const params = new URLSearchParams();
  if (name)     params.append('name', name);
  if (author)   params.append('author', author);
  if (type)     params.append('category_id', getCategoryId(type));
  if (maxPrice) params.append('maxPrice', maxPrice);

  // Always call Google Books
  const query = name || author || type || 'Recommended Books';
  showGoogleBooksResults(query);

  try {
    const response = await fetch(`${API_URL}/api/books/search?${params.toString()}`);
    const data = await response.json();

    hideEl('loadingMsg');

    if (!data.books || data.books.length === 0) {
      showEl('noResult');
      return;
    }

    const countEl = document.getElementById('resultCount');
    countEl.textContent = `Found ${data.books.length} result(s)`;
    showEl('resultCount');

    renderCards(data.books);
    showEl('tableWrapper');

  } catch (err) {
    hideEl('loadingMsg');
    document.getElementById('noResult').textContent = 'Unable to connect to the server';
    showEl('noResult');
  }
}

function renderCards(books) {
  const wrapper = document.getElementById('tableWrapper');
  wrapper.innerHTML = `<div class="books-grid" id="searchBooksGrid"></div>`;
  const grid = document.getElementById('searchBooksGrid');

  books.forEach((book, index) => {
    const gradient = SEARCH_GRADIENTS[index % SEARCH_GRADIENTS.length];
    const card = document.createElement('article');
    card.className = 'book-item';

    // Show real image if available, otherwise use gradient
    const coverHTML = book.cover_image
      ? `<img src="${API_URL}/${book.cover_image}" alt="${book.book_title}"
             style="width:100%; height:100%; object-fit:cover; display:block;"
             onerror="this.parentElement.style.background='${gradient}'; this.remove();" />`
      : `<span class="book-cover-title">${book.book_title}</span>`;

    card.innerHTML = `
      <a href="detail.html?id=${book.book_id}">
        <div class="book-cover" style="background:${book.cover_image ? '#0f1e3d' : gradient}; height:195px; overflow:hidden; padding:${book.cover_image ? '0' : '1rem'};">
          ${coverHTML}
        </div>
        <div class="book-info">
          <h3 class="book-title">${book.book_title}</h3>
          <p class="book-author">${book.author_name || '—'}</p>
          <div class="book-meta">
            <span class="book-type">${book.category_name || '—'}</span>
            <span class="book-price">฿${Number(book.price).toLocaleString()}</span>
          </div>
        </div>
      </a>
    `;
    grid.appendChild(card);
  });
}

function getCategoryId(type) {
  const map = { novel:1, academic:2, children:3, lifestyle:4, business:5, comic:6 };
  return map[type] || '';
}

function showEl(id) { document.getElementById(id).classList.remove('hidden'); }
function hideEl(id) { document.getElementById(id).classList.add('hidden'); }