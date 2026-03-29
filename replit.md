# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **AI**: OpenAI via Replit AI Integrations (gpt-5.2 for chat)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── smartstreet/        # SmartStreet AI React+Vite frontend
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── db/                 # Drizzle ORM schema + DB connection
│   ├── integrations-openai-ai-server/  # OpenAI server-side helpers
│   └── integrations-openai-ai-react/   # OpenAI React client hooks
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Application: SmartStreet AI

Indian Retail Investor Intelligence Platform for NSE/BSE market analysis.

### Features

- **Dashboard**: Nifty 50/Sensex market summary, top 3 personalized alerts, portfolio health score, Opportunity Radar feed with filters (All/Breakout/Earnings/Insider/Patterns), sector performance
- **Stocks & Patterns**: Stock list with search and sector filters, stock detail with price history charts (Recharts), technical indicators (RSI/MACD/Bollinger), detected patterns with confidence scores and historical success rates
- **My Portfolio**: Total value, day P&L, health score, holdings table (qty/avg price/LTP/P&L), add/remove holdings
- **Market Analyst AI**: Conversational AI powered by GPT-5.2, SEBI-compliant analyst persona, streaming responses, conversation history persisted to DB

### Routes

- `/` — Dashboard
- `/stocks` — Stock list
- `/stocks/:symbol` — Stock detail + patterns
- `/portfolio` — Portfolio management
- `/chat` — AI market analyst chat

## Database Schema (lib/db/src/schema/)

- `conversations` — AI chat conversations
- `messages` — Chat messages
- `stocks` — Stock master data with OHLCV + technical indicators
- `alerts` — Market alerts with composite scores, evidence, patterns
- `patterns` — Technical pattern detections per stock
- `holdings` — User portfolio holdings

## API Endpoints (lib/api-spec/openapi.yaml)

- `GET /api/healthz` — health check
- `GET /api/market-summary` — Nifty/Sensex + sector data
- `GET /api/alerts` — list alerts (filter by category/priority)
- `POST /api/alerts/:id/feedback` — submit alert feedback
- `GET /api/stocks` — list stocks (search + sector filter)
- `GET /api/stocks/:symbol` — stock detail + patterns + price history
- `GET /api/portfolio` — portfolio with enriched holdings
- `POST /api/portfolio/holdings` — add holding
- `DELETE /api/portfolio/holdings/:id` — remove holding
- `GET/POST /api/openai/conversations` — manage conversations
- `GET/DELETE /api/openai/conversations/:id` — conversation detail/delete
- `POST /api/openai/conversations/:id/messages` — streaming SSE chat

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`, seeds DB on startup
- Routes: `src/routes/index.ts` mounts sub-routers
- Seeding: `src/routes/seed.ts` — seeds mock Indian stock market data on first startup
- Mock data: `src/data/mockData.ts` — NSE stocks, alerts, patterns

### `artifacts/smartstreet` (`@workspace/smartstreet`)

React + Vite SPA served at `/`. Built with Tailwind CSS, Recharts for charts, React Hook Form, framer-motion for animations.

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL.

- `pnpm --filter @workspace/db run push` — push schema changes to DB

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec and Orval config.

- `pnpm --filter @workspace/api-spec run codegen` — regenerate API types/hooks

### `lib/integrations-openai-ai-server` (`@workspace/integrations-openai-ai-server`)

Server-side OpenAI SDK helpers. Uses `AI_INTEGRATIONS_OPENAI_BASE_URL` and `AI_INTEGRATIONS_OPENAI_API_KEY` env vars (set by Replit AI Integrations).
