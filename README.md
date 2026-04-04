# Pricing Intelligence Engine (PIE)

> SaaS апликација што во реално време следи цени, попусти и понуди на конкуренти (преку web scraping + AI) и автоматски предлага/менува оптимални цени за максимален профит + пазарен удел.

---

## 1. CORE VALUE PROPOSITION

PIE е autonomous AI pricing agent кој прави три работи што ниедна постоечка алатка не ги прави заедно:

1. **Следи се** – 100–10.000+ конкуренти: веб сајтови, Shopify, Amazon, marketplaces, B2B landing pages, SaaS pricing pages
2. **Разбира сè** – AI анализа на цени + попусти + bundle понуди + сезонски акции + stock availability + промоции
3. **Делува сам** – Прогнозира + оптимизира + предлага + (со одобрување) автоматски менува цени

Клучна разлика од конкурентите: PIE не дава само dashboard со бројки. Дава **акции** – конкретни, квантифицирани препораки што може да се извршат со еден клик или целосно автономно.

---

## 2. КЛУЧНИ КАРАКТЕРИСТИКИ

### MVP (Phase 1 – 0-3 месеци)

| # | Функција | Опис | Статус |
|---|---------|------|--------|
| 1 | **Competitor Radar** | Додаваш URL или име → AI автоматски наоѓа сите производи/пакети на тој конкурент | MVP |
| 2 | **Live Price Map** | Интерактивна табела/heatmap со твои цени vs конкуренти (реално време) | MVP |
| 3 | **AI Pricing Agent** | Автономен агент што предлага и (со одобрување) автоматски менува цени преку Stripe/Shopify API | MVP |
| 4 | **Scenario Simulator** | „Што ако?" симулации (конкуренцијата спушти 15%, инфлација +4% итн.) | MVP |
| 5 | **Alert System** | Slack/Email/Telegram: „Competitor X пушти 20% off – ризик за 12% од твојот revenue" | MVP |
| 6 | **Historical Intelligence** | Графикони + AI insights: „Твоите цени се 9% пониски од просекот последните 90 дена" | MVP |
| 8 | **Multi-currency & Geo** | Следи цени во 30+ земји и автоматски предлага локални цени | MVP |

### Phase 2 (3-6 месеци)

| # | Функција | Опис |
|---|---------|------|
| 7 | **Dynamic Rules Engine** | Поставуваш правила (min margin, max market share, elasticity threshold) + AI ги оптимизира во рамки на тие граници |
| 9 | **Bundle Optimizer** | AI предлага bundle комбинации (Produkt A + B = X цена) за максимален просечен order value |
| 10 | **Promo Intelligence** | Автоматско детектирање на промоции, coupon кодови, flash sales кај конкуренти |
| 11 | **Elasticity Engine** | Custom price elasticity модели обучени на твоите историски продажни податоци |
| 12 | **White-label API** | REST API за интеграција со external системи |

### Phase 3 (6-12 месеци)

| # | Функција | Опис |
|---|---------|------|
| 13 | **Full Autonomy Mode** | Целосно автономно price changing без human approval (со safety rails) |
| 14 | **Predictive Demand** | ML модели за demand forecasting базирани на цена, сезона, конкуренција |
| 15 | **Multi-channel Sync** | Автоматска синхронизација на цени преку Shopify + Amazon + сопствен сајт |
| 16 | **Competitor Strategy AI** | AI што ги предвидува следните потези на конкурентите |

---

## 3. ТЕХНИЧКА АРХИТЕКТУРА

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND (Next.js 15)              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │Dashboard │ │Price Map │ │Simulator │ │ Alerts │ │
│  │          │ │          │ │          │ │        │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
│         Tailwind CSS + Recharts + shadcn/ui         │
└──────────────────────┬──────────────────────────────┘
                       │ REST/GraphQL API
┌──────────────────────▼──────────────────────────────┐
│                  API LAYER (Next.js Server)          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │Auth      │ │Products  │ │Pricing   │ │Alerts  │ │
│  │(Clerk)   │ │API       │ │Engine    │ │API     │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
└──┬────────────┬─────────────┬────────────┬──────────┘
   │            │             │            │
   ▼            ▼             ▼            ▼
┌──────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│Post- │  │Redis      │  │AI/ML     │  │Queue     │
│greSQL│  │(realtime) │  │Layer     │  │(BullMQ)  │
│(data)│  │cache      │  │(Claude/  │  │(jobs)    │
└──────┘  └──────────┘  │ OpenAI)   │  └──────────┘
                        └─────┬────┘
                              │
                        ┌─────▼────┐
                        │Scraping  │
                        │Engine    │
                        │(Firecrawl│
                        │/Puppeteer│
                        │+ Proxies)│
                        └──────────┘
```

### Tech Stack детали:

**Frontend:**
- Next.js 15 (App Router, Server Components)
- TypeScript
- Tailwind CSS + shadcn/ui компоненти
- Recharts за графикони
- PWA support (installable, offline cache)
- WebGPU за брзи пресметки во browser (Phase 2)

**Backend / API:**
- Next.js Server Actions + API Routes
- или Express.js (ако е потребно повеќе контрола)

**Database:**
- PostgreSQL (Supabase или self-hosted)
- Redis за real-time cache + pub/sub alerts
- pgvector за AI embedding storage

**AI Layer:**
- Claude 3.5 Sonnet / GPT-4o за general reasoning
- Custom fine-tuned model за price elasticity (Phase 2)
- LangGraph за agent orchestration
- OpenAI embeddings за product matching

**Scraping Engine:**
- Firecrawl / Browse AI за managed scraping
- Puppeteer/Playwright за custom scraping
- Rotating residential proxies (BrightData/ScraperAPI)
- Anti-bot заобиколување: fingerprint rotation, CAPTCHA solving
- Fallback: API integrations каде што е можно

**Infrastructure:**
- Vercel за frontend + API
- Koyeb / Railway за scraping workers
- Supabase за database + auth (или Clerk + Neon)
- Upstash за Redis
- Cron jobs за scheduled scraping

**Integrations (out-of-the-box):**
- Shopify (price updates, product import)
- Stripe (SaaS price monitoring)
- WooCommerce
- BigCommerce
- Google Analytics (sales data)
- Slack / Telegram / Email (alerts)

---

## 4. МОНЕТИЗАЦИЈА

| План | Цена | Конкуренти | Refresh | AI Agent | Simulator | Alerts |
|------|------|-----------|---------|----------|-----------|--------|
| **Starter** | 49€/мес | до 50 | 3x дневно | Базни препораки | Не | Email |
| **Pro** | 149€/мес | неограничени | 10-60 сек | Полн AI Agent | Да | Slack/Email/Telegram |
| **Enterprise** | 799€+ | неограничени | real-time | Full autonomy | Da + custom | SSO, custom, white-label |

**Add-on:** „Auto-Execute" модул – +10% од заштедениот профит (performance-based)

**Очекуван LTV:** 3.200–12.000€ по клиент

---

## 5. DIFFERENTIATION (vs. конкуренти)

| Feature | Prisync/Price2Spy | Competera/Pricefx | **PIE** |
|---------|-------------------|-------------------|---------|
| Real-time (секунди) | Не (daily-8x/day) | Да (enterprise) | **Да (Pro+)** |
| Autonomous AI | Не | Limited | **Да (full agent)** |
| What-if Simulator | Не | Limited | **Да (MVP)** |
| SaaS/Services pricing | Не | Limited | **Да** |
| Self-service SMB | Да | Не | **Да** |
| Multi-vertical | Само retail | Само retail/B2B | **Retail + SaaS + Services** |
| Price (SMB) | $50-500/mo | Enterprise only | **49-149€/mo** |

---

## 6. МОЖНИ РИЗИЦИ & РЕШЕНИЈА

| Ризик | Веројатност | Impact | Решеније |
|-------|------------|--------|---------|
| Anti-scraping (Cloudflare, DataDome) | Висока | Висок | AI-powered scraping + rotating residential proxies + human-in-loop fallback + API integrations каде што е можно |
| Legal (Terms of Service) | Средна | Висок | Само јавни податоци + robots.txt compliance + disclaimer + опција за „ethical scraping" |
| AI hallucination во price препораки | Средна | Среден | Confidence scoring + human approval по default + safety rails (min/max цена, margin floor) |
| Scalability на scraping | Средна | Висок | Distributed scraping workers + queue-based architecture + rate limiting |
| Data accuracy | Висока | Висок | Multi-source verification + confidence scores + manual override |
| Customer adoption | Средна | Среден | Freemium модел + 14-day trial + clear ROI calculator |

---

## 7. ROADMAP

### Week 1-2: Foundation
- [ ] Иницијализација на Next.js 15 проект
- [ ] PostgreSQL + Supabase setup
- [ ] Auth (Clerk или Supabase Auth)
- [ ] Основен dashboard layout
- [ ] Product import (manual CSV + API)

### Week 3-4: Scraping Engine
- [ ] Scraper worker (Firecrawl/Puppeteer)
- [ ] Proxy integration
- [ ] Product matching AI
- [ ] Price data pipeline
- [ ] Redis cache layer

### Week 5-6: Dashboard & Alerts
- [ ] Live Price Map табела
- [ ] Price comparison графикони
- [ ] Alert system (email + Slack)
- [ ] Historical data visualization

### Week 7-8: AI Pricing Agent
- [ ] LLM integration (Claude/GPT-4o)
- [ ] Price recommendation engine
- [ ] Scenario Simulator UI
- [ ] Approval workflow

### Week 9-10: Integrations
- [ ] Shopify integration
- [ ] Stripe price monitoring
- [ ] Multi-currency support
- [ ] WebSocket real-time updates

### Week 11-12: Polish & Launch
- [ ] Performance optimization
- [ ] Testing + bug fixes
- [ ] Documentation
- [ ] Landing page
- [ ] Beta launch

---

## 8. DATABASE SCHEMA (initial)

```sql
-- Корисници и организации
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plan TEXT DEFAULT 'starter',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Продукти на корисникот
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  sku TEXT,
  current_price DECIMAL(10,2),
  cost_price DECIMAL(10,2),
  currency TEXT DEFAULT 'EUR',
  category TEXT,
  source TEXT, -- 'manual', 'shopify', 'stripe'
  external_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Конкуренти
CREATE TABLE competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  url TEXT,
  industry TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Competitive pricing records
CREATE TABLE price_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  competitor_id UUID REFERENCES competitors(id),
  competitor_url TEXT,
  price DECIMAL(10,2),
  original_price DECIMAL(10,2), -- пред попуст
  discount_pct DECIMAL(5,2),
  in_stock BOOLEAN,
  currency TEXT,
  scraped_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI price препораки
CREATE TABLE price_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  current_price DECIMAL(10,2),
  suggested_price DECIMAL(10,2),
  reason TEXT,
  expected_profit_change DECIMAL(5,2),
  expected_volume_change DECIMAL(5,2),
  confidence_score DECIMAL(3,2),
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, executed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alerts
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  type TEXT, -- 'price_drop', 'price_increase', 'out_of_stock', 'promo_detected'
  message TEXT,
  severity TEXT, -- low, medium, high, critical
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 9. ЗАПОЧНУВАЊЕ

```bash
# Clone
git clone <repo>
cd pie

# Install
npm install

# Setup env
cp .env.example .env.local
# Populate with your keys

# Dev
npm run dev
```

---

## 10. ЗАШТО PIE ЌЕ УСПЕЕ

1. **Пазарот е подготвен** – Price intelligence пазарот расте 15-20% годишно
2. **Ниедна алатка не е автономна** – Сите бараат човек да донесува одлуки
3. **SMB е underserved** – Enterprise алатките се скапи и комплексни
4. **AI е доволно зрел** – 2026 LLMs можат да прават real pricing reasoning
5. **Vertical expansion** – Може да се прошири од e-commerce кон SaaS, services, hospitality
6. **Network effect** – Повеќе клиенти = подобри price податоци = подобри AI модели
