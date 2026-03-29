import { db, stocks, alerts, patterns, holdings } from "@workspace/db";
import { MOCK_STOCKS, MOCK_ALERTS, MOCK_PATTERNS } from "../data/mockData.js";
import { logger } from "../lib/logger.js";

export async function seedDatabase() {
  try {
    const existingStocks = await db.select().from(stocks).limit(1);
    if (existingStocks.length > 0) {
      logger.info("Database already seeded, skipping");
      return;
    }

    logger.info("Seeding database with mock market data...");

    for (const stock of MOCK_STOCKS) {
      await db.insert(stocks).values(stock).onConflictDoNothing();
    }

    for (const alert of MOCK_ALERTS) {
      await db.insert(alerts).values(alert);
    }

    for (const pattern of MOCK_PATTERNS) {
      await db.insert(patterns).values(pattern);
    }

    await db.insert(holdings).values([
      { symbol: "HDFCBANK", name: "HDFC Bank Ltd", sector: "Banking", quantity: 50, avgPrice: 1580.0 },
      { symbol: "TCS", name: "Tata Consultancy Services Ltd", sector: "IT", quantity: 30, avgPrice: 3750.0 },
      { symbol: "RELIANCE", name: "Reliance Industries Ltd", sector: "Energy", quantity: 40, avgPrice: 2650.0 },
    ]);

    logger.info("Database seeded successfully");
  } catch (error) {
    logger.error({ error }, "Error seeding database");
  }
}
