# Piano di Modifica per Dominio camparinoweek.com

Questo documento riassume le modifiche pianificate per migrare il progetto al nuovo dominio.

## 1. Struttura Dominio Approvata

- **Frontend:** `https://www.camparinoweek.com`
- **Backend:** `https://api.camparinoweek.com`
- **Redirect:** `http(s)://camparinoweek.com` reindirizzerà a `https://www.camparinoweek.com`

## 2. Modifiche al Codice (Azione dell'Assistente AI)

I seguenti file verranno modificati per riflettere la nuova struttura:

1.  **`test-endpoint-direct.html`**:
    -   **Obiettivo:** Aggiornare l'URL di test del backend.
    -   **URL da modificare:** `https://backend-campari-lottery-production.up.railway.app/...`
    -   **URL Nuovo:** `https://api.camparinoweek.com/...`

2.  **`backend/src/server.ts`**:
    -   **Obiettivo:** Aggiornare la lista delle origini consentite (CORS) e l'URL base dell'applicazione per i QR code.
    -   **Modifica a `CORS_ORIGINS`:** Verrà aggiunto `https://www.camparinoweek.com` alla lista delle origini permesse.
    -   **Modifica a `APP_URL`:** Il valore di default verrà aggiornato per usare `https://www.camparinoweek.com`.

## 3. Modifiche alle Variabili d'Ambiente (Azione Manuale Utente)

Le seguenti variabili d'ambiente dovranno essere aggiornate manualmente nei rispettivi file `.env` e/o nelle impostazioni dei servizi su Railway.

1.  **Servizio `frontend` (su Railway e nel file `frontend/.env.local` se usato):**
    -   `NEXT_PUBLIC_API_URL` dovrà essere impostato a `https://api.camparinoweek.com`

2.  **Servizio `backend` (su Railway e nel file `backend/.env`):**
    -   `FRONTEND_URL` dovrà essere impostato a `https://www.camparinoweek.com`
    -   `CORS_ORIGINS` dovrà includere `https://www.camparinoweek.com`.
