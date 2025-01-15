"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeAnalysisService = void 0;
const inference_1 = require("@huggingface/inference");
const eslint = __importStar(require("eslint"));
class CodeAnalysisService {
    constructor() {
        this.hf = new inference_1.HfInference(process.env.HF_TOKEN);
        // Create ESLint instance with correct options type
        const options = {
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
    async analyzeCode(code, language) {
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
        }
        catch (error) {
            console.error("Error in code analysis:", error);
            throw error;
        }
    }
    async getAiSuggestions(code) {
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
            return this.parseAiResponse(analysis.generated_text);
        }
        catch (error) {
            console.error("Error in AI analysis:", error);
            return [];
        }
    }
    async lintCode(code) {
        var _a;
        try {
            const results = await this.eslintInstance.lintText(code);
            return ((_a = results[0]) === null || _a === void 0 ? void 0 : _a.messages) || [];
        }
        catch (error) {
            console.error("Error in linting:", error);
            return [];
        }
    }
    calculateComplexity(code) {
        try {
            return {
                lines: code.split("\n").length,
                functions: (code.match(/function/g) || []).length,
                classes: (code.match(/class/g) || []).length,
                cyclomaticComplexity: this.calculateCyclomaticComplexity(code),
            };
        }
        catch (error) {
            console.error("Error calculating complexity:", error);
            return null;
        }
    }
    calculateCyclomaticComplexity(code) {
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
    parseAiResponse(response) {
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
    classifySuggestion(suggestion) {
        if (suggestion.toLowerCase().includes("bug") ||
            suggestion.toLowerCase().includes("error")) {
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
    calculateConfidence(suggestion) {
        const hasSpecificTerms = suggestion.match(/\b(definitely|clearly|must|should|could|might)\b/gi);
        const hasCodeExample = suggestion.includes("```");
        const isDetailed = suggestion.length > 100;
        let confidence = 0.7; // base confidence
        if (hasSpecificTerms)
            confidence += 0.1;
        if (hasCodeExample)
            confidence += 0.1;
        if (isDetailed)
            confidence += 0.1;
        return Math.min(confidence, 1);
    }
}
exports.CodeAnalysisService = CodeAnalysisService;
