import { HfInference } from "@huggingface/inference";

interface AnalysisSuggestion {
  type: "quality" | "practice" | "bug" | "performance" | "security";
  content: any;
  confidence: number;
  improvement?: any;
  codeExample?: string;
  severity: "low" | "medium" | "high";
  lineNumbers?: number[];
}

interface ComplexityMetrics {
  lines: number;
  functions: number;
  classes: number;
  cyclomaticComplexity: number;
  maintainabilityIndex: number;
  duplicateCodePercentage: number;
}

interface AnalysisResponse {
  aiSuggestions: AnalysisSuggestion[];
  complexity: ComplexityMetrics;
  timestamp: string;
}

export class CodeAnalysisService {
  private hf: HfInference;
  private readonly MAX_TOKENS_APPROX = 800;
  private readonly SEVERITY_KEYWORDS = {
    high: [
      "security",
      "vulnerability",
      "crash",
      "memory leak",
      "infinite loop",
      "deadlock",
      "critical",
      "exploit",
    ],
    medium: [
      "performance",
      "memory",
      "complexity",
      "maintainability",
      "error handling",
      "warning",
    ],
    low: ["style", "documentation", "naming", "formatting", "suggestion"],
  };

  constructor() {
    this.hf = new HfInference(process.env.HF_TOKEN);
  }

  async analyzeCode(code: string, language: string): Promise<AnalysisResponse> {
    try {
      const [aiAnalysis, complexityMetrics] = await Promise.all([
        this.getAiSuggestions(code, language),
        this.calculateComplexity(code),
      ]);

      return {
        aiSuggestions: aiAnalysis,
        complexity: complexityMetrics,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error in code analysis:", error);
      throw error;
    }
  }

  private async getAiSuggestions(
    code: string,
    language: string
  ): Promise<AnalysisSuggestion[]> {
    try {
      const { truncatedCode, isTruncated } = this.truncateCodeIfNeeded(code);
      const prompt = this.generateAnalysisPrompt(truncatedCode, language);

      console.log("Sending code analysis request...");

      try {
        const response = await this.hf.textGeneration({
          model: "gpt2",
          inputs: prompt,
          parameters: {
            max_new_tokens: 1500,
            temperature: 0.3,
            top_p: 0.95,
            return_full_text: false,
            repetition_penalty: 1.2,
          },
        });

        console.log("AI Response received:", response.generated_text);

        if (!response.generated_text) {
          throw new Error("Empty response from GPT-2");
        }

        const suggestions = this.parseAiResponse(response.generated_text);
        console.log("Parsed suggestions:", suggestions);

        if (suggestions.length === 0) {
          return this.getDefaultSuggestions(code, language);
        }

        return suggestions.map((suggestion) => ({
          ...suggestion,
          confidence: this.calculateConfidence(suggestion),
          severity: this.calculateSeverity(suggestion),
        }));
      } catch (gptError) {
        console.error("GPT-2 error:", gptError);
        return this.getDefaultSuggestions(code, language);
      }
    } catch (error) {
      console.error("Error in AI analysis:", error);
      return this.getDefaultSuggestions(code, language);
    }
  }

  private generateAnalysisPrompt(code: string, language: string): string {
    return `As an expert code reviewer, analyze this ${language} code for issues and improvements.

Format each issue exactly as follows:

ISSUE: Describe the specific problem
IMPROVEMENT: Explain how to fix it
CODE: Show improved code example

Review for:
- Code structure and maintainability
- Performance issues
- Security risks
- Error handling
- ${language} best practices

Code to analyze:
\`\`\`${language}
${code}
\`\`\`

Provide at least 2-3 suggestions using the exact format (ISSUE:, IMPROVEMENT:, CODE:).`;
  }

  private parseAiResponse(response: string): AnalysisSuggestion[] {
    const suggestions: AnalysisSuggestion[] = [];
    const sections = response.split(/(?=ISSUE:|IMPROVEMENT:|CODE:)/g);

    for (const section of sections) {
      if (!section.trim()) continue;

      const suggestion: Partial<AnalysisSuggestion> = {
        type: "quality",
        content: "",
        confidence: 0.7,
        severity: "medium",
      };

      // Extract issue description
      const issueMatch = section.match(/ISSUE:(.*?)(?=IMPROVEMENT:|CODE:|$)/s);
      if (issueMatch) {
        suggestion.content = issueMatch[1].trim();
        suggestion.type = this.classifySuggestion(suggestion.content);
      }

      // Extract improvement suggestion
      const improvementMatch = section.match(/IMPROVEMENT:(.*?)(?=CODE:|$)/s);
      if (improvementMatch) {
        suggestion.improvement = improvementMatch[1].trim();
      }

      // Extract code example
      const codeMatch = section.match(/CODE:(.*?)(?=ISSUE:|$)/s);
      if (codeMatch) {
        suggestion.codeExample = codeMatch[1].trim();
      }

      // Extract line numbers if present
      const lineNumbersMatch = suggestion.content?.match(
        /line[s]?\s*(?:number[s]?)?:?\s*(\d+(?:\s*[-,]\s*\d+)*)/i
      );
      if (lineNumbersMatch) {
        suggestion.lineNumbers = lineNumbersMatch[1]
          .split(/[-,\s]+/)
          .map((num: any) => parseInt(num.trim()))
          .filter((num: any) => !isNaN(num));
      }

      if (suggestion.content) {
        suggestions.push(suggestion as AnalysisSuggestion);
      }
    }

    return suggestions;
  }

  private getDefaultSuggestions(
    code: string,
    language: string
  ): AnalysisSuggestion[] {
    const suggestions: AnalysisSuggestion[] = [];

    // Check for long functions
    const longFunctionMatch = code.match(
      /function\s+\w+\s*\([^)]*\)\s*{[\s\S]{500,}?}/g
    );
    if (longFunctionMatch) {
      suggestions.push({
        type: "quality",
        content: "Function is too long and may be difficult to maintain",
        improvement:
          "Consider breaking down the function into smaller, more focused functions",
        confidence: 0.8,
        severity: "medium",
        lineNumbers: [this.findLineNumber(code, longFunctionMatch[0])],
      });
    }

    // Check for complexity indicators
    if ((code.match(/(if|for|while|switch)/g) || []).length > 5) {
      suggestions.push({
        type: "quality",
        content: "High cyclomatic complexity detected",
        improvement:
          "Consider simplifying control flow and extracting logic into separate functions",
        confidence: 0.7,
        severity: "medium",
      });
    }

    // Language-specific checks
    if (language === "typescript" || language === "javascript") {
      // Check for console.log statements
      const consoleStatements: any = code.match(/console\.(log|warn|error)/g);
      if (consoleStatements?.length > 0) {
        suggestions.push({
          type: "practice",
          content: "Console statements found in code",
          improvement:
            "Remove or replace console statements with proper logging mechanism for production code",
          confidence: 0.9,
          severity: "low",
          lineNumbers: this.findAllLineNumbers(code, "console."),
        });
      }

      // Check for any/unknown types in TypeScript
      if (language === "typescript" && code.includes(": any")) {
        suggestions.push({
          type: "quality",
          content: "Usage of 'any' type detected",
          improvement:
            "Replace 'any' with more specific types to improve type safety",
          confidence: 0.9,
          severity: "medium",
          lineNumbers: this.findAllLineNumbers(code, ": any"),
        });
      }

      // Check for error handling
      if (!code.includes("try") && !code.includes("catch")) {
        suggestions.push({
          type: "practice",
          content: "No error handling detected",
          improvement:
            "Consider adding try-catch blocks around code that may throw errors",
          confidence: 0.7,
          severity: "medium",
        });
      }
    }

    return suggestions;
  }

  private classifySuggestion(content: string): AnalysisSuggestion["type"] {
    const contentLower = content.toLowerCase();

    if (
      contentLower.includes("secur") ||
      contentLower.includes("vulnerab") ||
      contentLower.includes("exploit") ||
      contentLower.includes("inject")
    ) {
      return "security";
    }

    if (
      contentLower.includes("perform") ||
      contentLower.includes("slow") ||
      contentLower.includes("memory") ||
      contentLower.includes("leak") ||
      contentLower.includes("optimi")
    ) {
      return "performance";
    }

    if (
      contentLower.includes("bug") ||
      contentLower.includes("error") ||
      contentLower.includes("crash") ||
      contentLower.includes("exception") ||
      contentLower.includes("fix")
    ) {
      return "bug";
    }

    if (
      contentLower.includes("practice") ||
      contentLower.includes("convention") ||
      contentLower.includes("standard") ||
      contentLower.includes("pattern")
    ) {
      return "practice";
    }

    return "quality";
  }

  private calculateSeverity(
    suggestion: Partial<AnalysisSuggestion>
  ): "low" | "medium" | "high" {
    const content = (suggestion.content || "").toLowerCase();

    // Check for high-severity indicators
    if (
      this.SEVERITY_KEYWORDS.high.some((keyword) => content.includes(keyword))
    ) {
      return "high";
    }

    // Check for medium-severity indicators
    if (
      this.SEVERITY_KEYWORDS.medium.some((keyword) => content.includes(keyword))
    ) {
      return "medium";
    }

    // Consider code example presence and improvement detail for severity
    if (suggestion.codeExample && suggestion.improvement?.length > 100) {
      return "medium";
    }

    // Check type-based severity
    if (suggestion.type === "security" || suggestion.type === "bug") {
      return "high";
    }
    if (suggestion.type === "performance") {
      return "medium";
    }

    return "low";
  }

  private calculateConfidence(suggestion: Partial<AnalysisSuggestion>): number {
    let confidence = 0.7; // Base confidence score

    // Increase confidence based on content quality
    if (suggestion.content?.length > 100) confidence += 0.05;
    if (suggestion.content?.includes("line")) confidence += 0.05;

    // Increase confidence for detailed improvements
    if (suggestion.improvement?.length > 100) confidence += 0.05;
    if (suggestion.improvement?.includes("example")) confidence += 0.05;

    // Increase confidence for code examples and line numbers
    if (suggestion.codeExample) confidence += 0.1;
    if (suggestion.lineNumbers?.length) confidence += 0.1;

    // Adjust based on suggestion type
    switch (suggestion.type) {
      case "security":
        confidence += 0.15;
        break;
      case "bug":
        confidence += 0.1;
        break;
      case "performance":
        confidence += 0.05;
        break;
    }

    // Cap confidence at 1.0
    return Math.min(confidence, 1.0);
  }

  private truncateCodeIfNeeded(code: string): {
    truncatedCode: string;
    isTruncated: boolean;
  } {
    const estimatedTokens = code.split(/\s+/).length;

    if (estimatedTokens <= this.MAX_TOKENS_APPROX) {
      return { truncatedCode: code, isTruncated: false };
    }

    const lines = code.split("\n");
    let currentLength = 0;
    let cutoffIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      currentLength += lines[i].split(/\s+/).length;
      if (currentLength > this.MAX_TOKENS_APPROX) {
        cutoffIndex = i;
        break;
      }
    }

    return {
      truncatedCode: lines.slice(0, cutoffIndex).join("\n"),
      isTruncated: true,
    };
  }

  private calculateComplexity(code: string): ComplexityMetrics {
    try {
      const lines = code.split("\n").length;
      const functions = (
        code.match(
          /function\s+\w+\s*\(|const\s+\w+\s*=\s*(\([^)]*\)|async\s*\([^)]*\))\s*=>|\w+\s*\([^)]*\)\s*{/g
        ) || []
      ).length;
      const classes = (code.match(/class\s+\w+/g) || []).length;
      const cyclomaticComplexity = this.calculateCyclomaticComplexity(code);
      const maintainabilityIndex = this.calculateMaintainabilityIndex(code);
      const duplicateCodePercentage = this.calculateDuplicateCode(code);

      return {
        lines,
        functions,
        classes,
        cyclomaticComplexity,
        maintainabilityIndex,
        duplicateCodePercentage,
      };
    } catch (error) {
      console.error("Error calculating complexity:", error);
      return {
        lines: 0,
        functions: 0,
        classes: 0,
        cyclomaticComplexity: 0,
        maintainabilityIndex: 0,
        duplicateCodePercentage: 0,
      };
    }
  }

  private calculateCyclomaticComplexity(code: string): number {
    const controlFlowKeywords = [
      "if",
      "else if",
      "for",
      "while",
      "do",
      "case",
      "catch",
      "&&",
      "\\|\\|",
      "\\?",
    ];
    let complexity = 1;

    controlFlowKeywords.forEach((keyword) => {
      const matches = code.match(new RegExp(`\\b${keyword}\\b`, "g"));
      if (matches) {
        complexity += matches.length;
      }
    });

    const functionMatches = code.match(
      /function\s+\w+\s*\(|const\s+\w+\s*=\s*(\([^)]*\)|async\s*\([^)]*\))\s*=>|\w+\s*\([^)]*\)\s*{/g
    );
    if (functionMatches) {
      complexity += functionMatches.length;
    }

    return complexity;
  }

  private calculateMaintainabilityIndex(code: string): number {
    const lines = code.split("\n").length;
    const complexity = this.calculateCyclomaticComplexity(code);
    const halsteadVolume = this.calculateHalsteadMetrics(code);

    const maintainabilityIndex =
      171 -
      5.2 * Math.log(halsteadVolume) -
      0.23 * complexity -
      16.2 * Math.log(lines);

    return Math.max(0, Math.min(100, maintainabilityIndex));
  }

  private calculateHalsteadMetrics(code: string): number {
    const operators = new Set();
    const operands = new Set();

    const operatorRegex =
      /[+\-*/%=&|<>!~^]+|[\[\]{}().,;:]|\b(if|else|for|while|do|switch|case|break|continue|return|new|delete|typeof|instanceof)\b/g;
    const operandRegex =
      /\b([a-zA-Z_]\w*)\b(?!\s*\()|"[^"]*"|'[^']*'|\d+(?:\.\d+)?/g;

    const operatorMatches = code.match(operatorRegex) || [];
    const operandMatches = code.match(operandRegex) || [];

    operatorMatches.forEach((op) => operators.add(op));
    operandMatches.forEach((op) => operands.add(op));

    const n1 = operators.size;
    const n2 = operands.size;
    const N1 = operatorMatches.length;
    const N2 = operandMatches.length;

    const programVocabulary = n1 + n2;
    const programLength = N1 + N2;

    return programLength * Math.log2(programVocabulary);
  }

  private calculateDuplicateCode(code: string): number {
    const lines = code.split("\n");
    const minLineLength = 3;
    let duplicateLines = 0;
    const sequences = new Map<string, number>();

    for (let i = 0; i < lines.length - minLineLength + 1; i++) {
      for (
        let length = minLineLength;
        length <= 6 && i + length <= lines.length;
        length++
      ) {
        const sequence = lines
          .slice(i, i + length)
          .join("\n")
          .trim();
        if (sequence.length < 50) continue;

        sequences.set(sequence, (sequences.get(sequence) || 0) + 1);
      }
    }

    sequences.forEach((count, sequence) => {
      if (count > 1) {
        const sequenceLines = sequence.split("\n").length;
        duplicateLines += sequenceLines * (count - 1);
      }
    });

    return (duplicateLines / lines.length) * 100;
  }

  private findLineNumber(code: string, match: string): number {
    const lines = code.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(match)) {
        return i + 1;
      }
    }
    return 1;
  }

  private findAllLineNumbers(code: string, pattern: string): number[] {
    return code
      .split("\n")
      .map((line, index) => (line.includes(pattern) ? index + 1 : null))
      .filter((lineNum): lineNum is number => lineNum !== null);
  }
}
