import { Router } from "express";
import { AnalysisController } from "../controllers/analysis-controller";
import { authMiddleware } from "../middleware/middleware";

const router = Router();
const analysisController = new AnalysisController();

router.post("/analyze", authMiddleware, analysisController.analyzeCode);

export default router;
