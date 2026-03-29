import { pgTable, serial, text, real, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const patterns = pgTable("patterns", {
  id: serial("id").primaryKey(),
  stockSymbol: text("stock_symbol").notNull(),
  patternType: text("pattern_type").notNull(),
  patternSubtype: text("pattern_subtype"),
  confidence: real("confidence").notNull(),
  historicalSuccessRate: real("historical_success_rate").notNull(),
  occurrences: integer("occurrences").notNull().default(0),
  entryPrice: real("entry_price").notNull(),
  targetPrice: real("target_price").notNull(),
  stopLoss: real("stop_loss").notNull(),
  timeframe: text("timeframe").notNull().default("Daily"),
  status: text("status").notNull().default("Active"),
  detectedAt: timestamp("detected_at").defaultNow().notNull(),
});

export const insertPatternSchema = createInsertSchema(patterns).omit({ id: true, detectedAt: true });
export type InsertPattern = z.infer<typeof insertPatternSchema>;
export type Pattern = typeof patterns.$inferSelect;
