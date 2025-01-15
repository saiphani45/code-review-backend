export const complexity = {
  analyze: (code: string) => {
    // Basic complexity metrics
    const lines = code.split("\n").length;
    const functions = (code.match(/function/g) || []).length;
    const classes = (code.match(/class/g) || []).length;
    const comments =
      (code.match(/\/\//g) || []).length +
      (code.match(/\/\*[\s\S]*?\*\//g) || []).length;

    return {
      lines,
      functions,
      classes,
      comments,
      cyclomaticComplexity: calculateCyclomaticComplexity(code),
    };
  },
};

function calculateCyclomaticComplexity(code: string): number {
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
