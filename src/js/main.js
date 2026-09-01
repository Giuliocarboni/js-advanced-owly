import { bookDataRequest } from "./api.js";
import {
  searchForm,
  searchInput,
  searchButton,
  resultsContainer,
} from "./dom.js";

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = searchInput.value.toLowerCase().trim();
  if (query) {
    await bookDataRequest(query);
  }
});
