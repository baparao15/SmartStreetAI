# SmartStreet AI 🇮🇳
**Retail Investor Intelligence Platform for Indian Markets (NSE/BSE)**
An AI-powered market analysis platform that monitors NSE/BSE stocks, detects technical patterns, generates personalized opportunity alerts, and provides a conversational market analyst — all in one dashboard.
---
## Features
### Dashboard
- Live Nifty 50 & Sensex summary with advance/decline ratio
- Top 3 personalized opportunity alerts (color-coded by priority: Strong / Moderate / Watch)
- Portfolio health score
- Opportunity Radar feed with filters: All | Breakout | Earnings | Insider | Patterns
- Sector heatmap (top gaining and losing sectors)
### Stocks & Patterns
- Full NSE stock list with search and sector filtering
- Stock detail page with 90-day price history chart (Recharts)
- Technical indicators: RSI, MACD, Bollinger Bands, Volume vs Average
- Detected patterns (Breakout, Cup & Handle, Ascending Triangle, Double Bottom) with confidence scores and historical success rates
- Backtesting display: occurrences, win rate, average gain
### My Portfolio
- Total portfolio value with day P&L
- Holdings table: symbol, quantity, avg price, LTP, current value, P&L %
- Add / remove holdings
- Portfolio health score and risk profile
### Market Analyst AI
- Conversational AI powered by GPT-5.2
- Persona: SEBI-compliant Indian market analyst
- Streaming responses (text appears word-by-word)
- Full conversation history persisted to PostgreSQL
- Suggested prompts: RSI divergence, HDFC Bank analysis, portfolio risk
- SEBI disclaimer shown on every session
---
## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Recharts, Framer Motion |
| Backend | Express 5, Node.js 24, TypeScript |
| Database | PostgreSQL + Drizzle ORM |
| AI | OpenAI GPT-5.2 (via Replit AI Integrations) |
| API Contract | OpenAPI 3.1 + Orval codegen |
| Monorepo | pnpm workspaces |
---
## Project Structure
├── artifacts/
│ ├── api-server/ # Express 5 REST API
│ │ └── src/
│ │ ├── routes/ # alerts, stocks, portfolio, openai
│ │ └── data/ # mock NSE market data
│ └── smartstreet/ # React + Vite SPA
│ └── src/
│ ├── pages/ # Dashboard, StockDetail, Portfolio, Chat
│ ├── components/ # Layout, AlertCard
│ └── hooks/ # use-chat-stream (SSE streaming)
├── lib/
│ ├── api-spec/ # OpenAPI 3.1 spec + Orval config
│ ├── api-client-react/ # Generated React Query hooks
│ ├── api-zod/ # Generated Zod validation schemas
│ ├── db/ # Drizzle ORM schema + DB connection
│ ├── integrations-openai-ai-server/ # OpenAI server helpers
│ └── integrations-openai-ai-react/ # OpenAI React hooks
└── scripts/ # Utility scripts

---
## Database Schema
| Table | Purpose |
|---|---|
| `stocks` | NSE stock master data, OHLCV, technical indicators |
| `alerts` | Market alerts with composite scores and evidence |
| `patterns` | Technical pattern detections per stock |
| `holdings` | User portfolio holdings |
| `conversations` | AI chat conversation sessions |
| `messages` | Chat message history |
---
## API Endpoints
GET /api/healthz
GET /api/market-summary
GET /api/alerts?category=&priority=
POST /api/alerts/:id/feedback
GET /api/stocks?q=&sector=
GET /api/stocks/:symbol
GET /api/portfolio
POST /api/portfolio/holdings
DELETE /api/portfolio/holdings/:id
GET /api/openai/conversations
POST /api/openai/conversations
GET /api/openai/conversations/:id
DELETE /api/openai/conversations/:id
POST /api/openai/conversations/:id/messages (SSE streaming)

---
## Getting Started
```bash
# Install dependencies
pnpm install
# Push database schema
pnpm --filter @workspace/db run push
# Start API server
pnpm --filter @workspace/api-server run dev
# Start frontend
pnpm --filter @workspace/smartstreet run dev
The API server automatically seeds the database with mock NSE stock data, alerts, and patterns on first startup.

To regenerate API types after changing the OpenAPI spec:

pnpm --filter @workspace/api-spec run codegen
Multi-Agent Architecture (Blueprint)
The platform is designed around a 6-agent pipeline:

Data Ingestion Agent — NSE Bhavcopy, corporate filings, news feeds
Pattern Recognition Agent — Breakouts, reversals, continuations across 500+ NSE stocks
Signal Synthesis Agent — Weighted composite scoring (earnings 25%, technicals 20%, volume 15%, insider 15%, sentiment 15%, sector 10%)
Explanation Agent — GPT-5.2 generates plain-English investor narratives
Portfolio Context Agent — Filters alerts by user holdings, watchlist, and risk profile
Feedback Loop Agent — Tracks alert → action → outcome for continuous improvement
Disclaimer
SmartStreet AI is for educational purposes only. It does not constitute financial advice. Always consult a SEBI-registered investment advisor before making investment decisions. Past pattern success rates do not guarantee future performance.
