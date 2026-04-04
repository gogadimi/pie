# PIE — Implementation Plan v2.0

> **Pricing Intelligence Engine** — Next.js 15 full-stack SaaS
> Created: 2026-04-05 | Author: Zoki (Hermes Agent)
> Based on: Market research on 10+ competitors + existing PIE README

---

## GOAL

Build MVP of PIE — a SaaS pricing intelligence platform that:
1. Scrapes competitor prices in real-time
2. AI analyzes & recommends optimal pricing
3. Users can approve or auto-execute price changes
4. Full dashboard with alerts, history, simulator

**Target:** Working MVP in 8-10 weeks
**Stack:** Next.js 15 + TypeScript + PostgreSQL + Redis + AI (LangGraph/LLM) + Puppeteer/Firecrawl

---

## ARCHITECTURE OVERVIEW

```
┌──────────────────────────────────────────────┐
│  NEXT.JS 15 (App Router)                     │
│  ┌───────────┬──────────┬──────────┐         │
│  │ /dashboard│ /pricing │ /alerts  │ Frontend│
│  └───────────┴──────────┴──────────┘         │
│  ┌──────────────────────────────────┐        │
│  │  Server Actions / API Routes     │ Backend│
│  │  /api/products, /api/scrape,     │        │
│  │  /api/pricing, /api/alerts       │        │
│  └────────────┬─────────────────────┘        │
└───────────────┼──────────────────────────────┘
                │
    ┌───────────┼───────────┐
    ▼           ▼           ▼
┌────────┐ ┌────────┐ ┌────────────┐
│Postgres│ │ Redis  │ │ BullMQ     │
│(Neon)  │ │Upstash │ │ Queue      │
└────────┘ └────────┘ └─────┬──────┘
                             │
                    ┌────────▼─────────┐
                    │ Scraping Worker  │
                    │ (separate process│
                    │  Puppeteer + proxy)│
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │ AI Layer         │
                    │ (LangGraph +     │
                    │  OpenAI/Claude)  │
                    └──────────────────┘
```

---

## PHASE 0 — SETUP (Week 1, Days 1-3)

### Tasks

| # | Task | Details | Files |
|---|------|---------|-------|
| 0.1 | Init Next.js 15 project | `npx create-next-app@latest pie --typescript --tailwind --app --no-src-dir` | `pie/` |
| 0.2 | Setup ESLint + Prettier | Strict TypeScript config | `.eslintrc`, `prettier.config.js`, `tsconfig.json` |
| 0.3 | Setup PostgreSQL (Neon/Supabase) | DB instance + connection string | `.env.local` |
| 0.4 | Setup Redis (Upstash) | Cache + pub/sub for real-time updates | `.env.local` |
| 0.5 | Auth (Clerk or NextAuth) | Multi-user with organizations/teams | `app/(auth)/` |
| 0.6 | Setup Drizzle ORM | Type-safe DB queries + schema | `db/schema.ts`, `db/index.ts` |
| 0.7 | Setup BullMQ + Queue | For scraping jobs | `lib/queue.ts` |
| 0.8 | Setup scraping worker | Separate Node.js process | `worker/scrape.ts` |
| 0.9 | Environment template | All required env vars | `.env.example` |

**Verification:**
- [ ] `npm run dev` starts without errors
- [ ] DB connection works (run test query)
- [ ] Redis connection works
- [ ] Auth login/signup flow works

---

## PHASE 1 — CORE DATA MODEL + PRODUCT IMPORT (Week 1-2, Days 4-14)

### Tasks

| # | Task | Details | Files |
|---|------|---------|-------|
| 1.1 | DB Schema: organizations | Multi-tenant setup | `db/schema.ts` |
| 1.2 | DB Schema: products | Products with prices, costs, margins | `db/schema.ts` |
| 1.3 | DB Schema: competitors | Competitor URLs + metadata | `db/schema.ts` |
| 1.4 | DB Schema: price_records | Historical price data (time series) | `db/schema.ts` |
| 1.5 | DB Schema: price_recommendations | AI suggestions with status tracking | `db/schema.ts` |
| 1.6 | DB Schema: alerts | Alert notifications | `db/schema.ts` |
| 1.7 | Product CSV Import | Drag & drop CSV upload + parse | `app/dashboard/import` |
| 1.8 | Product manual entry | Form to add products one by one | `app/dashboard/products` |
| 1.9 | Product API | CRUD endpoints for products | `app/api/products/` |
| 1.10 | Competitor URL management | Add/remove competitor URLs per product | `app/dashboard/competitors` |

**Key Schema (Drizzle ORM):**
```ts
// organizations
//   id, name, plan, created_at, updated_at

// products
//   id, org_id, name, sku, current_price, cost_price,
//   currency, category, source, external_id, created_at

// competitors
//   id, org_id, name, url, industry, is_active, created_at

// price_records
//   id, product_id, competitor_id, competitor_url,
//   price, original_price, discount_pct, in_stock,
//   currency, scraped_at

// price_recommendations  
//   id, product_id, current_price, suggested_price,
//   reason, expected_profit_change, expected_volume_change,
//   confidence_score, status, created_at

// alerts
//   id, org_id, type, message, severity, is_read, created_at
```

**Verification:**
- [ ] Can create org, add products via CSV
- [ ] Can add competitor URLs to products
- [ ] All DB tables exist and are queryable
- [ ] API returns correct data

---

## PHASE 2 — SCRAPING ENGINE (Week 3-4, Days 15-28)

### Tasks

| # | Task | Details | Files |
|---|------|---------|-------|
| 2.1 | Puppeteer scraper module | Core scraping logic | `lib/scraper/puppeteer.ts` |
| 2.2 | Firecrawl integration | Fallback for anti-bot sites | `lib/scraper/firecrawl.ts` |
| 2.3 | Proxy integration | Rotating residential proxies | `lib/scraper/proxy.ts` |
| 2.4 | Anti-detection | User-agent, fingerprint, CAPTCHA handling | `lib/scraper/stealth.ts` |
| 2.5 | Queue-based scraping | BullMQ jobs for each competitor URL | `worker/scrape.ts` |
| 2.6 | Price extraction AI | LLM extracts price from HTML | `lib/scraper/extract.ts` |
| 2.7 | Retry + fallback logic | Multi-strategy scraping | `lib/scraper/engine.ts` |
| 2.8 | Price normalization | Currency, formatting, discounts | `lib/pricing/normalize.ts` |
| 2.9 | Product matching AI | Match scraped products to user's | `lib/pricing/match.ts` |
| 2.10 | Scraping scheduler | Cron jobs + configurable intervals | `lib/scheduler.ts` |
| 2.11 | Scraping dashboard | View status, last scrape, errors | `app/dashboard/scraping` |
| 2.12 | Rate limiting | Per-domain rate limits | `lib/scraper/ratelimit.ts` |

**Scraper Architecture:**
```
User adds competitor URL
         │
         ▼
  ┌─ Queue Job ───────────┐
  │  ScrapeJob            │
  │  - URL                │
  │  - Product ID         │
  │  - Max retries: 3     │
  └────────┬──────────────┘
           │
           ▼
  ┌─ Strategy 1 ─────────┐
  │  Puppeteer + Stealth  │
  └───────┬──────────────┘
      Fail?│
           ▼
  ┌─ Strategy 2 ─────────┐
  │  Firecrawl API        │
  └───────┬──────────────┘
      Fail?│
           ▼
  ┌─ Strategy 3 ─────────┐
  │  Static fetch + regex │
  └───────┬──────────────┘
           │
           ▼
  ┌─ Extract Prices ─────┐
  │  LLM parses HTML     │
  │  → {price, currency, │
  │     discount, in_stock}│
  └───────┬──────────────┘
           │
           ▼
  ┌─ Store & Match ─────┐
  │  Save to DB          │
  │  Match to product    │
  │  Trigger alerts      │
  └─────────────────────┘
```

**Verification:**
- [ ] Can scrape 10+ competitor URLs successfully
- [ ] Handles anti-bot sites (Cloudflare, etc.)
- [ ] Price extraction is >90% accurate
- [ ] Scraping jobs queue and execute asynchronously
- [ ] Errors are logged and retried

---

## PHASE 3 — DASHBOARD + PRICE MAP (Week 5-6, Days 29-42)

### Tasks

| # | Task | Details | Files |
|---|------|---------|-------|
| 3.1 | Dashboard layout | Sidebar + main content + header | `app/dashboard/layout.tsx` |
| 3.2 | Dashboard overview | KPI cards + charts | `app/dashboard/page.tsx` |
| 3.3 | Live Price Map | Table/heatmap: my prices vs competitors | `app/dashboard/price-map/page.tsx` |
| 3.4 | Price comparison chart | Line chart: price history over time | `app/dashboard/(components)/price-chart.tsx` |
| 3.5 | Competitor list | Table with status, last scrape | `app/dashboard/competitors/page.tsx` |
| 3.6 | Price heatmap | Color-coded: green = below market, red = above | `app/dashboard/(components)/heatmap.tsx` |
| 3.7 | Product detail page | Full competitor comparison per product | `app/dashboard/products/[id]/page.tsx` |
| 3.8 | WebSocket/real-time | Push price updates to frontend | `app/api/ws`, `lib/websocket.ts` |
| 3.9 | Responsive design | Mobile-friendly sidebar + tables | Various components |

**Dashboard UI Components:**
```
Dashboard/
├── OverviewPage
│   ├── RevenueImpact card
│   ├── CompetitorsTracked card
│   ├── PriceChangesToday card
│   ├── OpenRecommendations card
│   └── PriceHistoryChart (last 30 days)
│
├── PriceMap
│   ├── DataTable (sortable, filterable)
│   ├── PriceHeatmap
│   └── Export buttons (CSV/PDF)
│
├── ProductDetail
│   ├── Product info header
│   ├── Competitor price list (with timestamps)
│   ├── Price history chart
│   └── AI recommendation card
│
└── Competitors
    ├── Competitor list
    ├── Add competitor form
    └── Scrape status indicators
```

**Verification:**
- [ ] Dashboard loads in <2s
- [ ] Price map shows all products vs competitors
- [ ] Charts render correctly
- [ ] Real-time updates work (price changes push to UI)
- [ ] Mobile layout works

---

## PHASE 4 — AI PRICING AGENT (Week 7-8, Days 43-56)

### Tasks

| # | Task | Details | Files |
|---|------|---------|-------|
| 4.1 | LLM Setup | OpenAI/Claude integration + prompts | `lib/ai/client.ts` |
| 4.2 | Price Analysis Prompt | Structured prompt for pricing analysis | `lib/ai/prompts/analysis.ts` |
| 4.3 | Recommendation Engine | Generate price suggestions with reasoning | `lib/ai/recommend.ts` |
| 4.4 | Confidence Scoring | How confident is the AI in each suggestion? | `lib/ai/confidence.ts` |
| 4.5 | Approval Workflow | User approves/rejects recommendations | `app/dashboard/recommendations/` |
| 4.6 | Scenario Simulator | "What if" tool for testing price changes | `app/dashboard/simulator/page.tsx` |
| 4.7 | Auto-execute (Stripe) | API integration for price changes | `lib/integrations/stripe.ts` |
| 4.8 | Auto-execute (Shopify) | Product price updates via API | `lib/integrations/shopify.ts` |
| 4.9 | Safety Rails | Min margin, max change %, floor/ceiling | `lib/pricing/safety.ts` |
| 4.10 | Alert System | Slack/Email/Telegram notifications | `lib/alerts/index.ts` |

**AI Agent Flow:**
```
Trigger (scrape complete / scheduled / manual)
         │
         ▼
  ┌─ Analysis Phase ────────┐
  │  1. Gather all price     │
  │     data for product     │
  │  2. Calculate market     │
  │     position             │
  │  3. Check margin impact  │
  │  4. Consider seasonality │
  └────────┬────────────────┘
           │
           ▼
  ┌─ Recommendation Phase ──┐
  │  LLM generates:         │
  │  - suggested_price      │
  │  - reason (structured)  │
  │  - expected profit Δ    │
  │  - confidence score      │
  │  - urgency (low/med/high)│
  └────────┬────────────────┘
           │
           ▼
  ┌─ User Review UI ────────┐
  │  "Competitor X dropped   │
  │   15%. We recommend:     │
  │   €42 → €38 (+3% volume) │
  │   [Approve] [Reject]     │
  │   [Simulate →]           │
  └────────┬────────────────┘
           │
      Approved?
           │
           ▼
  ┌─ Execution ─────────────┐
  │  1. Update price via API │
  │  2. Log in DB            │
  │  3. Notify user          │
  └─────────────────────────┘
```

**Verification:**
- [ ] AI generates meaningful recommendations (not random)
- [ ] Confidence scores correlate with actual outcomes
- [ ] Approval workflow is smooth
- [ ] Simulator shows accurate what-if analysis
- [ ] Auto-execute works with at least one integration (Stripe)

---

## PHASE 5 — POLISH + LAUNCH (Week 9-10, Days 57-70)

### Tasks

| # | Task | Details | Files |
|---|------|---------|-------|
| 5.1 | Performance audit | Optimize queries, add indexes, cache | DB + API |
| 5.2 | Error handling | Better UX for all error states | Throughout app |
| 5.3 | Loading states | Skeletons + spinners everywhere | Components |
| 5.4 | Multi-currency | Auto-convert and display in user's currency | `lib/pricing/currency.ts` |
| 5.5 | Landing page | Marketing site with sign-up CTA | `app/(marketing)/` |
| 5.6 | Billing (Stripe) | Subscription plans | `app/api/webhooks/stripe/` |
| 5.7 | Documentation | User guide + API docs | `docs/` |
| 5.8 | Testing | E2E tests (Playwright) + unit tests | `tests/` |
| 5.9 | Monitoring | Sentry + logging + metrics | Config files |
| 5.10 | Deploy | Vercel (frontend+API) + worker (Railway/Koyeb) | `vercel.json` |

**Verification:**
- [ ] All tests pass
- [ ] Landing page converts visitors → sign-ups
- [ ] Billing flow works (Stripe checkout → active subscription)
- [ ] App responds in <3s under load
- [ ] Error monitoring is active

---

## FILES TO CREATE (Complete List)

```
pie/
├── .env.example
├── .env.local
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── vercel.json
│
├── db/
│   ├── schema.ts              # All Drizzle table definitions
│   ├── index.ts               # DB connection
│   └── migrate.ts             # Migration runner
│
├── lib/
│   ├── utils.ts               # Shared utilities
│   ├── auth.ts                # Auth helpers
│   │
│   ├── scraper/
│   │   ├── engine.ts          # Main scraping orchestrator
│   │   ├── puppeteer.ts       # Puppeteer scraper
│   │   ├── firecrawl.ts       # Firecrawl fallback
│   │   ├── proxy.ts           # Proxy management
│   │   ├── stealth.ts         # Anti-detection
│   │   ├── extract.ts         # LLM price extraction
│   │   └── ratelimit.ts       # Per-domain rate limits
│   │
│   ├── pricing/
│   │   ├── normalize.ts       # Currency/format normalization
│   │   ├── match.ts           # AI product matching
│   │   ├── safety.ts          # Safety rails (min margin, etc.)
│   │   └── currency.ts        # Multi-currency conversion
│   │
│   ├── ai/
│   │   ├── client.ts          # LLM client setup
│   │   ├── recommend.ts       # Price recommendation engine
│   │   ├── confidence.ts      # Confidence scoring
│   │   └── prompts/
│   │       ├── analysis.ts    # Pricing analysis prompts
│   │       ├── matching.ts    # Product matching prompts
│   │       └── extraction.ts  # Price extraction prompts
│   │
│   ├── integrations/
│   │   ├── stripe.ts          # Stripe price updates
│   │   ├── shopify.ts         # Shopify product sync
│   │   └── woocommerce.ts     # WooCommerce sync
│   │
│   ├── alerts/
│   │   ├── index.ts           # Alert manager
│   │   ├── email.ts           # Email alerts
│   │   ├── slack.ts           # Slack webhooks
│   │   └── telegram.ts        # Telegram bot alerts
│   │
│   ├── queue.ts               # BullMQ setup
│   ├── scheduler.ts           # Cron/scheduled jobs
│   └── websocket.ts           # Real-time updates
│
├── worker/
│   ├── scrape.ts              # Scraping worker process
│   └── index.ts               # Worker entry point
│
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── layout.tsx
│   │
│   ├── (marketing)/
│   │   ├── page.tsx           # Landing page
│   │   ├── pricing/page.tsx   # Pricing plans
│   │   └── layout.tsx
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx         # Dashboard shell
│   │   ├── page.tsx           # Overview
│   │   │
│   │   ├── products/
│   │   │   ├── page.tsx       # Product list
│   │   │   └── [id]/page.tsx  # Product detail
│   │   │
│   │   ├── competitors/page.tsx
│   │   ├── price-map/page.tsx
│   │   ├── recommendations/page.tsx
│   │   ├── simulator/page.tsx
│   │   ├── alerts/page.tsx
│   │   ├── scraping/page.tsx
│   │   ├── settings/page.tsx
│   │   └── import/page.tsx
│   │
│   ├── api/
│   │   ├── products/route.ts
│   │   ├── competitors/route.ts
│   │   ├── scrape/route.ts
│   │   ├── recommendations/route.ts
│   │   ├── alerts/route.ts
│   │   ├── webhooks/stripe/route.ts
│   │   └── ws/route.ts
│   │
│   ├── layout.tsx
│   └── globals.css
│
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── dashboard/
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   ├── kpi-card.tsx
│   │   ├── price-chart.tsx
│   │   ├── price-table.tsx
│   │   ├── heatmap.tsx
│   │   ├── recommendation-card.tsx
│   │   └── alert-badge.tsx
│   └── marketing/
│       ├── hero.tsx
│       ├── features.tsx
│       ├── pricing-plans.tsx
│       └── footer.tsx
│
├── tests/
│   ├── scraper.test.ts
│   ├── pricing.test.ts
│   ├── ai.test.ts
│   └── e2e/
│       ├── login.spec.ts
│       ├── dashboard.spec.ts
│       └── scraping.spec.ts
│
└── docs/
    └── getting-started.md
```

---

## ENV VARIABLES

```bash
# Database
DATABASE_URL=postgresql://...

# Redis
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Auth
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...

# AI
OPENAI_API_KEY=sk-...
# or/and ANTHROPIC_API_KEY=sk-ant-...

# Scraping
FIRECRAWL_API_KEY=fc_...
PROXY_API_KEY=...  # BrightData/ScraperAPI

# Integrations
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Alerts
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...

# App
NEXT_PUBLIC_APP_URL=https://...
NODE_ENV=development
```

---

## WEEK-BY-WEEK MILESTONE CHECKLIST

### Week 1: ✅ Foundation
- [ ] Next.js 15 project created
- [ ] DB connected + schema defined
- [ ] Auth working (login/signup)
- [ ] Basic dashboard layout
- [ ] Drizzle ORM configured

### Week 2: ✅ Product Management
- [ ] Product CSV import
- [ ] Product CRUD
- [ ] Competitor URL management
- [ ] All API endpoints for products

### Week 3: 🔧 Scraper Core
- [ ] Puppeteer scraper working
- [ ] Queue system operational
- [ ] Price extraction via LLM
- [ ] Basic proxy setup

### Week 4: 🔧 Scraper Advanced
- [ ] Anti-bot bypass (Cloudflare, etc.)
- [ ] Fallback to Firecrawl
- [ ] Retry logic
- [ ] Product matching AI
- [ ] Scrape status dashboard

### Week 5: 📊 Dashboard
- [ ] Live Price Map
- [ ] Price comparison charts
- [ ] Historical data visualization
- [ ] WebSocket real-time updates
- [ ] Responsive design

### Week 6: 📊 Dashboard Polish
- [ ] Heatmap view
- [ ] Competitor list with status
- [ ] Product detail pages
- [ ] Alert system (email)
- [ ] Performance optimization

### Week 7: 🤖 AI Agent
- [ ] LLM integration
- [ ] Price recommendation engine
- [ ] Confidence scoring
- [ ] Approval UI
- [ ] Safety rails

### Week 8: 🤖 AI + Integrations
- [ ] Scenario Simulator
- [ ] Stripe auto-execute
- [ ] Shopify integration
- [ ] Alert channels (Slack/Telegram)
- [ ] Multi-currency

### Week 9: 🚀 Polish
- [ ] Landing page
- [ ] Billing (Stripe subscriptions)
- [ ] Error handling + loading states
- [ ] Documentation
- [ ] Testing

### Week 10: 🚀 Launch
- [ ] Deploy to production
- [ ] Monitoring setup
- [ ] Beta testing with real users
- [ ] Bug fixes
- [ ] Launch!

---

## TESTING STRATEGY

| Type | Tool | What |
|------|------|------|
| Unit | Vitest | Utils, pricing calculations, validators |
| Integration | Vitest + DB | API routes, scraper extraction |
| E2E | Playwright | Full user flows (login → import → scrape → recommend) |
| Load | k6 | Queue processing under load |
| AI eval | Manual + automated | Check recommendation quality |

---

## RISKS & MITIGATION

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Anti-scraping blocks us | HIGH | HIGH | Multi-strategy (Puppeteer → Firecrawl → Static), residential proxies |
| AI gives bad recommendations | MEDIUM | HIGH | Confidence scoring, human approval by default, safety rails |
| Scraping costs explode | MEDIUM | MEDIUM | Rate limiting, efficient scraping, cache aggressively |
| Data accuracy issues | HIGH | HIGH | Multi-source verification, confidence scores, manual override |
| Slow DB under load | MEDIUM | MEDIUM | Proper indexing, Redis cache, pagination |
| Legal issues | LOW | HIGH | Only public data, robots.txt compliance, terms review |

---

## KEY DECISIONS MADE

1. **Next.js 15 App Router** — Single codebase for frontend + API
2. **Drizzle ORM** — Type-safe, lighter than Prisma, better for edge
3. **Neon/Supabase PostgreSQL** — Serverless, scales automatically
4. **Upstash Redis** — Serverless, integrates with Vercel
5. **BullMQ + separate worker** — Scrapers need dedicated processes
6. **LLM for both extraction & recommendations** — No need for separate ML models initially
7. **Stripe for billing** — Well-known, good DX
8. **Human approval first, autonomy later** — Start safe, add autonomy in Phase 3

---

## OPEN QUESTIONS

1. **Clerk vs NextAuth vs Supabase Auth?** — Clerk is easier but costs more at scale
2. **Firecrawl cost at scale?** — Need to estimate per-scrape cost for 100+ competitors
3. **Which LLM for recommendations?** — Claude vs GPT-4o vs open-source (cost/quality tradeoff)
4. **Deploy worker on Railway/Koyeb or Vercel?** — Vercel has 10min limit, workers need longer
5. **Multi-tenant isolation?** — Row-level vs separate schemas

---

## NEXT STEP

**Phase 0, Task 0.1: Initialize the Next.js 15 project.**

When ready to execute, say "Start Phase 0" and I'll begin implementation.
