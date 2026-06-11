import { Router, type IRouter } from "express";
import healthRouter from "./health";
import chatRouter from "./chat";
import campaignsRouter from "./campaigns";
import contactsRouter from "./contacts";
import analyticsRouter from "./analytics";
import businessRouter from "./business";
import reviewsRouter from "./reviews";
import integrationsRouter from "./integrations";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/chat", chatRouter);
router.use("/campaigns", campaignsRouter);
router.use("/contacts", contactsRouter);
router.use("/analytics", analyticsRouter);
router.use("/business", businessRouter);
router.use("/reviews", reviewsRouter);
router.use("/integrations", integrationsRouter);

export default router;
