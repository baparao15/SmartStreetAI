import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, alerts } from "@workspace/db";
import { ListAlertsQueryParams, SubmitAlertFeedbackBody, SubmitAlertFeedbackParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/alerts", async (req, res) => {
  try {
    const query = ListAlertsQueryParams.parse(req.query);
    let allAlerts = await db.select().from(alerts).orderBy(alerts.compositeScore);

    if (query.priority) {
      allAlerts = allAlerts.filter((a) => a.priority === query.priority);
    }
    if (query.category) {
      allAlerts = allAlerts.filter((a) => a.alertType === query.category);
    }

    res.json(allAlerts.reverse());
  } catch (error) {
    req.log.error({ error }, "Error fetching alerts");
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
});

router.post("/alerts/:id/feedback", async (req, res) => {
  try {
    const { id } = SubmitAlertFeedbackParams.parse(req.params);
    const { feedback } = SubmitAlertFeedbackBody.parse(req.body);

    const updated = await db
      .update(alerts)
      .set({ userFeedback: feedback })
      .where(eq(alerts.id, id))
      .returning();

    if (updated.length === 0) {
      res.status(404).json({ error: "Alert not found" });
      return;
    }

    res.json(updated[0]);
  } catch (error) {
    req.log.error({ error }, "Error submitting feedback");
    res.status(500).json({ error: "Failed to submit feedback" });
  }
});

export default router;
