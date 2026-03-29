import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import alertsRouter from "./alerts.js";
import stocksRouter from "./stocks.js";
import portfolioRouter from "./portfolio.js";
import openaiRouter from "./openai/index.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(alertsRouter);
router.use(stocksRouter);
router.use(portfolioRouter);
router.use(openaiRouter);

export default router;
