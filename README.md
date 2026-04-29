# Drive Gallery

App Angular + Node.js che permette il login con Google e mostra le immagini del tuo Google Drive personale. Deployabile su Vercel.

---

## Architettura

```
drive-gallery/
├── frontend/            # Angular 19 (standalone components)
│   └── src/app/
│       ├── login/       # Pagina di login con Google
│       ├── gallery/     # Galleria immagini (masonry + lightbox)
│       ├── auth/        # AuthService, Guard, Interceptor JWT
│       └── drive/       # DriveService
├── api/                 # Vercel Serverless Functions (Node.js)
│   ├── auth/
│   │   ├── login.js     # Redirect a Google OAuth
│   │   ├── callback.js  # Scambia codice → JWT
│   │   └── me.js        # Restituisce l'utente corrente
│   └── drive/
│       ├── images.js    # Lista immagini dal Drive del proprietario
│       └── thumbnail.js # Proxy immagini (bypass CORS)
├── scripts/
│   └── get-refresh-token.js  # Script one-time per ottenere il refresh token
├── vercel.json
└── .env.local.example
```

---

## Step 1 — Google Cloud Console

1. Vai su [console.cloud.google.com](https://console.cloud.google.com)
2. Crea un nuovo progetto (es. `drive-gallery`)
3. Abilita le API:
   - **Google Drive API** → APIs & Services → Enable APIs → cerca "Drive"
   - **Google People API** (per il profilo utente)
4. Crea le credenziali OAuth 2.0:
   - APIs & Services → **Credentials** → Create Credentials → **OAuth client ID**
   - Application type: **Web application**
   - Nome: `Drive Gallery`
   - Authorized redirect URIs:
     - `http://localhost:4200/api/auth/callback` (sviluppo)
     - `https://tuo-progetto.vercel.app/api/auth/callback` (produzione)
5. Copia `Client ID` e `Client Secret`

---

## Step 2 — Ottieni il Refresh Token del Drive

Questo token permette al backend di accedere **sempre** al tuo Google Drive senza che tu debba riautenticarti.

```bash
# Installa la dipendenza
cd api && npm install

# Esegui lo script (usa le credenziali del passo precedente)
GOOGLE_CLIENT_ID=tuo-client-id \
GOOGLE_CLIENT_SECRET=tuo-client-secret \
node ../scripts/get-refresh-token.js
```

Lo script stamperà un URL → aprilo nel browser → autorizza → incolla il codice → copia il `refresh_token` stampato.

---

## Step 3 — Configurazione locale

```bash
cp .env.local.example .env.local
```

Compila `.env.local`:
```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_DRIVE_REFRESH_TOKEN=...       ← dal passo 2
JWT_SECRET=una-stringa-casuale-lunga  ← genera con: openssl rand -base64 32
FRONTEND_URL=http://localhost:4200
```

---

## Step 4 — Sviluppo locale

Apri **due terminali**:

```bash
# Terminale 1 — API
cd api
npm install
npm install express cors dotenv   # solo per il server locale
node server-local.js

# Terminale 2 — Frontend
cd frontend
npm install
npm start    # ng serve con proxy verso localhost:3000
```

Apri http://localhost:4200

---

## Step 5 — Deploy su Vercel

```bash
# Installa la CLI Vercel
npm i -g vercel

# Dalla root del progetto
vercel

# Segui le istruzioni, poi aggiungi le variabili d'ambiente:
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add GOOGLE_DRIVE_REFRESH_TOKEN
vercel env add JWT_SECRET
vercel env add FRONTEND_URL   # es. https://drive-gallery.vercel.app

# Build e deploy
vercel --prod
```

**Importante**: dopo il deploy, aggiorna il redirect URI nella Google Cloud Console aggiungendo `https://tuo-progetto.vercel.app/api/auth/callback`.

---

## Come funziona

```
Utente                 Frontend (Angular)         Backend (Vercel API)        Google
  │                         │                           │                        │
  │── clicca "Login" ──────>│                           │                        │
  │                         │── GET /api/auth/login ───>│                        │
  │                         │                           │── redirect ────────────>│
  │<─────────────────────────────────────────────────────────── consent screen ───│
  │── autorizza ────────────────────────────────────────────────────────────────->│
  │                         │                           │<── code ───────────────│
  │                         │                           │── exchange code ──────>│
  │                         │                           │<── tokens + userinfo ──│
  │                         │<── redirect /gallery#token=JWT ───────────────────│
  │                         │                           │                        │
  │                         │── GET /api/drive/images ─>│                        │
  │                         │   (Bearer JWT)            │── Drive API (owner) ──>│
  │                         │                           │<── immagini ───────────│
  │<── galleria ────────────│<── { images } ────────────│                        │
```

---

## Mostrare immagini da una cartella specifica

Aggiungi `?folderId=ID_CARTELLA` alla chiamata API, o passa il parametro dal frontend.

Per trovare l'ID di una cartella Drive: apri la cartella nel browser, l'ID è nell'URL dopo `/folders/`.

---

## Sicurezza

- Il JWT scade dopo 24 ore
- Il refresh token del Drive non viene mai esposto al frontend
- Tutte le immagini vengono proxiate tramite backend (nessuna chiave esposta al browser)
- La variabile `GOOGLE_DRIVE_REFRESH_TOKEN` è accessibile **solo** alle serverless functions
