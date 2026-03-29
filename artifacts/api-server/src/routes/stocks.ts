import { Router, type IRouter } from "express";
import { eq, ilike, or } from "drizzle-orm";
import { db, stocks, alerts, patterns } from "@workspace/db";
import { ListStocksQueryParams, GetStockParams } from "@workspace/api-zod";
import { generatePriceHistory } from "../data/mockData.js";

const router: IRouter = Router();

router.get("/stocks", async (req, res) => {
  try {
    const query = ListStocksQueryParams.parse(req.query);
    let stockList = await db.select().from(stocks);

    if (query.q) {
      const q = query.q.toLowerCase();
      stockList = stockList.filter(
        (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
      );
    }

    if (query.sector) {
      stockList = stockList.filter((s) => s.sector === query.sector);
    }

    const alertSymbols = new Set(
      (await db.select({ symbol: alerts.stockSymbol }).from(alerts)).map((a) => a.symbol)
    );

    const result = stockList.map((s) => ({
      ...s,
      hasAlert: alertSymbols.has(s.symbol),
    }));

    res.json(result);
  } catch (error) {
    req.log.error({ error }, "Error fetching stocks");
    res.status(500).json({ error: "Failed to fetch stocks" });
  }
});

router.get("/stocks/:symbol", async (req, res) => {
  try {
    const { symbol } = GetStockParams.parse(req.params);
    const stockList = await db.select().from(stocks).where(eq(stocks.symbol, symbol.toUpperCase()));

    if (stockList.length === 0) {
      res.status(404).json({ error: "Stock not found" });
      return;
    }

    const stock = stockList[0];
    const stockPatterns = await db.select().from(patterns).where(eq(patterns.stockSymbol, symbol.toUpperCase()));
    const stockAlerts = await db.select().from(alerts).where(eq(alerts.stockSymbol, symbol.toUpperCase()));
    const priceHistory = generatePriceHistory(stock.currentPrice);

    res.json({
      ...stock,
      patterns: stockPatterns,
      alerts: stockAlerts,
      priceHistory,
    });
  } catch (error) {
    req.log.error({ error }, "Error fetching stock details");
    res.status(500).json({ error: "Failed to fetch stock details" });
  }
});

router.get("/market-summary", async (_req, res) => {
  try {
    const totalAlerts = await db.select().from(alerts);
    const strongAlerts = totalAlerts.filter((a) => a.priority === "STRONG");

    res.json({
      nifty50: 22847.15,
      nifty50Change: 312.4,
      nifty50ChangePercent: 1.38,
      sensex: 75241.32,
      sensexChange: 1023.8,
      sensexChangePercent: 1.38,
      advanceDecline: "1842/842",
      marketStatus: "Open",
      totalAlerts: totalAlerts.length,
      strongAlerts: strongAlerts.length,
      topSectors: [
        { name: "Automobile", change: 3.8, direction: "up" },
        { name: "Banking", change: 1.9, direction: "up" },
        { name: "Energy", change: 1.5, direction: "up" },
        { name: "FMCG", change: 0.4, direction: "up" },
        { name: "IT", change: -0.9, direction: "down" },
        { name: "Pharma", change: -1.3, direction: "down" },
      ],
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch market summary" });
  }
});

export default router;
