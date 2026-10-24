const createBookCard = (book, index) => {
  const card = document.createElement("article");
  card.className = "book-card";

  const bookInfo = document.createElement("div");
  bookInfo.className = "book-info";

  const title = document.createElement("h3");
  title.className = "book-title";
  const label = `${index + 1}. ${book.title}`;

  if (book.key) {
    card.dataset.key = book.key;

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "book-toggle";
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute(
      "aria-controls",
      `desc-${book.key.replace(/[^\w-]/g, "")}`,
    );

    const toggleLabel = document.createElement("span");
    toggleLabel.className = "book-toggle-label";
    toggleLabel.textContent = label;

    const chevron = document.createElement("span");
    chevron.className = "book-chevron";
    chevron.setAttribute("aria-hidden", "true");

    toggle.append(toggleLabel, chevron);
    title.append(toggle);
  } else {
    title.textContent = label;
  }

  const authors = document.createElement("p");
  authors.className = "book-authors";
  authors.textContent = book.authors
    ? book.authors
        .map((author) =>
          author.name.trim().toLowerCase() === book.title.trim().toLowerCase()
            ? "Autore anonimo"
            : author.name,
        )
        .join(", ")
    : "Autore sconosciuto";

  bookInfo.append(title, authors);
  card.append(bookInfo);
  return card;
};

export const renderBooks = (books, query, container) => {
  container.replaceChildren();

  if (!books || books.length === 0) {
    const noResultMsg = document.createElement("p");
    noResultMsg.className = "no-results";
    noResultMsg.textContent = "Nessun risultato trovato per questo genere.";
    container.append(noResultMsg);
    return;
  }

  const displayQuery = query.replace(/_/g, " ");

  const resultsMsg = document.createElement("p");
  resultsMsg.className = "results-msg";
  resultsMsg.textContent = `I migliori libri per il genere "${displayQuery}":`;

  const fragment = document.createDocumentFragment();
  fragment.append(resultsMsg);

  books.forEach((book, index) => {
    fragment.appendChild(createBookCard(book, index));
  });

  container.replaceChildren(fragment);
};

export const appendBooks = (books, startIndex, container) => {
  if (!books || books.length === 0) return null;

  const cards = books.map((book, index) =>
    createBookCard(book, startIndex + index),
  );
  container.append(...cards);

  return cards[0];
};

export const renderDescription = (key, text, container) => {
  const card = container.querySelector(`[data-key="${key}"]`);
  if (!card) return;

  let descriptionElement = card.querySelector(".book-description");
  if (!descriptionElement) {
    descriptionElement = document.createElement("p");
    descriptionElement.className = "book-description";
    card.querySelector(".book-info").append(descriptionElement);
  }

  descriptionElement.textContent = text;
};
