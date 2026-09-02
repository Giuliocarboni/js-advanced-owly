export const renderBooks = (books, container) => {
  container.replaceChildren();

  if (!books || books.length === 0) {
    const noResultMsg = document.createElement("p");
    noResultMsg.className = "no-results";
    noResultMsg.textContent = "Nessun risultato trovato per questo genere";
    container.append(noResultMsg);
    return;
  }

  const fragment = document.createDocumentFragment();

  books.forEach((book, index) => {
    const card = document.createElement("article");
    card.className = "book-card";
    if (book.key) {
      card.dataset.key = book.key;
    }

    const bookInfo = document.createElement("div");
    bookInfo.className = "book-info";

    const title = document.createElement("h3");
    title.className = "book-title";
    title.textContent = `${index + 1}. ${book.title}`;

    const authors = document.createElement("p");
    authors.className = "book-authors";
    authors.textContent = book.authors
      ? book.authors
          .map((author) => {
            if (
              author.name.trim().toLowerCase() ===
              book.title.trim().toLowerCase()
            ) {
              return "Autore anonimo";
            }
            return author.name;
          })
          .join(", ")
      : "Autore sconosciuto";

    bookInfo.append(title, authors);
    card.append(bookInfo);
    fragment.appendChild(card);
  });

  container.replaceChildren(fragment);
};
