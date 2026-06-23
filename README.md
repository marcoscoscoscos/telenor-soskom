# Telenor Soskom 🎉

Stem på og foreslå sosiale aktiviteter for sommerjobben!

## Oppsett (5 minutter)

### 1. Opprett Supabase-prosjekt (gratis)

1. Gå til [supabase.com](https://supabase.com) og opprett en konto
2. Klikk **New Project**, velg et navn og passord
3. Gå til **SQL Editor** og lim inn innholdet fra [`supabase-schema.sql`](./supabase-schema.sql) og kjør det
4. Gå til **Project Settings → API** og kopier:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Legg til miljøvariabler i Vercel

Gå til Vercel-prosjektet ditt → **Settings → Environment Variables** og legg til:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Trykk **Redeploy** etterpå.

### 3. Lokal utvikling

```bash
cp .env.local.example .env.local
# Fyll inn verdiene fra Supabase
npm run dev
```

## Funksjoner

- **Stem** på aktiviteter (💜 = du har stemt, 🤍 = ikke stemt)
- **Foreslå** nye aktiviteter med emoji, navn og beskrivelse
- Sortert automatisk etter flest stemmer
- Navn lagres i nettleseren (ingen innlogging nødvendig)
- Én stemme per person per aktivitet (basert på browser-ID)
