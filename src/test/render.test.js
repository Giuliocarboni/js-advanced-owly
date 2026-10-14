// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { renderBooks, appendBooks, renderDescription } from "../js/render.js";

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
      "Nessun risultato trovato per questo genere.",
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

describe("appendBooks", () => {
  let container;

  beforeEach(() => {
    container = document.createElement("div");
  });

  it("aggiunge le nuove card dopo quelle esistenti senza ricrearle", () => {
    renderBooks(
      [{ key: "/works/OL1W", title: "Primo", authors: [{ name: "Autore A" }] }],
      "storia",
      container,
    );
    const existingCard = container.querySelector(".book-card");

    appendBooks(
      [
        {
          key: "/works/OL2W",
          title: "Secondo",
          authors: [{ name: "Autore B" }],
        },
      ],
      1,
      container,
    );

    const cards = container.querySelectorAll(".book-card");
    expect(cards).toHaveLength(2);
    expect(cards[0]).toBe(existingCard);
    expect(cards[1].dataset.key).toBe("/works/OL2W");
    expect(container.querySelectorAll(".results-msg")).toHaveLength(1);
  });

  it("conserva lo stato delle card già presenti (es. descrizione aperta)", () => {
    renderBooks([{ key: "/works/OL1W", title: "Primo" }], "storia", container);
    const existingCard = container.querySelector(".book-card");
    existingCard.classList.add("is-selected");
    existingCard.setAttribute("aria-expanded", "true");

    appendBooks([{ key: "/works/OL2W", title: "Secondo" }], 1, container);

    expect(existingCard.classList.contains("is-selected")).toBe(true);
    expect(existingCard.getAttribute("aria-expanded")).toBe("true");
  });

  it("continua la numerazione a partire dall'indice indicato", () => {
    appendBooks(
      [
        { key: "/works/OL13W", title: "Tredicesimo" },
        { key: "/works/OL14W", title: "Quattordicesimo" },
      ],
      12,
      container,
    );

    const titles = [...container.querySelectorAll(".book-title")].map(
      (title) => title.textContent,
    );
    expect(titles).toEqual(["13. Tredicesimo", "14. Quattordicesimo"]);
  });

  it("applica gli stessi attributi di accessibilità e le stesse regole sugli autori di renderBooks", () => {
    appendBooks(
      [
        {
          key: "/works/OL5W",
          title: "Opera Anonima",
          authors: [{ name: "opera anonima" }],
        },
        { title: "Senza identificativo" },
      ],
      0,
      container,
    );

    const [withKey, withoutKey] = container.querySelectorAll(".book-card");

    expect(withKey.dataset.key).toBe("/works/OL5W");
    expect(withKey.getAttribute("tabindex")).toBe("0");
    expect(withKey.getAttribute("role")).toBe("button");
    expect(withKey.getAttribute("aria-expanded")).toBe("false");
    expect(withKey.querySelector(".book-authors").textContent).toBe(
      "Autore anonimo",
    );

    expect(withoutKey.dataset.key).toBeUndefined();
    expect(withoutKey.getAttribute("tabindex")).toBeNull();
    expect(withoutKey.querySelector(".book-authors").textContent).toBe(
      "Autore sconosciuto",
    );
  });

  it("restituisce la prima card aggiunta", () => {
    const firstNewCard = appendBooks(
      [
        { key: "/works/OL1W", title: "Primo" },
        { key: "/works/OL2W", title: "Secondo" },
      ],
      0,
      container,
    );

    expect(firstNewCard).toBe(container.querySelector(".book-card"));
    expect(firstNewCard.dataset.key).toBe("/works/OL1W");
  });

  it("non modifica il contenitore e restituisce null se non ci sono libri", () => {
    container.innerHTML = '<article class="book-card"></article>';
    const initialHTML = container.innerHTML;

    expect(appendBooks([], 1, container)).toBeNull();
    expect(appendBooks(null, 1, container)).toBeNull();
    expect(appendBooks(undefined, 1, container)).toBeNull();
    expect(container.innerHTML).toBe(initialHTML);
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
