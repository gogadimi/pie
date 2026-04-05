# Pricing Intelligence Engine (PIE)

> **SaaS Platform** that monitors competitor prices in real-time, analyzes the market with AI, and automatically adjusts your prices to maximize profit and market share.

[![Build Status](https://github.com/gogadimi/pie/actions/workflows/ci.yml/badge.svg)](https://github.com/gogadimi/pie/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🚀 Features

- **Real-Time Price Monitoring** — Track 10,000+ competitor prices across any website
- **AI Pricing Agent** — Autonomous AI that recommends optimal prices
- **Auto-Repricing** — One-click approve or fully autonomous price changes
- **Scenario Simulator** — Test what-if scenarios before making changes
- **Multi-Channel** — Shopify, WooCommerce, Stripe, SaaS, custom APIs
- **Smart Alerts** — Slack, Email, Telegram notifications for price changes
- **Safety Rails** — Min margins, price floors, change limits

## 🏗️ Architecture

```
┌─────────────────────────────────┐
│         Next.js 16 App          │
│  ┌─────────┬─────────┬───────┐  │
│  │Dashboard│  API    │Worker │  │
│  └────┬────┴────┬────┴───┬───┘  │
└───────┼─────────┼────────┼──────┘
        │         │        │
   ┌────▼───┐ ┌───▼────┐ ┌─▼────┐
   │Postgres│ │ Redis  │ │External│
   │(Neon)  │ │(Upstash│ │  APIs  │
   └────────┘ └────────┘ └───────┘
```

**Stack:** Next.js 16 · TypeScript · Tailwind CSS · Drizzle ORM · PostgreSQL · Redis · BullMQ · Puppeteer · Claude AI

## 📦 Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- Redis 7+

### Quick Start

```bash
# Clone & Install
git clone https://github.com/gogadimi/pie.git
cd pie
npm install

# Add environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Seed demo data
npx tsx scripts/seed.ts

# Start development server
npm run dev
# → http://localhost:3000
```

### With Docker

```bash
# Start full stack locally
docker-compose up -d
# → App: http://localhost:3000
# → DB: postgres://postgres:postgres@localhost:5432/pie
# → Redis: redis://localhost:6379
```

### Database

```bash
# Generate migrations
npm run db:generate

# Run migrations
npm run db:migrate

# Open Drizzle Studio
npm run db:studio

# Seed demo data
npx tsx scripts/seed.ts
```

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List all products |
| POST | `/api/products` | Create product |
| GET | `/api/products/:id` | Product detail with competitors |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |
| POST | `/api/products/import` | Bulk import products |
| DELETE | `/api/products/bulk` | Bulk delete products |
| GET | `/api/competitors` | List competitors |
| POST | `/api/competitors` | Create competitor |
| DELETE | `/api/competitors/:id` | Delete competitor |
| POST | `/api/scrape` | Trigger price scrape |
| GET | `/api/recommendations` | List AI recommendations |
| POST | `/api/recommendations` | Generate recommendation |
| GET | `/api/alerts` | List alerts |
| GET | `/api/dashboard/stats` | Dashboard KPIs |
| GET | `/api/health` | Health check |
| POST | `/api/webhooks/stripe` | Stripe webhook |
| GET | `/api/notifications/channels` | List notification channels |

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL | ✅ |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token | ✅ |
| `OPENAI_API_KEY` | OpenAI API key | ❌ |
| `ANTHROPIC_API_KEY` | Anthropic Claude key | ❌ |
| `FIRECRAWL_API_KEY` | Firecrawl scraping API | ❌ |
| `CLERK_SECRET_KEY` | Clerk auth secret | ❌ |
| `STRIPE_SECRET_KEY` | Stripe secret key | ❌ |

## 🚀 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import repo on vercel.com/new
3. Add environment variables
4. Deploy!

### Docker
```bash
docker-compose up -d
```

## 🧪 Running Tests

```bash
# Unit tests
npm test

# Integration tests (requires running dev server)
npm run test:e2e
```

## 📈 Monitoring & Health

```bash
curl http://localhost:3000/api/health
# Returns: { status: "healthy", services: { database: { status: "ok" }, redis: { status: "ok" } } }
```

## 📋 Roadmap

- [x] Phase 0-5: Core MVP
- [x] Phase 6-7: Real DB + Full API
- [x] Phase 8-10: Real Dashboard + Production Infra
- [x] Phase 11: Auth, Rate Limiting, Seeds, Cron
- [x] Phase 12: Stripe Checkout + Subscription Management
- [x] Phase 13: Multi-Tenant + Organization Management
- [x] Phase 14: Complete Data Integration
- [x] Phase 15: Advanced AI (Elasticity, Demand Forecasting)
- [x] Phase 16: Real-time Notifications (WebSockets)
- [x] Phase 17: Scheduled Scraping (Cron + Queue)
- [x] Phase 18: E2E Testing Suite
- [x] Phase 19: Complete Documentation
- [x] Phase 20: Production Monitoring + Alerting
- [ ] Phase 21: Mobile Optimization (PWA)
- [ ] Phase 22: Advanced Machine Learning Models

## 📄 License

MIT © [Goga gogadimi](https://github.com/gogadimi)
