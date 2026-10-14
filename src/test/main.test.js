// @vitest-environment jsdom
import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  beforeEach,
  afterEach,
} from "vitest";
import {
  bookDataRequest,
  descriptionDataRequest,
  HttpError,
} from "../js/api.js";
import { renderBooks, appendBooks, renderDescription } from "../js/render.js";

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

const mockLoadMoreContainer = document.createElement("div");
const mockLoadMoreError = document.createElement("p");
const mockLoadMoreBtn = document.createElement("button");
mockLoadMoreContainer.append(mockLoadMoreError, mockLoadMoreBtn);
document.body.appendChild(mockLoadMoreContainer);

vi.mock("../js/dom.js", () => ({
  searchForm: mockSearchForm,
  searchInput: mockSearchInput,
  resultsContainer: mockResultsContainer,
  loadMoreContainer: mockLoadMoreContainer,
  loadMoreBtn: mockLoadMoreBtn,
  loadMoreError: mockLoadMoreError,
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
    mockLoadMoreContainer.hidden = true;
    mockLoadMoreError.hidden = true;
    mockLoadMoreError.textContent = "";
    mockLoadMoreBtn.textContent = "Carica più risultati";
    mockLoadMoreBtn.removeAttribute("aria-busy");
    mockLoadMoreBtn.blur();
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

  describe("pulsante «Carica più risultati»", () => {
    const makeWorks = (count, start = 0) =>
      Array.from({ length: count }, (_, i) => ({
        key: `/works/OL${start + i}W`,
        title: `Libro ${start + i}`,
      }));

    const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

    const deferred = () => {
      let resolve;
      const promise = new Promise((res) => {
        resolve = res;
      });
      return { promise, resolve };
    };

    const search = async (works, workCount, query = "fantasy") => {
      mockSearchInput.value = query;
      bookDataRequest.mockResolvedValueOnce({
        works,
        work_count: workCount,
      });
      mockSearchForm.dispatchEvent(new Event("submit", { cancelable: true }));
      await flush();
    };

    const loadMore = async () => {
      mockLoadMoreBtn.click();
      await flush();
    };

    describe("visibilità dopo la ricerca", () => {
      it("compare se ci sono altri risultati oltre a quelli mostrati", async () => {
        await search(makeWorks(12), 40);

        expect(mockLoadMoreContainer.hidden).toBe(false);
      });

      it("resta nascosto se i risultati mostrati sono già tutti", async () => {
        await search(makeWorks(12), 12);

        expect(mockLoadMoreContainer.hidden).toBe(true);
      });

      it("senza work_count compare solo se la pagina è piena", async () => {
        await search(makeWorks(10), undefined);
        expect(mockLoadMoreContainer.hidden).toBe(false);

        await search(makeWorks(3), undefined);
        expect(mockLoadMoreContainer.hidden).toBe(true);
      });

      it("si nasconde se una nuova ricerca non trova risultati o fallisce", async () => {
        await search(makeWorks(12), 40);
        expect(mockLoadMoreContainer.hidden).toBe(false);

        await search([], 0, "genere_vuoto");
        expect(mockLoadMoreContainer.hidden).toBe(true);

        await search(makeWorks(12), 40);
        mockSearchInput.value = "genere_inesistente";
        bookDataRequest.mockRejectedValueOnce(new HttpError("Not found", 404));
        mockSearchForm.dispatchEvent(new Event("submit", { cancelable: true }));
        await flush();

        expect(mockLoadMoreContainer.hidden).toBe(true);
      });

      it("si nasconde e azzera lo stato al click sul logo", async () => {
        await search(makeWorks(12), 40);
        bookDataRequest.mockClear();

        mockLogo.dispatchEvent(new Event("click", { cancelable: true }));
        expect(mockLoadMoreContainer.hidden).toBe(true);

        await loadMore();
        expect(bookDataRequest).not.toHaveBeenCalled();
      });
    });

    describe("caricamento di altri risultati", () => {
      it("richiede i 10 risultati successivi a partire da quelli già caricati", async () => {
        const moreWorks = makeWorks(10, 12);
        await search(makeWorks(12), 40);
        bookDataRequest.mockResolvedValueOnce({
          works: moreWorks,
          work_count: 40,
        });

        await loadMore();

        expect(bookDataRequest).toHaveBeenLastCalledWith("fantasy", {
          limit: 10,
          offset: 12,
        });
        expect(appendBooks).toHaveBeenCalledWith(
          moreWorks,
          12,
          mockResultsContainer,
        );
        expect(renderBooks).toHaveBeenCalledTimes(1);
        expect(mockLoadMoreContainer.hidden).toBe(false);
      });

      it("carica altri 10 risultati a ogni click, avanzando l'offset", async () => {
        await search(makeWorks(12), 100);

        for (const offset of [12, 22, 32]) {
          const works = makeWorks(10, offset);
          bookDataRequest.mockResolvedValueOnce({ works, work_count: 100 });

          await loadMore();

          expect(bookDataRequest).toHaveBeenLastCalledWith("fantasy", {
            limit: 10,
            offset,
          });
          expect(appendBooks).toHaveBeenLastCalledWith(
            works,
            offset,
            mockResultsContainer,
          );
        }
      });

      it("si nasconde quando ha caricato tutti i risultati disponibili", async () => {
        await search(makeWorks(12), 22);
        bookDataRequest.mockResolvedValueOnce({
          works: makeWorks(10, 12),
          work_count: 22,
        });

        await loadMore();

        expect(mockLoadMoreContainer.hidden).toBe(true);
      });

      it("si nasconde se la risposta non contiene altri libri", async () => {
        await search(makeWorks(12), 40);
        bookDataRequest.mockResolvedValueOnce({ works: [], work_count: 40 });

        await loadMore();

        expect(mockLoadMoreContainer.hidden).toBe(true);
      });

      it("dopo una nuova ricerca riparte dall'offset della nuova lista", async () => {
        await search(makeWorks(12), 40, "fantasy");
        bookDataRequest.mockResolvedValueOnce({
          works: makeWorks(10, 12),
          work_count: 40,
        });
        await loadMore();

        await search(makeWorks(12), 40, "Storia Antica");
        bookDataRequest.mockResolvedValueOnce({
          works: makeWorks(10, 12),
          work_count: 40,
        });
        await loadMore();

        expect(bookDataRequest).toHaveBeenLastCalledWith("storia_antica", {
          limit: 10,
          offset: 12,
        });
      });
    });

    describe("stato di caricamento ed errori", () => {
      it("mostra lo stato di caricamento e ignora i click mentre la richiesta è in corso", async () => {
        await search(makeWorks(12), 40);
        bookDataRequest.mockClear();
        const pending = deferred();
        bookDataRequest.mockReturnValueOnce(pending.promise);

        mockLoadMoreBtn.click();
        mockLoadMoreBtn.click();

        expect(bookDataRequest).toHaveBeenCalledTimes(1);
        expect(mockLoadMoreBtn.textContent).toBe("Caricamento in corso...");
        expect(mockLoadMoreBtn.getAttribute("aria-busy")).toBe("true");

        pending.resolve({ works: makeWorks(10, 12), work_count: 40 });
        await flush();

        expect(mockLoadMoreBtn.textContent).toBe("Carica più risultati");
        expect(mockLoadMoreBtn.getAttribute("aria-busy")).toBeNull();
        expect(appendBooks).toHaveBeenCalledTimes(1);
      });

      it("in caso di errore mostra un messaggio, mantiene il bottone e permette di riprovare", async () => {
        await search(makeWorks(12), 40);
        bookDataRequest.mockRejectedValueOnce(new Error("Network Error"));

        await loadMore();

        expect(mockLoadMoreError.hidden).toBe(false);
        expect(mockLoadMoreError.textContent).toBe(
          "Impossibile caricare altri risultati. Riprova.",
        );
        expect(mockLoadMoreContainer.hidden).toBe(false);
        expect(mockLoadMoreBtn.textContent).toBe("Carica più risultati");
        expect(appendBooks).not.toHaveBeenCalled();

        bookDataRequest.mockResolvedValueOnce({
          works: makeWorks(10, 12),
          work_count: 40,
        });
        await loadMore();

        expect(bookDataRequest).toHaveBeenLastCalledWith("fantasy", {
          limit: 10,
          offset: 12,
        });
        expect(mockLoadMoreError.hidden).toBe(true);
        expect(appendBooks).toHaveBeenCalledTimes(1);
      });

      it("scarta la risposta in ritardo se nel frattempo parte una nuova ricerca", async () => {
        await search(makeWorks(12), 40, "fantasy");
        const pending = deferred();
        bookDataRequest.mockReturnValueOnce(pending.promise);
        mockLoadMoreBtn.click();

        await search(makeWorks(5), 5, "storia");
        pending.resolve({ works: makeWorks(10, 12), work_count: 40 });
        await flush();

        expect(appendBooks).not.toHaveBeenCalled();
        expect(mockLoadMoreContainer.hidden).toBe(true);
        expect(mockLoadMoreBtn.textContent).toBe("Carica più risultati");
      });

      it("scarta la risposta in ritardo se nel frattempo si clicca sul logo", async () => {
        await search(makeWorks(12), 40);
        const pending = deferred();
        bookDataRequest.mockReturnValueOnce(pending.promise);
        mockLoadMoreBtn.click();

        mockLogo.dispatchEvent(new Event("click", { cancelable: true }));
        pending.resolve({ works: makeWorks(10, 12), work_count: 40 });
        await flush();

        expect(appendBooks).not.toHaveBeenCalled();
        expect(mockLoadMoreContainer.hidden).toBe(true);
      });
    });

    describe("focus da tastiera", () => {
      let newCard;

      beforeEach(() => {
        newCard = document.createElement("article");
        newCard.tabIndex = 0;
        document.body.appendChild(newCard);
      });

      afterEach(() => {
        newCard.remove();
      });

      it("sposta il focus sul primo nuovo risultato se il bottone sparisce mentre è focalizzato", async () => {
        await search(makeWorks(12), 22);
        bookDataRequest.mockResolvedValueOnce({
          works: makeWorks(10, 12),
          work_count: 22,
        });
        appendBooks.mockReturnValueOnce(newCard);
        mockLoadMoreBtn.focus();

        await loadMore();

        expect(mockLoadMoreContainer.hidden).toBe(true);
        expect(document.activeElement).toBe(newCard);
      });

      it("lascia il focus sul bottone finché ci sono altri risultati", async () => {
        await search(makeWorks(12), 40);
        bookDataRequest.mockResolvedValueOnce({
          works: makeWorks(10, 12),
          work_count: 40,
        });
        appendBooks.mockReturnValueOnce(newCard);
        mockLoadMoreBtn.focus();

        await loadMore();

        expect(document.activeElement).toBe(mockLoadMoreBtn);
      });
    });
  });
});