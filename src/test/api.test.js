import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { bookDataRequest, descriptionDataRequest } from "../js/api.js";

describe("api.js", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("bookDataRequest", () => {
    it("effettua la chiamata all'URL corretto con genere codificato", async () => {
      const mockData = { works: [{ title: "Dune" }] };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await bookDataRequest("sci-fi & fantasy");
      expect(fetch).toHaveBeenCalledWith(
        "https://openlibrary.org/subjects/sci-fi%20%26%20fantasy.json",
      );
      expect(result).toEqual(mockData);
    });

    it("lancia un'eccezione se la risposta HTTP non è ok", async () => {
      fetch.mockResolvedValueOnce({ ok: false, status: 500 });

      await expect(bookDataRequest("fantasy")).rejects.toMatchObject({
        message: "Errore durante il recupero dei dati: 500",
        status: 500,
      });
    });

    it("lancia un'eccezione in caso di errore di rete", async () => {
      fetch.mockRejectedValueOnce(new Error("Errore di rete"));

      await expect(bookDataRequest("fantasy")).rejects.toThrow(
        "Errore di rete",
      );
    });
  });

  describe("descriptionDataRequest", () => {
    it("estrae la descrizione quando è fornita come stringa semplice", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ description: "Descrizione del libro." }),
      });

      const result = await descriptionDataRequest("/works/123");
      expect(result).toBe("Descrizione del libro.");
    });

    it("estrae la descrizione quando è fornita come oggetto { value: ... }", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          description: { value: "Descrizione dentro oggetto." },
        }),
      });

      const result = await descriptionDataRequest("/works/123");
      expect(result).toBe("Descrizione dentro oggetto.");
    });

    it("restituisce la stringa di fallback se il campo description è assente", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const result = await descriptionDataRequest("/works/123");
      expect(result).toBe("Descrizione non disponibile");
    });

    it("lancia un'eccezione se la risposta HTTP non è ok", async () => {
      fetch.mockResolvedValueOnce({ ok: false, status: 404 });

      await expect(descriptionDataRequest("/works/123")).rejects.toThrow(
        "Errore durante il recupero dei dati: 404",
      );
    });

    it("lancia un'eccezione in caso di errore di rete", async () => {
      fetch.mockRejectedValueOnce(new Error("Connessione interrotta"));

      await expect(descriptionDataRequest("/works/123")).rejects.toThrow(
        "Connessione interrotta",
      );
    });
  });
});
