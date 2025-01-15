"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisController = void 0;
const codeanalysis_service_1 = require("../services/codeanalysis-service");
class AnalysisController {
    constructor() {
        // Make it an arrow function to preserve 'this' context and properly type the method
        this.analyzeCode = async (req, res, next) => {
            try {
                const { code, language } = req.body;
                if (!code) {
                    res.status(400).json({ error: "Code is required" });
                    return;
                }
                const analysis = await this.analysisService.analyzeCode(code, language || "javascript");
                res.json(analysis);
            }
            catch (error) {
                console.error("Error in analysis controller:", error);
                res.status(500).json({ error: "Failed to analyze code" });
            }
        };
        this.analysisService = new codeanalysis_service_1.CodeAnalysisService();
    }
}
exports.AnalysisController = AnalysisController;
