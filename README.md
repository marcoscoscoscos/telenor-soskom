# Hva gjør vi? 🎉

Stem på og foreslå sosiale aktiviteter for sommerjobben 2026!

## Oppsett (2 minutter)

Appen bruker **Vercel KV** for lagring — alt skjer i Vercel-dashbordet, ingen ekstern konto nødvendig.

### 1. Legg til KV-database i Vercel

1. Gå til [vercel.com](https://vercel.com) → åpne prosjektet `telenor-soskom`
2. Klikk **Storage** → **Create Database** → velg **KV**
3. Gi den et navn (f.eks. `soskom-kv`) og klikk **Create & Continue**
4. Klikk **Connect Project** → velg `telenor-soskom` → **Connect**
5. Gå tilbake til prosjektet og klikk **Redeploy** (siste deployment → ⋯ → Redeploy)

Det er alt! Miljøvariablene settes automatisk av Vercel.

### Lokal utvikling

```bash
vercel env pull .env.local   # henter KV-variabler fra Vercel
npm run dev
```

## Funksjoner

- **Stem** på aktiviteter (💜 = du har stemt)
- **Foreslå** nye aktiviteter med emoji, navn og beskrivelse
- Sortert etter flest stemmer
- Navn lagres i nettleseren — ingen innlogging nødvendig
- Én stemme per nettleser per aktivitet
