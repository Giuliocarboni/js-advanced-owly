import {
  bookDataRequest,
  descriptionDataRequest,
  HttpError,
  PAGE_SIZE,
} from "./api.js";
import {
  searchForm,
  searchInput,
  resultsContainer,
  loadMoreContainer,
  loadMoreBtn,
  loadMoreError,
} from "./dom.js";
import { renderBooks, appendBooks, renderDescription } from "./render.js";
import "../js-footer/footer-year-auto-update.js";

const LOAD_MORE_LABEL = "Carica più risultati";
const LOAD_MORE_LOADING_LABEL = "Caricamento in corso...";

const logo = document.getElementById("logo");

const state = {
  query: "",
  loaded: 0,
  searchId: 0,
  isLoadingMore: false,
};

const setLoadMoreBusy = (isBusy) => {
  loadMoreBtn.textContent = isBusy ? LOAD_MORE_LOADING_LABEL : LOAD_MORE_LABEL;
  if (isBusy) {
    loadMoreBtn.setAttribute("aria-busy", "true");
  } else {
    loadMoreBtn.removeAttribute("aria-busy");
  }
};

const resetLoadMore = () => {
  state.searchId += 1;
  state.query = "";
  state.loaded = 0;
  state.isLoadingMore = false;
  setLoadMoreBusy(false);
  loadMoreError.hidden = true;
  loadMoreError.textContent = "";
  loadMoreContainer.hidden = true;
};

const hasMoreResults = (data, pageLength, loaded) => {
  if (pageLength === 0) return false;
  return Number.isFinite(data.work_count)
    ? loaded < data.work_count
    : pageLength >= PAGE_SIZE;
};

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = searchInput.value.toLowerCase().trim().replace(/\s+/g, "_");
  if (query) {
    resetLoadMore();
    const searchId = state.searchId;
    try {
      resultsContainer.textContent = "Caricamento in corso...";
      const data = await bookDataRequest(query);
      if (searchId !== state.searchId) return;

      const works = data.works ?? [];
      state.query = query;
      state.loaded = works.length;
      renderBooks(data.works, query, resultsContainer);
      loadMoreContainer.hidden = !hasMoreResults(
        data,
        works.length,
        state.loaded,
      );
    } catch (error) {
      if (searchId !== state.searchId) return;
      if (error instanceof HttpError && error.status === 404) {
        resultsContainer.textContent =
          "Nessun genere trovato con questo nome. Prova con un altro termine.";
      } else {
        resultsContainer.textContent =
          "Impossibile recuperare i risultati. Verifica la tua connessione.";
      }
    }
  }
});

loadMoreBtn.addEventListener("click", async () => {
  if (state.isLoadingMore || !state.query) return;

  const searchId = state.searchId;
  const hadFocus = document.activeElement === loadMoreBtn;

  state.isLoadingMore = true;
  loadMoreError.hidden = true;
  setLoadMoreBusy(true);

  try {
    const data = await bookDataRequest(state.query, {
      limit: PAGE_SIZE,
      offset: state.loaded,
    });
    if (searchId !== state.searchId) return;

    const works = data.works ?? [];
    const firstNewCard = appendBooks(works, state.loaded, resultsContainer);
    state.loaded += works.length;

    const hasMore = hasMoreResults(data, works.length, state.loaded);
    loadMoreContainer.hidden = !hasMore;

    if (!hasMore && hadFocus) {
      const target =
        firstNewCard ??
        resultsContainer.querySelector(".book-card:last-of-type");
      target?.focus();
    }
  } catch (error) {
    if (searchId !== state.searchId) return;
    loadMoreError.textContent =
      "Impossibile caricare altri risultati. Riprova.";
    loadMoreError.hidden = false;
  } finally {
    if (searchId === state.searchId) {
      state.isLoadingMore = false;
      setLoadMoreBusy(false);
    }
  }
});

resultsContainer.addEventListener("click", async (event) => {
  if (event.target.closest(".book-description")) {
    return;
  }

  const card = event.target.closest("[data-key]");
  if (!card) return;

  const currentSelected = resultsContainer.querySelector(
    ".book-card.is-selected",
  );
  if (currentSelected && currentSelected !== card) {
    currentSelected.classList.remove("is-selected");
    currentSelected.setAttribute("aria-expanded", "false");
    const previousDescription =
      currentSelected.querySelector(".book-description");
    if (previousDescription) {
      previousDescription.hidden = true;
    }
  }

  card.classList.toggle("is-selected");
  card.setAttribute(
    "aria-expanded",
    String(card.classList.contains("is-selected")),
  );

  const key = card.dataset.key;
  const descriptionElement = card.querySelector(".book-description");

  if (
    descriptionElement &&
    descriptionElement.textContent !== "Caricamento descrizione..."
  ) {
    descriptionElement.hidden = !descriptionElement.hidden;
    return;
  }

  try {
    renderDescription(key, "Caricamento descrizione...", resultsContainer);

    const descriptionText = await descriptionDataRequest(key);

    renderDescription(key, descriptionText, resultsContainer);
  } catch (error) {
    renderDescription(
      key,
      "Impossibile recuperare la descrizione al momento.",
      resultsContainer,
    );
  }
});

resultsContainer.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    const card = event.target.closest("[data-key]");

    if (card) {
      event.preventDefault();
      card.click();
    }
  }
});

logo.addEventListener("click", (event) => {
  event.preventDefault();
  searchInput.value = "";
  resultsContainer.replaceChildren();
  resetLoadMore();
});
