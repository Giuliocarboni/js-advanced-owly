import { bookDataRequest, descriptionDataRequest } from "./api.js";
import { searchForm, searchInput, resultsContainer } from "./dom.js";
import { renderBooks, renderDescription } from "./render.js";

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = searchInput.value.toLowerCase().trim();
  if (query) {
    try {
      resultsContainer.textContent = "Caricamento in corso...";
      const data = await bookDataRequest(query);
      renderBooks(data.works, resultsContainer);
    } catch (error) {
      resultsContainer.textContent =
        "Impossibile recuperare i risultati. Verifica la tua connessione.";
    }
  }
});

resultsContainer.addEventListener("click", async (event) => {
  const card = event.target.closest("[data-key]");
  if (!card) return;

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
