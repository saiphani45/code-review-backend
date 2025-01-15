"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analysis_controller_1 = require("../controllers/analysis-controller");
const middleware_1 = require("../middleware/middleware");
const router = (0, express_1.Router)();
const analysisController = new analysis_controller_1.AnalysisController();
router.post("/analyze", middleware_1.authMiddleware, analysisController.analyzeCode);
exports.default = router;
