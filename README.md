# Owly

Owly è un'applicazione web che permette di cercare generi letterari e di scoprire i libri più popolari in ogni categori tramite la API di [OpenLibrary](https://openlibrary.org/).

---

## Indice

- [Descrizione del progetto](#descrizione-del-progetto)
- [Funzionalità](#funzionalità)
- [Stack](#stack)
- [Architettura e design pattern](#architettura-e-design-pattern)
- [Test](#test)
- [Accessibilità](#accessibilità)
- [Design](#design)

---

## Descrizione del progetto

Owly è una **single page application** costruita in **Vanilla JavaScript**.

Nel momento in cui l'utente cerca un genere letterario (es. fantasy, history, war) l'app interroga l'API pubblica di OpenLibrary per restituire l'elenco delle opere più rilevanti in quella categoria. Il titolo di ogni libro può essere cliccato per caricare la sua descrizione completa (nel caso in cui fosse disponibile nel database di OpenLibrary).

## Funzionalità

- **Ricerca per genere letterario**, con normalizzazione automatica della query nel formato richiesto dall'API (minuscolo e spazi convertiti in underscore);
- **elenco numerato dei libri**, con titolo e autori;
- **gestione delle opere anonime**: se il nome dell'autore coincide con il titolo del libro viene mostrato "Autore anonimo";
- **descrizione caricata su richiesta dell'utente**: il testo descrittivo di un'opera viene richiesto all'API solo al primo click sulla relativa card, per non rallentare la ricerca iniziale;
- **lista risultati ad accordion**: può restare aperta una sola card alla volta; se l'utente clicca su un'altra card, quella precedente si chiude;
- **navigabile da tastiera**: le card sono selezionabili con `Tab` e cliccabili con `Enter` e `Space`;
- **stati di caricamento ed errore** dedicati, sia per la ricerca che per la singola descrizione;
- **layout responsive** a colonna singola, facilmente leggibile sia da mobile che da desktop.

## Stack

- **HTML5**
- **CSS3**
- **JavaScript**
- **Vite**
- **Vitest**
- **[OpenLibrary API](https://openlibrary.org/developers/api)**

## Architettura e design pattern

La logica dell'applicazione è organizzata in quattro moduli per separare le responsabilità:

- **`dom.js`** contiene i riferimenti agli elementi DOM, così da evitare possibili `document.getElementById` o `querySelector` sparsi negli altri moduli;
- **`api.js`** contiene le chiamate `fetch` verso OpenLibrary e gestisce gli errori HTTP e la normalizzazione dei dati;
- **`render.js`** contiene le funzioni che aggiornano il DOM;
- **`main.js`** collega gli eventi utente alle chiamate API e alle funzioni di rendering.

## Test

Il progetto usa **Vitest** e comprende 25 test unitari divisi in tre file, uno per ogni modulo con logica. Per i test che coinvolgono il DOM viene usato **jsdom**, che simula il browser in Node.

## Accessibilità

Nel progetto sono state impiegate diverse pratiche di accessibilità:

- **HTML semantico**: `header`, `nav`, `form`, `article` per le card invece di generici `div`.
- **`aria-live="polite"`** sul contenitore dei risultati: gli screen reader comunicano la presenza di nuovi risultati senza interrompere la lettura in corso;
- **`:focus-visible`** con outline dedicato e offset negativo, per distinguere chiaramente il focus da tastiera dal semplice hover del mouse, senza che l'outline "esca" dai bordi della lista;
- **`prefers-reduced-motion`**: tutte le transizioni vengono disattivate per gli utenti che hanno richiesto una riduzione delle animazioni a livello di sistema operativo;
- **`aria-label`** nel cmapo di ricerca;
- **separazione tra area cliccabile e testo selezionabile nelle card**: il click sul testo della descrizione non ne provoca la chiusura e il cursore passa a `text`, in modo da poterla rendere selezionabile.

## Design

Il layout è pensato a colonna singola, il che lo rende fluido e leggibile sia su desktop che su mobile.
La palette di colori dell'applicazione 
