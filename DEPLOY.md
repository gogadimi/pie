# 🚀 DEPLOY NA VERCEL — Čekor po Čekor

## Opcija A: Preku Vercel Web UI (NAJLESNO — 2 minuti)

1. Odi na **https://vercel.com/new**
2. Klikni **"Import Git Repository"**
3. Najdi go repo-to: **gogadimi/pie**
4. Klikni **Import**
5. Vo **Project Name** napiši: `pie`
6. Klikni **Deploy**

Vercel automatic ќе:
- ✅ Go detektira Next.js
- ✅ Go build-a projektot
- ✅ Go deploy-e na `pie-xxx.vercel.app`

### Potoa — podesi ги Environment Variables:

Odi na project → **Settings → Environment Variables** i dodadi ги:

```
DATABASE_URL=postgresql://...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
ANTHROPIC_API_KEY=sk-ant-...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_APP_URL=https://xxx.vercel.app
```

---

## Opcija B: Preku Vercel CLI (ako go imash lokalno)

```bash
# Instaliraj go Vercel CLI
npm i -g vercel

# Vo lokalniot pie/ direktorium
cd pie
vercel login
vercel --prod
```

---

## Opcija C: Preku GitHub Integration

1. Odi na **https://github.com/apps/vercel-integration**
2. Install go Vercel GitHub app-ot
3. Izberi go `gogadimi/pie` repo-to
4. Potoa odi na **https://vercel.com/new**
5. Import go repo-to
6. Sekoj nov `git push` ke deploy-e automaticki!

---

## ✅ Po deploy — testiraj gi ovie URL:

```
https://xxx.vercel.app              → Landing page
https://xxx.vercel.app/pricing      → Pricing plans
https://xxx.vercel.app/dashboard    → Dashboard (so auth)
https://xxx.vercel.app/api/scrape   → Scraping API test
```
