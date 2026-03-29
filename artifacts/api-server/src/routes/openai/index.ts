import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, conversations, messages } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import {
  CreateOpenaiConversationBody,
  GetOpenaiConversationParams,
  DeleteOpenaiConversationParams,
  ListOpenaiMessagesParams,
  SendOpenaiMessageBody,
  SendOpenaiMessageParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

const SMARTSTREET_SYSTEM_PROMPT = `You are SmartStreet AI, an intelligent market analyst assistant for Indian retail investors. You help users understand NSE/BSE stocks, technical patterns, and market opportunities.

IMPORTANT GUIDELINES:
- Provide factual, educational responses about Indian stock markets
- Cover NSE/BSE stocks, Nifty 50, Sensex, sectors
- Explain technical patterns (RSI, MACD, breakouts, triangles, cup & handle, etc.)
- Discuss fundamental analysis concepts
- Reference Indian market context (SEBI, FII/DII flows, Indian economic factors)
- Use Indian currency (₹, crore, lakh)
- Be educational and empowering for retail investors

MANDATORY DISCLAIMERS:
- Always include "Not financial advice - for educational purposes only"
- Never guarantee returns
- Always mention risk factors
- Encourage proper due diligence

FORMAT: Use markdown with headers, bullet points. Be concise but thorough.`;

router.get("/openai/conversations", async (req, res) => {
  try {
    const convList = await db.select().from(conversations).orderBy(conversations.createdAt);
    res.json(convList.reverse());
  } catch (error) {
    req.log.error({ error }, "Error listing conversations");
    res.status(500).json({ error: "Failed to list conversations" });
  }
});

router.post("/openai/conversations", async (req, res) => {
  try {
    const body = CreateOpenaiConversationBody.parse(req.body);
    const inserted = await db.insert(conversations).values({ title: body.title }).returning();
    res.status(201).json(inserted[0]);
  } catch (error) {
    req.log.error({ error }, "Error creating conversation");
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

router.get("/openai/conversations/:id", async (req, res) => {
  try {
    const { id } = GetOpenaiConversationParams.parse(req.params);
    const convList = await db.select().from(conversations).where(eq(conversations.id, id));

    if (convList.length === 0) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    const msgList = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(messages.createdAt);

    res.json({ ...convList[0], messages: msgList });
  } catch (error) {
    req.log.error({ error }, "Error fetching conversation");
    res.status(500).json({ error: "Failed to fetch conversation" });
  }
});

router.delete("/openai/conversations/:id", async (req, res) => {
  try {
    const { id } = DeleteOpenaiConversationParams.parse(req.params);
    const deleted = await db.delete(conversations).where(eq(conversations.id, id)).returning();

    if (deleted.length === 0) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    res.status(204).send();
  } catch (error) {
    req.log.error({ error }, "Error deleting conversation");
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

router.get("/openai/conversations/:id/messages", async (req, res) => {
  try {
    const { id } = ListOpenaiMessagesParams.parse(req.params);
    const msgList = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(messages.createdAt);

    res.json(msgList);
  } catch (error) {
    req.log.error({ error }, "Error listing messages");
    res.status(500).json({ error: "Failed to list messages" });
  }
});

router.post("/openai/conversations/:id/messages", async (req, res) => {
  try {
    const { id } = SendOpenaiMessageParams.parse(req.params);
    const { content } = SendOpenaiMessageBody.parse(req.body);

    const convList = await db.select().from(conversations).where(eq(conversations.id, id));
    if (convList.length === 0) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    await db.insert(messages).values({ conversationId: id, role: "user", content });

    const history = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(messages.createdAt);

    const chatMessages = history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let fullResponse = "";

    const stream = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [{ role: "system", content: SMARTSTREET_SYSTEM_PROMPT }, ...chatMessages],
      stream: true,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) {
        fullResponse += text;
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
    }

    await db.insert(messages).values({ conversationId: id, role: "assistant", content: fullResponse });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error) {
    req.log.error({ error }, "Error sending message");
    res.write(`data: ${JSON.stringify({ error: "Failed to generate response" })}\n\n`);
    res.end();
  }
});

export default router;
