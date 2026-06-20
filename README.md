# maskon — Ko'chmas mulk platformasi

Next.js 14 (App Router) asosida qurilgan to'liq ishlaydigan ko'chmas mulk platformasi.
Hozir namuna (mock) ma'lumot bilan ishlaydi — darrov ishga tushadi. Keyin Supabase ulanadi.

## Sahifalar
- `/` — Bosh sahifa (landing): hero, kategoriyalar, tavsiyalar, CTA
- `/listings` — E'lonlar ro'yxati + xarita (split-view, filtr tablari, interaktiv pinlar)
- `/property/[id]` — E'lon ichki sahifasi: galereya, ko'rsatkichlar, egasi, ipoteka
- `/add` — E'lon qo'shish formasi (6 bosqich, jonli preview)
- `/profile` — Profil/kabinet: statistika, e'lonlar, tablar
- `/login` — Kirish / Ro'yxatdan o'tish

## Ishga tushirish

Kompyuteringizda Node.js 18+ o'rnatilgan bo'lishi kerak (https://nodejs.org).

```bash
npm install
npm run dev
```

Brauzerda oching: http://localhost:3000

Production uchun:
```bash
npm run build
npm start
```

## Vercel'ga joylash (bepul, jonli sayt)
1. Loyihani GitHub'ga yuklang
2. https://vercel.com → "New Project" → GitHub repo'ni tanlang
3. "Deploy" — 1-2 daqiqada jonli URL tayyor

## Dizayn tizimi
- Asosiy rang: olovrang `#F2591F`
- Fon: krem `#FBF7F3`, panellar oq
- Shriftlar: Bricolage Grotesque (sarlavhalar) + Plus Jakarta Sans (matn)
- Ikonlar: Tabler Icons (webfont)
- Hamma stillar: `app/globals.css`

## Keyingi qadam — Supabase ulash
Hozir ma'lumot `lib/data.js` faylida (mock). Haqiqiy baza uchun:

1. https://supabase.com da bepro loyiha oching
2. `.env.local` fayl yarating (`.env.example` ga qarang):
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
3. `npm install @supabase/supabase-js`
4. `listings` jadvalini yarating va `lib/data.js` o'rniga Supabase'dan o'qing

`listings` jadvali uchun ustunlar: id, price_num, type, cat, addr, rooms, baths,
area, floor, top, photo, owner, status, created_at.

## Tuzilma
```
app/
  layout.js          shrift + global stillar
  globals.css        butun dizayn tizimi
  page.js            bosh sahifa
  listings/          e'lonlar + xarita
  property/[id]/     e'lon ichki sahifasi
  add/               e'lon qo'shish
  profile/           profil
  login/             kirish
components/ui.js     Nav, ListingCard
lib/data.js          namuna ma'lumot (keyin Supabase)
```
