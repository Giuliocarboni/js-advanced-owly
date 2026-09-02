import { bookDataRequest } from "./api.js";
import { searchForm, searchInput, resultsContainer } from "./dom.js";
import { renderBooks } from "./render.js";

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
