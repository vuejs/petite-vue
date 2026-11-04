// Expression validation patterns - more conservative to avoid blocking legitimate code
const DANGEROUS_PATTERNS = [
  /\b(eval|Function|setTimeout|setInterval|XMLHttpRequest|fetch|WebSocket|Worker)\b/,
  /\b(window|document|globalThis|global|process|require|import|export)\b/,
  /\b(delete|void|typeof|instanceof)\b.*\(/,
]

export const validateExpression = (exp: string): boolean => {
  if (exp == null || exp === '' || exp.length > 1000) return false
  return !DANGEROUS_PATTERNS.some((pattern) => pattern.test(exp))
}
