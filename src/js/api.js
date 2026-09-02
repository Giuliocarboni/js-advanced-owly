const baseURL = `https://openlibrary.org/subjects/`;

export const bookDataRequest = async (genre) => {
  try {
    const encodedGenre = encodeURIComponent(genre);
    const response = await fetch(`${baseURL}${encodedGenre}.json`);
    if (!response.ok) {
      throw new Error("Errore durante il recupero dei dati.");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Si è verificato un errore:", error);
    throw error;
  }
};
