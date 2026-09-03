const baseURL = `https://openlibrary.org`;

export const bookDataRequest = async (genre) => {
  try {
    const encodedGenre = encodeURIComponent(genre);
    const response = await fetch(`${baseURL}/subjects/${encodedGenre}.json`);
    if (!response.ok) {
      throw new Error(
        `Errore durante il recupero dei dati: ${response.status}`,
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Si è verificato un errore:", error);
    throw error;
  }
};

export const descriptionDataRequest = async (key) => {
  try {
    const response = await fetch(`${baseURL}${key}.json`);
    if (!response.ok) {
      throw new Error(`Errore nella richiesta http: ${response.status}`);
    }
    const data = await response.json();
    if (!data.description) {
      return "Descrizione non disponibile";
    }

    return typeof data.description === "string"
      ? data.description
      : data.description.value;
  } catch (error) {
    console.error("Si è verificato un errore:", error);
    throw error;
  }
};
