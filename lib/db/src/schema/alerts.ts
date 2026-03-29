import { pgTable, serial, text, real, integer, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  stockSymbol: text("stock_symbol").notNull(),
  stockName: text("stock_name").notNull(),
  alertType: text("alert_type").notNull(),
  priority: text("priority").notNull(),
  compositeScore: real("composite_score").notNull(),
  headline: text("headline").notNull(),
  explanation: text("explanation").notNull(),
  evidencePoints: json("evidence_points").$type<string[]>().notNull().default([]),
  entryPrice: real("entry_price"),
  targetPrice: real("target_price"),
  stopLoss: real("stop_loss"),
  volumeSpike: real("volume_spike"),
  patternSuccessRate: real("pattern_success_rate"),
  sentimentScore: real("sentiment_score"),
  sector: text("sector").notNull(),
  priceChange: real("price_change").notNull().default(0),
  priceChangePercent: real("price_change_percent").notNull().default(0),
  userFeedback: text("user_feedback"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAlertSchema = createInsertSchema(alerts).omit({ id: true, createdAt: true });
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alerts.$inferSelect;
