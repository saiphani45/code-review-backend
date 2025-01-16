import { HfInference } from "@huggingface/inference";
import * as eslint from "eslint";

export class CodeAnalysisService {
  private hf: HfInference;
  private eslintInstance: eslint.ESLint;

  constructor() {
    this.hf = new HfInference(process.env.HF_TOKEN);

    // Create ESLint instance with correct options type
    const options: eslint.ESLint.Options = {
      overrideConfig: {
        rules: {
          semi: 2,
          quotes: [2, "single"],
          "no-unused-vars": 1,
          "no-console": 1,
        },
      },
    };

    this.eslintInstance = new eslint.ESLint(options);
  }

  async analyzeCode(code: string, language: string) {
    try {
      const [aiAnalysis, lintResults, complexityMetrics] = await Promise.all([
        this.getAiSuggestions(code),
        this.lintCode(code),
        this.calculateComplexity(code),
      ]);

      return {
        aiSuggestions: aiAnalysis,
        lintIssues: lintResults,
        complexity: complexityMetrics,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("Error in code analysis:", error);
      throw error;
    }
  }

  private async getAiSuggestions(code: string) {
    console.log("code", code);
    try {
      const prompt = `Analyze this code and suggest improvements:
        ${code}
        
        Focus on:
        1. Code quality
        2. Best practices
        3. Potential bugs
        4. Performance issues`;

      const analysis = await this.hf.textGeneration({
        model: "microsoft/codebert-base",
        inputs: prompt,
        parameters: {
          max_length: 150,
          temperature: 0.7,
          top_p: 0.95,
        },
      });

      console.log("analysis", analysis);

      return this.parseAiResponse(analysis.generated_text);
    } catch (error) {
      console.error("Error in AI analysis:", error);
      return [];
    }
  }

  private async lintCode(code: string) {
    try {
      const results = await this.eslintInstance.lintText(code);
      return results[0]?.messages || [];
    } catch (error) {
      console.error("Error in linting:", error);
      return [];
    }
  }

  private calculateComplexity(code: string) {
    try {
      return {
        lines: code.split("\n").length,
        functions: (code.match(/function/g) || []).length,
        classes: (code.match(/class/g) || []).length,
        cyclomaticComplexity: this.calculateCyclomaticComplexity(code),
      };
    } catch (error) {
      console.error("Error calculating complexity:", error);
      return null;
    }
  }

  private calculateCyclomaticComplexity(code: string): number {
    const controlFlowKeywords = [
      "if",
      "else if",
      "for",
      "while",
      "case",
      "&&",
      "\\|\\|",
      "\\?",
    ];

    let complexity = 1; // base complexity

    controlFlowKeywords.forEach((keyword) => {
      const matches = code.match(new RegExp(keyword, "g"));
      if (matches) {
        complexity += matches.length;
      }
    });

    return complexity;
  }

  private parseAiResponse(response: string) {
    const suggestions = response
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((suggestion) => ({
        type: this.classifySuggestion(suggestion),
        content: suggestion,
        confidence: this.calculateConfidence(suggestion),
      }));

    return suggestions;
  }

  private classifySuggestion(
    suggestion: string
  ): "quality" | "practice" | "bug" | "performance" {
    if (
      suggestion.toLowerCase().includes("bug") ||
      suggestion.toLowerCase().includes("error")
    ) {
      return "bug";
    }
    if (suggestion.toLowerCase().includes("performance")) {
      return "performance";
    }
    if (suggestion.toLowerCase().includes("practice")) {
      return "practice";
    }
    return "quality";
  }

  private calculateConfidence(suggestion: string): number {
    const hasSpecificTerms = suggestion.match(
      /\b(definitely|clearly|must|should|could|might)\b/gi
    );
    const hasCodeExample = suggestion.includes("```");
    const isDetailed = suggestion.length > 100;

    let confidence = 0.7; // base confidence
    if (hasSpecificTerms) confidence += 0.1;
    if (hasCodeExample) confidence += 0.1;
    if (isDetailed) confidence += 0.1;

    return Math.min(confidence, 1);
  }
}
