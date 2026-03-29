import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, holdings, stocks } from "@workspace/db";
import { AddHoldingBody, RemoveHoldingParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/portfolio", async (req, res) => {
  try {
    const userHoldings = await db.select().from(holdings);
    const stockPrices = await db.select().from(stocks);
    const priceMap = new Map(stockPrices.map((s) => [s.symbol, s]));

    let totalValue = 0;
    let totalCost = 0;

    const enrichedHoldings = userHoldings.map((h) => {
      const stockInfo = priceMap.get(h.symbol);
      const currentPrice = stockInfo?.currentPrice ?? h.avgPrice;
      const currentValue = h.quantity * currentPrice;
      const costBasis = h.quantity * h.avgPrice;
      const gainLoss = currentValue - costBasis;
      const gainLossPercent = (gainLoss / costBasis) * 100;

      totalValue += currentValue;
      totalCost += costBasis;

      return {
        id: h.id,
        symbol: h.symbol,
        name: h.name,
        sector: h.sector,
        quantity: h.quantity,
        avgPrice: h.avgPrice,
        currentPrice,
        currentValue,
        gainLoss,
        gainLossPercent,
      };
    });

    const dayChange = totalValue * 0.012;
    const dayChangePercent = 1.2;
    const gainLossTotal = totalValue - totalCost;
    const healthScore = Math.min(100, Math.max(0, Math.floor(50 + gainLossTotal / totalCost * 100)));

    res.json({
      totalValue,
      dayChange,
      dayChangePercent,
      healthScore,
      riskProfile: "Moderate",
      holdings: enrichedHoldings,
    });
  } catch (error) {
    req.log.error({ error }, "Error fetching portfolio");
    res.status(500).json({ error: "Failed to fetch portfolio" });
  }
});

router.post("/portfolio/holdings", async (req, res) => {
  try {
    const body = AddHoldingBody.parse(req.body);

    const stockList = await db.select().from(stocks).where(eq(stocks.symbol, body.symbol.toUpperCase()));
    const stockInfo = stockList[0];

    const inserted = await db.insert(holdings).values({
      symbol: body.symbol.toUpperCase(),
      name: stockInfo?.name ?? body.symbol.toUpperCase(),
      sector: stockInfo?.sector ?? "Unknown",
      quantity: body.quantity,
      avgPrice: body.avgPrice,
    }).returning();

    const holding = inserted[0];
    const currentPrice = stockInfo?.currentPrice ?? body.avgPrice;
    const currentValue = body.quantity * currentPrice;
    const costBasis = body.quantity * body.avgPrice;

    res.status(201).json({
      id: holding.id,
      symbol: holding.symbol,
      name: holding.name,
      sector: holding.sector,
      quantity: holding.quantity,
      avgPrice: holding.avgPrice,
      currentPrice,
      currentValue,
      gainLoss: currentValue - costBasis,
      gainLossPercent: ((currentValue - costBasis) / costBasis) * 100,
    });
  } catch (error) {
    req.log.error({ error }, "Error adding holding");
    res.status(500).json({ error: "Failed to add holding" });
  }
});

router.delete("/portfolio/holdings/:id", async (req, res) => {
  try {
    const { id } = RemoveHoldingParams.parse(req.params);
    await db.delete(holdings).where(eq(holdings.id, id));
    res.status(204).send();
  } catch (error) {
    req.log.error({ error }, "Error removing holding");
    res.status(500).json({ error: "Failed to remove holding" });
  }
});

export default router;
