import { bookDataRequest, descriptionDataRequest, HttpError } from "./api.js";
import { searchForm, searchInput, resultsContainer } from "./dom.js";
import { renderBooks, renderDescription } from "./render.js";

const logo = document.getElementById("logo");

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = searchInput.value.toLowerCase().trim().replace(/\s+/g, "_");
  if (query) {
    try {
      resultsContainer.textContent = "Caricamento in corso...";
      const data = await bookDataRequest(query);
      renderBooks(data.works, query, resultsContainer);
    } catch (error) {
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
});
