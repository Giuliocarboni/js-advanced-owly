const baseURL = `https://openlibrary.org`;

export const PAGE_SIZE = 10;

export const bookDataRequest = async (genre, { limit, offset } = {}) => {
  try {
    const encodedGenre = encodeURIComponent(genre);
    const params = new URLSearchParams();
    if (limit !== undefined) params.set("limit", limit);
    if (offset !== undefined) params.set("offset", offset);
    const queryString = params.toString();
    const response = await fetch(
      `${baseURL}/subjects/${encodedGenre}.json${queryString ? `?${queryString}` : ""}`,
    );
    if (!response.ok) {
      throw new HttpError(
        `Errore durante il recupero dei dati: ${response.status}`,
        response.status,
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
      throw new Error(
        `Errore durante il recupero dei dati: ${response.status}`,
      );
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

export class HttpError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}
