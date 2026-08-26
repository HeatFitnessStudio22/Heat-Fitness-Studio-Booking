# HEAT The Fitness Studio — Κράτηση Ραντεβού

Εφαρμογή κράτησης ραντεβού για το HEAT The Fitness Studio (Δεληγιώργη 119-121, Πειραιάς).
Next.js 14 (App Router) + Prisma + PostgreSQL + NextAuth, έτοιμη για deploy στο Vercel.

## Τι κάνει

- Πελάτες κάνουν εγγραφή/σύνδεση με **email + κωδικό** (`/register`, `/login`).
- Στο `/book` επιλέγουν ημέρα και ώρα (προπονήσεις 1 ώρας, ωράριο όπως στο
  [heat-fitness-studio.com](https://www.heat-fitness-studio.com)), βλέπουν **μόνο πόσες θέσεις
  μένουν** (ποτέ ονόματα άλλων πελατών), όριο **7 θέσεις/ώρα**.
- Στο `/admin` (μόνο για τον ιδιοκτήτη) βλέπετε όλα τα ραντεβού, μπορείτε να **ακυρώσετε**
  οποιοδήποτε, να ορίσετε το **μηνιαίο όριο προπονήσεων ανά email**, και βλέπετε ξεχωριστή λίστα
  με όσους το **υπερέβησαν** (εμφανίζεται και στο dashboard, και στέλνεται email σε εσάς αν έχετε
  ρυθμίσει το Resend).
- Χρώματα: μαύρο φόντο + neon κίτρινο (`#E4FF1A`) — αλλάξτε το hex στο `tailwind.config.ts` και
  `globals.css` αν θέλετε πιο κοντά στο ακριβές κίτρινο του λογότυπου.
- Τα λεκτικά (ΚΡΑΤΗΣΗ ΡΑΝΤΕΒΟΥ, ΕΠΙΛΕΞΕ ΗΜΕΡΑ, ΔΙΑΘΕΣΙΜΕΣ ΩΡΕΣ, το κείμενο ακύρωσης, τα κουμπιά
  "Κλείσε ραντεβού"/"Άκυρο") έχουν κρατηθεί όπως στα screenshots σας.

## Πριν το deploy

1. **Λογότυπο**: βάλτε το πραγματικό αρχείο σε `public/heat-logo.png` (δεν είχα καθαρό αρχείο,
   μόνο screenshots).
2. **Ωράριο**: ελέγξτε/προσαρμόστε το `src/lib/slots.ts` αν αλλάξει το ωράριο του γυμναστηρίου.
3. Αν θέλετε πιο ακριβές neon κίτρινο, αλλάξτε το hex `#E4FF1A` σε `tailwind.config.ts`
   (`colors.neon`) και `globals.css`.

## Deploy στο Vercel

1. Ανεβάστε αυτόν τον φάκελο σε ένα GitHub repo.
2. Στο [vercel.com](https://vercel.com), **New Project** → import το repo.
3. Προσθέστε μια Postgres βάση: Vercel → Storage → **Create Database** → Postgres (ή χρησιμοποιήστε
   [Neon](https://neon.tech) / [Supabase](https://supabase.com) — απλά βάλτε το connection string).
4. Στα **Environment Variables** του project βάλτε (δείτε και `.env.example`):
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET` (τρέξτε `openssl rand -base64 32`)
   - `NEXTAUTH_URL` (το τελικό domain σας, π.χ. `https://heat-fitness-booking.vercel.app`)
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`
   - `ADMIN_NOTIFICATION_EMAIL`
   - `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (προαιρετικό — για τα email ειδοποίησης υπέρβασης
     ορίου· δωρεάν λογαριασμό στο [resend.com](https://resend.com))
5. Deploy.
6. Δημιουργήστε τον λογαριασμό admin (μία φορά): από τοπικό τερματικό με το ίδιο `DATABASE_URL`,
   τρέξτε:
   ```bash
   npm install
   npx prisma migrate deploy
   npm run seed
   ```
   Αυτό δημιουργεί τον λογαριασμό σας (`ADMIN_EMAIL`/`ADMIN_PASSWORD`) με ρόλο admin. Συνδεθείτε
   στο `/login` με αυτά τα στοιχεία και θα σας πάει αυτόματα στο `/admin`.

## Τοπική ανάπτυξη

```bash
npm install
cp .env.example .env
# βάλτε ένα τοπικό/δωρεάν Postgres DATABASE_URL (π.χ. από Neon)
npx prisma migrate dev --name init
npm run seed
npm run dev
```

## Πώς λειτουργεί το μηνιαίο όριο

- Κάθε πελάτης έχει `monthlyLimit` στη βάση (null = χωρίς όριο μέχρι να το ορίσετε εσείς από το
  `/admin`).
- Όταν κλείνει ραντεβού #(όριο+1) μέσα στον ίδιο ημερολογιακό μήνα, το ραντεβού **δημιουργείται
  κανονικά** αλλά σημαίνεται ως υπέρβαση (`overLimit: true`), εμφανίζεται σε ξεχωριστή κόκκινη
  λίστα στο `/admin`, και (αν έχετε ρυθμίσει Resend) σας στέλνεται email. Δεν μπλοκάρει αυτόματα
  τον πελάτη — αν θέλετε αντί για ειδοποίηση να **μπλοκάρεται** η κράτηση, πείτε μου να το αλλάξω.

## Δομή

```
src/app/book/page.tsx        Σελίδα κράτησης (πελάτες)
src/app/admin/page.tsx       Dashboard ιδιοκτήτη
src/app/login, /register     Σύνδεση / εγγραφή πελατών
src/app/api/slots            Διαθεσιμότητα ανά ημέρα
src/app/api/bookings         Δημιουργία / λίστα / ακύρωση ραντεβού
src/app/api/admin/limits     Ορισμός μηνιαίου ορίου ανά email
src/lib/slots.ts             Ωράριο γυμναστηρίου + λογική slots (εδώ αλλάζετε το ωράριο)
src/lib/email.ts             Email ειδοποίησης υπέρβασης ορίου (Resend)
prisma/schema.prisma         Μοντέλα βάσης δεδομένων
```

