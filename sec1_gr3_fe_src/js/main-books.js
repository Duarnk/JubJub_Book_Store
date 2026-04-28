// main-books.js — Load featured books from API and display real cover images

const MAIN_API = 'http://localhost:3000';

const MAIN_GRADIENTS = [
  'linear-gradient(135deg,#e8a87c,#c8564a)',
  'linear-gradient(135deg,#6c8ebf,#3a5a99)',
  'linear-gradient(135deg,#7ec8a0,#2e8b57)',
  'linear-gradient(135deg,#d4a5d0,#8e4a8e)',
  'linear-gradient(135deg,#3b82f6,#1d4ed8)',
  'linear-gradient(135deg,#e8c87c,#b07820)',
];

window.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch(`${MAIN_API}/api/books/search`);
    const data = await response.json();
    if (!data.books || data.books.length === 0) return;

    // Show only the first 4 books
    const featured = data.books.slice(0, 4);
    renderFeatured(featured);
  } catch (err) {
    // If server does not respond, fall back to hardcoded data
  }
});

function renderFeatured(books) {
  const grid = document.getElementById('featuredBooks');
  if (!grid) return;
  grid.innerHTML = '';

  books.forEach((book, index) => {
    const gradient = MAIN_GRADIENTS[index % MAIN_GRADIENTS.length];

    const coverHTML = book.cover_image
      ? `<img src="${MAIN_API}/${book.cover_image}" alt="${book.book_title}"
             style="width:100%; height:100%; object-fit:cover; display:block;"
             onerror="this.parentElement.style.background='${gradient}'; this.remove();" />`
      : `<span class="book-cover-title">${book.book_title}</span>`;

    const card = document.createElement('article');
    card.className = 'book-item';
    card.innerHTML = `
      <a href="detail.html?id=${book.book_id}">
        <div class="book-cover" style="background:${book.cover_image ? '#0f1e3d' : gradient}; overflow:hidden; padding:${book.cover_image ? '0' : '1rem'};">
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