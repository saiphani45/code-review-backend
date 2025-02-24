import { Request, Response, NextFunction } from "express";
import { CodeAnalysisService } from "../services/codeanalysis-service.js";

export class AnalysisController {
  private analysisService: CodeAnalysisService;

  constructor() {
    this.analysisService = new CodeAnalysisService();
  }

  // Make it an arrow function to preserve 'this' context and properly type the method
  analyzeCode = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { code, language } = req.body;

      if (!code) {
        res.status(400).json({ error: "Code is required" });
        return;
      }

      const analysis = await this.analysisService.analyzeCode(
        code,
        language || "javascript"
      );
      res.json(analysis);
    } catch (error) {
      console.error("Error in analysis controller:", error);
      res.status(500).json({ error: "Failed to analyze code" });
    }
  };
}
