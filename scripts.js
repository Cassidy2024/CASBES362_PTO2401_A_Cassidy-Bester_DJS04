import { books, authors, genres, BOOKS_PER_PAGE } from "./data.js";

let page = 1;
let matches = books;

/**
 * Creates a DOM element with specified tag, classes, and attributes  (Creates html elements, adds css elements and additional attributes and
 * adds it to the DOM)
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
 * Renders a list of book previews into a given container   (Creates a button for each book with all its info and adds them to the container )
 */
function renderBooks(container, books) {
  const fragment =
    document.createDocumentFragment(); /*creates and appends multiple elements to the DOM */

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
function populateDropdown(
  container,
  options,
  defaultOption = "any",
  defaultLabel = "All",
) {
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
 (window.matchMedia:  allows the code to check media queries,*/
function initializeTheme() {
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    setTheme("night");
  } else {
    setTheme("day");
  }
}

/**
 * Sets the theme of the application
 (If the theme is "night" (dark mode), it sets dark backgrounds and light text.
If the theme is "day" (light mode), it sets light backgrounds and dark text.)*/
function setTheme(theme) {
  if (theme === "night") {
    document.documentElement.style.setProperty("--color-dark", "255, 255, 255");
    document.documentElement.style.setProperty("--color-light", "10, 10, 20");
  } else {
    document.documentElement.style.setProperty("--color-dark", "10, 10, 20");
    document.documentElement.style.setProperty(
      "--color-light",
      "255, 255, 255",
    );
  }
  document.querySelector("[data-settings-theme]").value =
    theme; /*selects HTML element and updates value to theme*/
}

/**
 * Handles the "Show More" button functionality
 */
function ShowMore() {
  const fragment = document.createDocumentFragment();
  const start = page * BOOKS_PER_PAGE;
  const end = (page + 1) * BOOKS_PER_PAGE;

  renderBooks(
    fragment,
    matches.slice(start, end),
  ); /* displays thr books from the matches array*/
  document.querySelector("[data-list-items]").appendChild(fragment);
  page += 1; /* next batch of books show when user clicks "show more"*/
}

/**
 * Handles the book preview click event
 */
function BookPreviewClick(event) {
  const pathArray = Array.from(event.path || event.composedPath());
  let active = null; /*later will store the datails of a book clicked*/

  for (const node of pathArray) {
    if (active) break;

    if (node?.dataset?.preview) {
      active = books.find((book) => book.id === node?.dataset?.preview);
    } /*looks for matching book ID amd sets "active" to the book object*/
  }

  if (active) {
    document.querySelector("[data-list-active]").open = true;
    document.querySelector("[data-list-blur]").src = active.image;
    document.querySelector("[data-list-image]").src = active.image;
    document.querySelector("[data-list-title]").innerText = active.title;
    document.querySelector("[data-list-subtitle]").innerText =
      `${authors[active.author]} (${new Date(active.published).getFullYear()})`;
    document.querySelector("[data-list-description]").innerText =
      active.description;
  }
}

/**
 * Handles the search form submission
 */
function SearchSubmit(event) {
  event.preventDefault();
  const formData = new FormData(
    event.target,
  ); /* creates a new object after collecting the form input values*/
  const filters = Object.fromEntries(formData);
  matches =
    filterBooks(
      filters,
    ); /*takes criteria from "filters" and return a filtered list stored in matches variable*/

  updateBookList(
    matches,
  ); /*updates the displayed book list with filtered content*/
  document.querySelector("[data-search-overlay]").open = false;
}

/**
 * Filters the books based on the search criteria
 */

function filterBooks(filters) {
  return books.filter((book) => {
    // Check for matches in each filter (title, genre, author)
    const titleMatch =
      filters.title.trim() === "" ||
      book.title.toLowerCase().includes(filters.title.toLowerCase());
    const genreMatch =
      filters.genre === "any" || book.genres.includes(filters.genre);
    const authorMatch =
      filters.author === "any" || book.author === filters.author;

    // If any of the filters are filled in and match, return true
    return titleMatch && genreMatch && authorMatch;
  });
}

/**
 * Updates the book list with the given matches
 */
function updateBookList(matches) {
  page = 1; /* Book list starts displaying from page 1*/

  if (matches.length === 0) {
    document
      .querySelector("[data-list-message]")
      .classList.add("list__message_show");
  } else {
    document
      .querySelector("[data-list-message]")
      .classList.remove("list__message_show");
  }

  document.querySelector("[data-list-items]").innerHTML = "";
  renderBooks(document.querySelector("[data-list-items]"), matches);
  updateShowMoreButton(matches);
}

/**
 * Updates the "Show More" button
 */
function updateShowMoreButton(matches) {
  const remaining =
    matches.length -
    page * BOOKS_PER_PAGE; /*calculates how many books are left to display*/
  document.querySelector("[data-list-button]").disabled =
    remaining <=
    0; /* Disables button if there are less than or 0 books left to display */

  document.querySelector("[data-list-button]").innerHTML = `
        <span>Show more</span>
        <span class="list__remaining"> (${remaining > 0 ? remaining : 0})</span>
    `;
}

// Initial render
renderBooks(document.querySelector("[data-list-items]"), matches);
populateDropdown(
  document.querySelector("[data-search-genres]"),
  genres,
  "any",
  "All Genres",
);
populateDropdown(
  document.querySelector("[data-search-authors]"),
  authors,
  "any",
  "All Authors",
);
initializeTheme();

// Event listeners
document
  .querySelector("[data-list-button]")
  .addEventListener("click", ShowMore);
document
  .querySelector("[data-list-items]")
  .addEventListener("click", BookPreviewClick);
document
  .querySelector("[data-search-form]")
  .addEventListener("submit", SearchSubmit);

document.querySelector("[data-search-cancel]").addEventListener("click", () => {
  document.querySelector("[data-search-overlay]").open = false;
});

document
  .querySelector("[data-settings-cancel]")
  .addEventListener("click", () => {
    document.querySelector("[data-settings-overlay]").open = false;
  });

document.querySelector("[data-header-search]").addEventListener("click", () => {
  document.querySelector("[data-search-overlay]").open = true;
  document.querySelector("[data-search-title]").focus();
});

document
  .querySelector("[data-header-settings]")
  .addEventListener("click", () => {
    document.querySelector("[data-settings-overlay]").open = true;
  });

document.querySelector("[data-list-close]").addEventListener("click", () => {
  document.querySelector("[data-list-active]").open = false;
});

document
  .querySelector("[data-settings-form]")
  .addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const { theme } = Object.fromEntries(formData);
    setTheme(theme);
    document.querySelector("[data-settings-overlay]").open = false;
  });
