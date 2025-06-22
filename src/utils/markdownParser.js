import { marked } from 'marked';

export function parseMarkdown(content) {
  // Try Q:/A: style first
  const qaRegex = /Q:\s*(.+?)\s*A:\s*([\s\S]+?)(?=\nQ:|$)/g;
  const flashcards = [];
  let match;
  let foundQA = false;
  while ((match = qaRegex.exec(content)) !== null) {
    flashcards.push({
      id: `card-${flashcards.length}`,
      question: match[1].trim(),
      answer: match[2].trim()
    });
    foundQA = true;
  }
  if (foundQA) return flashcards;

  // Fallback to heading/paragraph style
  const tokens = marked.lexer(content);
  let currentQuestion = null;
  tokens.forEach(token => {
    if (token.type === 'heading' && token.depth === 1) {
      currentQuestion = token.text;
    } else if (token.type === 'paragraph' && currentQuestion) {
      flashcards.push({
        id: `card-${flashcards.length}`,
        question: currentQuestion,
        answer: token.text
      });
      currentQuestion = null;
    }
  });
  return flashcards;
} 