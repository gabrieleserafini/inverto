## Setup
1. `cp .env.local.example .env.local` e imposta le variabili.
2. `npm install`
3. `npm run dev` → http://localhost:3000
4. Studio: http://localhost:3000/studio


## API
- POST `/api/track` → ingest eventi (batch)
- GET `/api/c/[code]` → shortlink → clickId + redirect
- GET `/api/cron/aggregate` → aggregazione giornaliera


## Test rapido
- Importa seed: `sanity dataset import scripts/seed.ndjson <dataset>`
- Visita `/api/c/ABCD` (se seed presente) → redirect con `ci,cr,ck`
- Inietta SDK in una pagina test e invia `purchase`
- Chiama `/api/cron/aggregate` → genera `campaignMetricsDaily`


Avvia lo Studio su /studio e inserisci:

una campaign (es. campaignId="cmp-demo-1"),

un creator (es. creatorId="cr-roberto"),

un campaignCreatorLink con landingUrl = http://localhost:3000/sandbox, shortCode="ABCD", opzionale couponCode="ROBERTO10".

SDK/Sandbox

Vai su http://localhost:3000/api/c/ABCD per generare un clickId e farti appendere ci/cr/ck alla sandbox.

Nella sandbox clicca add_to_cart, begin_checkout, purchase. Lo script chiama /api/track con sendBeacon.

Aggregazione

Apri http://localhost:3000/api/cron/aggregate per calcolare la giornata corrente; il job fa upsert su campaignMetricsDaily.

Dashboard

Vai su http://localhost:3000/dashboard?campaignId=cmp-demo-1 e verifica KPI, chart e tabella. Filtra creatorId se vuoi il drill-down per creator.