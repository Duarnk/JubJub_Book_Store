// google-books.js — Google Books Public API Integration

const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';


async function searchGoogleBooks(query) {
  if (!query) return [];
  try {
    const response = await fetch(
      `${GOOGLE_BOOKS_API}?q=${encodeURIComponent(query)}&maxResults=5&langRestrict=th`
    );
    const data = await response.json();
    if (!data.items) return [];
    return data.items.map(item => {
      const info = item.volumeInfo;
      return {
        id:        item.id,
        title:     info.title      || 'No Title',
        authors:   info.authors    ? info.authors.join(', ') : 'Unknown Author',
        category:  info.categories ? info.categories[0] : '—',
        thumbnail: info.imageLinks ? info.imageLinks.thumbnail : null,
        link:      info.infoLink   || '#',
      };
    });
  } catch (err) {
    console.error('Google Books API error:', err);
    return [];
  }
}

// Create card — image has fixed height same as main
function createBookCard(book) {
  const card = document.createElement('article');
  card.className = 'book-item';
  card.innerHTML = `
    <a href="${book.link}" target="_blank" rel="noopener">
      <div class="book-cover" style="background:#0f1e3d; height:195px; overflow:hidden; position:relative;">
        ${book.thumbnail
          ? `<img src="${book.thumbnail}" alt="${book.title}"
               style="width:100%; height:100%; object-fit:cover; display:block;"/>`
          : `<span class="book-cover-title" style="padding:1rem; text-align:center;">${book.title}</span>`
        }
      </div>
      <div class="book-info">
        <h3 class="book-title">${book.title}</h3>
        <p class="book-author">${book.authors}</p>
        <div class="book-meta">
          <span class="book-type">${book.category}</span>
          <span style="font-size:0.72rem; color:var(--color-text-muted);">Google Books</span>
        </div>
      </div>
    </a>
  `;
  return card;
}

async function showGoogleBooksResults(query) {
  const section   = document.getElementById('google-books-section');
  const container = document.getElementById('google-books-list');
  if (!section || !container) return;

  container.innerHTML = '<p style="color:var(--color-text-muted); font-size:0.9rem;">Loading from Google Books...</p>';

  const books = await searchGoogleBooks(query);
  if (books.length === 0) { section.classList.add('hidden'); return; }

  container.innerHTML = '';
  books.forEach(book => container.appendChild(createBookCard(book)));
}

async function showGoogleBooksMain(query = 'Recommended Books') {
  const section   = document.getElementById('google-books-main');
  const container = document.getElementById('google-books-main-list');
  if (!section || !container) return;

  const books = await searchGoogleBooks(query);
  if (books.length === 0) { section.classList.add('hidden'); return; }

  container.innerHTML = '';
  books.forEach(book => container.appendChild(createBookCard(book)));
}