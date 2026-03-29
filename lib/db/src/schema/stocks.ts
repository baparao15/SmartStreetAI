import { pgTable, serial, text, real, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const stocks = pgTable("stocks", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull().unique(),
  name: text("name").notNull(),
  sector: text("sector").notNull(),
  marketCap: text("market_cap").notNull(),
  currentPrice: real("current_price").notNull(),
  priceChange: real("price_change").notNull().default(0),
  priceChangePercent: real("price_change_percent").notNull().default(0),
  volume: real("volume").notNull().default(0),
  avgVolume: real("avg_volume").notNull().default(0),
  rsi: real("rsi"),
  macd: real("macd"),
  macdSignal: real("macd_signal"),
  bollingerUpper: real("bollinger_upper"),
  bollingerLower: real("bollinger_lower"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertStockSchema = createInsertSchema(stocks).omit({ id: true, updatedAt: true });
export type InsertStock = z.infer<typeof insertStockSchema>;
export type Stock = typeof stocks.$inferSelect;
