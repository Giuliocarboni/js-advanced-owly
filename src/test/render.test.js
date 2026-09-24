// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { renderBooks, renderDescription } from "../js/render.js";

describe("renderBooks", () => {
  let container;

  beforeEach(() => {
    container = document.createElement("div");
  });

  it("mostra lo stato 'no-results' se l'array è vuoto o null", () => {
    renderBooks([], "fantasy", container);

    const noResults = container.querySelector(".no-results");
    expect(noResults).not.toBeNull();
    expect(noResults.textContent).toBe(
      "Nessun risultato trovato per questo genere",
    );
    expect(container.querySelectorAll(".book-card")).toHaveLength(0);

    renderBooks(null, "fantasy", container);
    expect(container.querySelector(".no-results")).not.toBeNull();
  });

  it("applica correttamente gli attributi di accessibilità A11y e i dati", () => {
    const books = [
      {
        key: "/works/OL1W",
        title: "Il nome della rosa",
        authors: [{ name: "Umberto Eco" }],
      },
      {
        title: "Opera senza identificativo",
        authors: [{ name: "Autore X" }],
      },
    ];

    renderBooks(books, "storia", container);

    const resultsMsg = container.querySelector(".results-msg");
    expect(resultsMsg).not.toBeNull();
    expect(resultsMsg.textContent).toBe(
      'I migliori libri per il genere "storia":',
    );

    const cards = container.querySelectorAll(".book-card");
    expect(cards).toHaveLength(2);
    const [firstCard, secondCard] = cards;

    expect(firstCard.querySelector(".book-title").textContent).toBe(
      "1. Il nome della rosa",
    );
    expect(secondCard.querySelector(".book-title").textContent).toBe(
      "2. Opera senza identificativo",
    );

    expect(firstCard.dataset.key).toBe("/works/OL1W");
    expect(firstCard.getAttribute("tabindex")).toBe("0");
    expect(firstCard.getAttribute("role")).toBe("button");
    expect(firstCard.getAttribute("aria-expanded")).toBe("false");

    expect(secondCard.dataset.key).toBeUndefined();
    expect(secondCard.getAttribute("tabindex")).toBeNull();
    expect(secondCard.getAttribute("role")).toBeNull();
    expect(secondCard.getAttribute("aria-expanded")).toBeNull();
  });

  it("gestisce i casi limite della trasformazione degli autori", () => {
    const books = [
      {
        key: "/works/OL2W",
        title: "Libro con più autori",
        authors: [{ name: "Autore A" }, { name: "Autore B" }],
      },
      {
        key: "/works/OL3W",
        title: "Opera Anonima",
        authors: [{ name: "  opera anonima  " }],
      },
      {
        key: "/works/OL4W",
        title: "Libro senza autori",
        authors: undefined,
      },
    ];

    renderBooks(books, "narrativa", container);
    const cards = container.querySelectorAll(".book-card");

    expect(cards[0].querySelector(".book-authors").textContent).toBe(
      "Autore A, Autore B",
    );
    expect(cards[1].querySelector(".book-authors").textContent).toBe(
      "Autore anonimo",
    );
    expect(cards[2].querySelector(".book-authors").textContent).toBe(
      "Autore sconosciuto",
    );
  });
});

describe("renderDescription", () => {
  let container;

  beforeEach(() => {
    container = document.createElement("div");
    container.innerHTML = `
      <article class="book-card" data-key="/works/123">
        <div class="book-info">
          <h3 class="book-title">1. Titolo di prova</h3>
          <p class="book-authors">Autore di prova</p>
        </div>
      </article>
    `;
  });

  it("inserisce e aggiorna la descrizione senza duplicare elementi nel DOM", () => {
    renderDescription("/works/123", "Caricamento descrizione...", container);

    let descriptions = container.querySelectorAll(".book-description");
    expect(descriptions).toHaveLength(1);
    expect(descriptions[0].textContent).toBe("Caricamento descrizione...");

    renderDescription("/works/123", "Una trama avvincente.", container);

    descriptions = container.querySelectorAll(".book-description");
    expect(descriptions).toHaveLength(1);
    expect(descriptions[0].textContent).toBe("Una trama avvincente.");
  });

  it("non esegue modifiche se la card con il data-key specificato non esiste", () => {
    const initialHTML = container.innerHTML;

    renderDescription("/works/non-esistente", "Testo qualsiasi", container);

    expect(container.innerHTML).toBe(initialHTML);
    expect(container.querySelector(".book-description")).toBeNull();
  });
});
