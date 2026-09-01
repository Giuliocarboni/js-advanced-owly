import {
  searchForm,
  searchInput,
  searchButton,
  resultsContainer,
} from "./dom.js";

const bookDataRequest = async (genre) => {
  try {
    const response = await fetch(
      `https://openlibrary.org/subjects/${genre}.json`,
    );
    if (!response.ok) {
      throw new Error("Errore durante il recupero dei dati.");
    }

    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error("Si è verificato un errore:", error);
    throw error;
  }
};

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = searchInput.value.toLowerCase().trim();
  if (query) {
    await bookDataRequest(query);
  }
});
