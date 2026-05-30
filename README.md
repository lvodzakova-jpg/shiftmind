# ShiftMind

AI aplikácia na správu týždenného rozvrhu zmien pre kaviarne.

## Jazyky

Aplikácia podporuje **slovenčinu (SK)**, **angličtinu (EN)** a **španielčinu (ES)**. Prepínač je v navigácii; výber sa ukladá do `localStorage` (`shiftmind-locale`). Preklady sú v `lib/translations.ts`, bez externých i18n knižníc.

## Funkcie

- **/** — Prehľad manažéra, súhrn týždňa, upozornenia, tlačidlo „AI zostaviť rozvrh“
- **/schedule** — Tabuľka rozvrhu (zamestnanci × dni), farebné typy zmien
- **/staff** — Zoznam zamestnancov, pridávanie a mazanie
- **/preferences** — Dostupnosť zamestnanca na každý deň v týždni
- **POST /api/generate-schedule** — Claude AI vygeneruje a uloží rozvrh do Supabase

## Typy zmien

| Typ | Čas | Popis |
|-----|-----|--------|
| `morning` | 7:00–15:00 | Ranná |
| `evening` | 14:00–22:00 | Večerná |
| `full` | 7:00–19:00 | Celá |
| `off` | — | Voľno |
| `sick` | — | PN |

## Inštalácia

1. Nainštalujte závislosti:

```bash
npm install
```

2. V `.env.local` nastavte:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
ANTHROPIC_API_KEY=...
```

3. V [Supabase SQL Editori](https://supabase.com/dashboard) spustite celý súbor `supabase/schema.sql`.

4. Spustite vývojový server:

```bash
npm run dev
```

Otvorte [http://localhost:3000](http://localhost:3000).

## API

```http
POST /api/generate-schedule
Content-Type: application/json

{ "week_start": "2026-06-01" }
```

Ak `week_start` chýba, použije sa aktuálny týždeň (pondelok).
