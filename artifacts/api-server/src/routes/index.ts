import { Router, type IRouter } from "express";
import healthRouter from "./health";
import chatRouter from "./chat";
import campaignsRouter from "./campaigns";
import contactsRouter from "./contacts";
import analyticsRouter from "./analytics";
import businessRouter from "./business";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/chat", chatRouter);
router.use("/campaigns", campaignsRouter);
router.use("/contacts", contactsRouter);
router.use("/analytics", analyticsRouter);
router.use("/business", businessRouter);

export default router;
