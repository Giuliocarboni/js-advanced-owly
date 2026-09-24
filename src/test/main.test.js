// @vitest-environment jsdom
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import {
  bookDataRequest,
  descriptionDataRequest,
  HttpError,
} from "../js/api.js";
import { renderBooks, renderDescription } from "../js/render.js";

vi.mock("../js/api.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    bookDataRequest: vi.fn(),
    descriptionDataRequest: vi.fn(),
  };
});
vi.mock("../js/render.js");

const mockSearchForm = document.createElement("form");
const mockSearchInput = document.createElement("input");
const mockResultsContainer = document.createElement("div");
const mockLogo = document.createElement("a");
mockLogo.id = "logo";
document.body.appendChild(mockLogo);

vi.mock("../js/dom.js", () => ({
  searchForm: mockSearchForm,
  searchInput: mockSearchInput,
  resultsContainer: mockResultsContainer,
}));

describe("main.js - Interazioni e Logica dell'App", () => {
  beforeAll(async () => {
    await import("../js/main.js");
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchInput.value = "";
    mockResultsContainer.innerHTML = "";
    mockResultsContainer.className = "";
  });

  describe("Sottomissione del form di ricerca", () => {
    it("formatta correttamente la query e invoca le funzioni di rete e di rendering", async () => {
      mockSearchInput.value = "  Fantascienza e Fantasy  ";
      const mockWorks = [{ title: "Dune" }];
      bookDataRequest.mockResolvedValueOnce({ works: mockWorks });

      mockSearchForm.dispatchEvent(new Event("submit", { cancelable: true }));
      expect(mockResultsContainer.textContent).toBe("Caricamento in corso...");

      await new Promise(process.nextTick);

      expect(bookDataRequest).toHaveBeenCalledWith("fantascienza_e_fantasy");
      expect(renderBooks).toHaveBeenCalledWith(
        mockWorks,
        "fantascienza_e_fantasy",
        mockResultsContainer,
      );
    });

    it("non fa nessuna richiesta se il campo è vuoto o contiene solo spazi", async () => {
      mockSearchInput.value = "   ";

      mockSearchForm.dispatchEvent(new Event("submit", { cancelable: true }));
      await new Promise(process.nextTick);

      expect(bookDataRequest).not.toHaveBeenCalled();
      expect(mockResultsContainer.textContent).toBe("");
    });

    it("gestisce l'errore 404 (genere non trovato)", async () => {
      mockSearchInput.value = "genere_inesistente";
      bookDataRequest.mockRejectedValueOnce(new HttpError("Not found", 404));

      mockSearchForm.dispatchEvent(new Event("submit", { cancelable: true }));
      await new Promise(process.nextTick);

      expect(mockResultsContainer.textContent).toBe(
        "Nessun genere trovato con questo nome. Prova con un altro termine.",
      );
    });

    it("gestisce un errore generico (es. rete assente)", async () => {
      mockSearchInput.value = "fantasy";
      bookDataRequest.mockRejectedValueOnce(new Error("Network Error"));

      mockSearchForm.dispatchEvent(new Event("submit", { cancelable: true }));
      await new Promise(process.nextTick);

      expect(mockResultsContainer.textContent).toBe(
        "Impossibile recuperare i risultati. Verifica la tua connessione.",
      );
    });
  });

  describe("interazione ad accordion (click sulle card)", () => {
    let mockCard1, mockCard2;

    beforeEach(() => {
      mockResultsContainer.innerHTML = `
        <article class="book-card is-selected" data-key="/works/1" aria-expanded="true">
          <p class="book-description">Vecchia descrizione</p>
        </article>
        <article class="book-card" data-key="/works/2" aria-expanded="false"></article>
      `;
      mockCard1 = mockResultsContainer.querySelector('[data-key="/works/1"]');
      mockCard2 = mockResultsContainer.querySelector('[data-key="/works/2"]');
    });

    it("chiude la card attualmente aperta quando se ne clicca una nuova e mostra la descrizione", async () => {
      descriptionDataRequest.mockResolvedValueOnce("Nuova descrizione");

      mockCard2.dispatchEvent(new Event("click", { bubbles: true }));
      await new Promise(process.nextTick);

      expect(mockCard1.classList.contains("is-selected")).toBe(false);
      expect(mockCard1.getAttribute("aria-expanded")).toBe("false");
      expect(mockCard1.querySelector(".book-description").hidden).toBe(true);

      expect(mockCard2.classList.contains("is-selected")).toBe(true);
      expect(mockCard2.getAttribute("aria-expanded")).toBe("true");
      expect(renderDescription).toHaveBeenCalledWith(
        "/works/2",
        "Caricamento descrizione...",
        mockResultsContainer,
      );
      expect(renderDescription).toHaveBeenCalledWith(
        "/works/2",
        "Nuova descrizione",
        mockResultsContainer,
      );
    });

    it("riapre una descrizione già caricata senza rifare la richiesta", () => {
      mockCard1.querySelector(".book-description").hidden = false;

      mockCard1.dispatchEvent(new Event("click", { bubbles: true }));

      expect(descriptionDataRequest).not.toHaveBeenCalled();
      expect(mockCard1.querySelector(".book-description").hidden).toBe(true);
    });

    it("il click dentro la descrizione non chiude né riapre la card", () => {
      const description = mockCard1.querySelector(".book-description");

      description.dispatchEvent(new Event("click", { bubbles: true }));

      expect(mockCard1.classList.contains("is-selected")).toBe(true);
      expect(mockCard1.getAttribute("aria-expanded")).toBe("true");
      expect(descriptionDataRequest).not.toHaveBeenCalled();
    });

    it("mostra un messaggio se il caricamento della descrizione fallisce", async () => {
      descriptionDataRequest.mockRejectedValueOnce(new Error("boom"));

      mockCard2.dispatchEvent(new Event("click", { bubbles: true }));
      await new Promise(process.nextTick);

      expect(renderDescription).toHaveBeenCalledWith(
        "/works/2",
        "Impossibile recuperare la descrizione al momento.",
        mockResultsContainer,
      );
    });
  });

  describe("Accessibilità e reset", () => {
    it("simula il click sulla card quando si preme Invio", () => {
      mockResultsContainer.innerHTML = `<article class="book-card" data-key="/works/3"></article>`;
      const card = mockResultsContainer.querySelector(".book-card");
      const clickSpy = vi.spyOn(card, "click");

      card.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Enter",
          bubbles: true,
          cancelable: true,
        }),
      );

      expect(clickSpy).toHaveBeenCalledTimes(1);
    });

    it("simula il click sulla card quando si preme Spazio", () => {
      mockResultsContainer.innerHTML = `<article class="book-card" data-key="/works/3"></article>`;
      const card = mockResultsContainer.querySelector(".book-card");
      const clickSpy = vi.spyOn(card, "click");

      card.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: " ",
          bubbles: true,
          cancelable: true,
        }),
      );

      expect(clickSpy).toHaveBeenCalledTimes(1);
    });

    it("ignora tasti diversi da Invio e Spazio", () => {
      mockResultsContainer.innerHTML = `<article class="book-card" data-key="/works/3"></article>`;
      const card = mockResultsContainer.querySelector(".book-card");
      const clickSpy = vi.spyOn(card, "click");

      card.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "a",
          bubbles: true,
          cancelable: true,
        }),
      );

      expect(clickSpy).not.toHaveBeenCalled();
    });

    it("pulisce l'input di ricerca e i risultati al click sul logo", () => {
      mockSearchInput.value = "testo";
      mockResultsContainer.innerHTML = "<p>Risultati vecchi</p>";

      mockLogo.dispatchEvent(new Event("click", { cancelable: true }));

      expect(mockSearchInput.value).toBe("");
      expect(mockResultsContainer.innerHTML).toBe("");
    });
  });
});