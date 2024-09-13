import { books, authors, genres, BOOKS_PER_PAGE } from "./data.js";

let page = 1;
let matches = books;

/**
 * Creates a DOM element with specified tag, classes, and attributes
 */
function createElement(tag, className, attributes = {}) {
  const element = document.createElement(tag);
  element.classList = className;

  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, value);
  }

  return element;
}

/**
 * Renders a list of book previews into a given container
 */
function renderBooks(container, books) {
  const fragment = document.createDocumentFragment();

  for (const { author, id, image, title } of books.slice(0, BOOKS_PER_PAGE)) {
    const element = createElement("button", "preview", { "data-preview": id });

    element.innerHTML = `
            <img class="preview__image" src="${image}" />
            <div class="preview__info">
                <h3 class="preview__title">${title}</h3>
                <div class="preview__author">${authors[author]}</div>
            </div>
        `;

    fragment.appendChild(element);
  }

  container.appendChild(fragment);
}

/**
 * Populates a select dropdown with options from a given object
 */
function populateDropdown(container, options, defaultOption = "any", defaultLabel = "All") {
  const fragment = document.createDocumentFragment();
  const defaultElement = createElement("option", "", { value: defaultOption });
  defaultElement.innerText = defaultLabel;
  fragment.appendChild(defaultElement);

  for (const [id, name] of Object.entries(options)) {
    const element = createElement("option", "", { value: id });
    element.innerText = name;
    fragment.appendChild(element);
  }

  container.appendChild(fragment);
}

/**
 * Initializes the UI based on the current theme preference
 */
function initializeTheme() {
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    setTheme("night");
  } else {
    setTheme("day");
  }
}

/**
 * Sets the theme of the application
 */
function setTheme(theme) {
  if (theme === "night") {
    document.documentElement.style.setProperty("--color-dark", "255, 255, 255");
    document.documentElement.style.setProperty("--color-light", "10, 10, 20");
  } else {
    document.documentElement.style.setProperty("--color-dark", "10, 10, 20");
    document.documentElement.style.setProperty("--color-light", "255, 255, 255");
  }
  document.querySelector("[data-settings-theme]").value = theme;
}

/**
 * Handles the "Show More" button functionality
 */
function ShowMore() {
  const fragment = document.createDocumentFragment();
  const start = page * BOOKS_PER_PAGE;
  const end = (page + 1) * BOOKS_PER_PAGE;

  renderBooks(document.querySelector("[data-list-items]"), matches.slice(start, end));
  page += 1;

  updateShowMoreButton(matches);
}

/**
 * Handles the book preview click event inside the custom element
 */
class BookPreview extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.shadowRoot.innerHTML = `
        <style>
    /* Backdrop for modal */
    .modal-backdrop {
      display: none; /* Initially hidden */
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.5); /* Semi-transparent background */
      z-index: 999; /* Below modal but above the rest of the content */
    }

    /* Modal content */
    .book-preview {
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 1000;
      width: 40%;
      max-height: 80vh; /* Prevent overflow */
      overflow-y: auto;
      text-align: center;
    }

    /* Image styling */
    .book-preview img {
      max-width: 30%;
      height: auto;
      margin-bottom: 10px;
    }

    /* Close button */
    .book-preview__close {
      cursor: pointer;
      margin-top: 20px; /* Add margin to give space above the button */
      background: lightblue;
      border: 1px solid #ccc;
      padding: 10px;
      font-size: 16px;
      border-radius: 10px;
      width: 100px; /* Adjust width of the close button */
    }
  </style>

  <!-- Backdrop -->
  <div class="modal-backdrop"></div>

  <!-- Modal Content -->
  <div class="book-preview" data-list-active>
    <img data-list-image src="" alt="Book Image">
    <h2 data-list-title></h2>
    <p data-list-subtitle></p>
    <p data-list-description></p>
    <button class="book-preview__close">Close</button> <!-- Close button moved below the description -->
  </div>
`;
  }

  updateBookPreview(active) {
    const bookPreview = this.shadowRoot.querySelector('.book-preview');
    const backdrop = this.shadowRoot.querySelector('.modal-backdrop');

    // Show modal and backdrop
    bookPreview.style.display = 'flex';
    backdrop.style.display = 'block';

    // Set content
    this.shadowRoot.querySelector('[data-list-image]').src = active.image;
    this.shadowRoot.querySelector('[data-list-title]').innerText = active.title;
    this.shadowRoot.querySelector('[data-list-subtitle]').innerText =
      `${authors[active.author]} (${new Date(active.published).getFullYear()})`;
    this.shadowRoot.querySelector('[data-list-description]').innerText = active.description;

    
    const closeModal = () => {
      bookPreview.style.display = 'none';
      backdrop.style.display = 'none';
    };

    this.shadowRoot.querySelector('.book-preview__close').addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);
  }

  connectedCallback() {
    document.querySelector("[data-list-items]").addEventListener('click', this.handleBookPreviewClick.bind(this));
  }

  disconnectedCallback() {
    document.querySelector("[data-list-items]").removeEventListener('click', this.handleBookPreviewClick);
  }

  handleBookPreviewClick(event) {
    const pathArray = Array.from(event.composedPath());
    let active = null;

    for (const node of pathArray) {
      if (active) break;
      if (node?.dataset?.preview) {
        active = books.find((book) => book.id === node.dataset.preview);
      }
    }

    if (active) {
      this.updateBookPreview(active);
    }
  }
}

customElements.define('book-preview', BookPreview);

/**
 * Handles the search form submission
 */
function SearchSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const filters = Object.fromEntries(formData);
  matches = filterBooks(filters);

  updateBookList(matches);
  document.querySelector("[data-search-overlay]").open = false;
}

/**
 * Filters the books based on the search criteria
 */
function filterBooks(filters) {
  return books.filter((book) => {
    const titleMatch =
      filters.title.trim() === "" ||
      book.title.toLowerCase().includes(filters.title.toLowerCase());
    const genreMatch =
      filters.genre === "any" || book.genres.includes(filters.genre);
    const authorMatch =
      filters.author === "any" || book.author === filters.author;

    return titleMatch && genreMatch && authorMatch;
  });
}

/**
 * Updates the book list with the given matches
 */
function updateBookList(matches) {
  page = 1;

  if (matches.length === 0) {
    document.querySelector("[data-list-message]").classList.add("list__message_show");
  } else {
    document.querySelector("[data-list-message]").classList.remove("list__message_show");
  }

  document.querySelector("[data-list-items]").innerHTML = "";
  renderBooks(document.querySelector("[data-list-items]"), matches);
  updateShowMoreButton(matches);
}

/**
 * Updates the "Show More" button
 */
function updateShowMoreButton(matches) {
  const remaining = matches.length - page * BOOKS_PER_PAGE;
  
  // Update button text
  const showMoreButton = document.querySelector("[data-list-button]");
  showMoreButton.disabled = remaining <= 0;
  
  showMoreButton.innerHTML = `
    Show more <span class="list__remaining">(${remaining > 0 ? remaining : 0})</span>
  `;
}

// Initial render
renderBooks(document.querySelector("[data-list-items]"), matches);
populateDropdown(document.querySelector("[data-search-genres]"), genres, "any", "All Genres");
populateDropdown(document.querySelector("[data-search-authors]"), authors, "any", "All Authors");
initializeTheme();

// Event listeners
document.querySelector("[data-list-button]").addEventListener("click", ShowMore);
document.querySelector("[data-search-form]").addEventListener("submit", SearchSubmit);
document.querySelector("[data-search-cancel]").addEventListener("click", () => {
  document.querySelector("[data-search-overlay]").open = false;
});
document.querySelector("[data-settings-cancel]").addEventListener("click", () => {
  document.querySelector("[data-settings-overlay]").open = false;
});
document.querySelector("[data-header-search]").addEventListener("click", () => {
  document.querySelector("[data-search-overlay]").open = true;
  document.querySelector("[data-search-title]").focus();
});
document.querySelector("[data-header-settings]").addEventListener("click", () => {
  document.querySelector("[data-settings-overlay]").open = true;
});
document.querySelector("[data-list-close]").addEventListener("click", () => {
  document.querySelector("[data-list-active]").open = false;
});
document.querySelector("[data-settings-form]").addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);
  const { theme } = Object.fromEntries(formData);
  setTheme(theme);
  document.querySelector("[data-settings-overlay]").open = false;
});