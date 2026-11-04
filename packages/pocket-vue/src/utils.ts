// ============================================================================
// Attribute Utilities
// ============================================================================

export const checkAttr = (el: Element, name: string): string | null => {
  const val = el.getAttribute(name)
  if (val != null) el.removeAttribute(name)
  return val
}

// ============================================================================
// Event Handling Utilities
// ============================================================================

export const listen = (
  el: Element,
  event: string,
  handler: EventListener,
  options?: AddEventListenerOptions
) => {
  el.addEventListener(event, handler, options)
}

// ============================================================================
// Shared Regex Patterns
// ============================================================================

/**
 * Centralized regex patterns used across directives
 * These are defined once to improve performance and maintainability
 */
export const DIRECTIVE_PATTERNS = {
  /** Matches directive prefixes: v-, :, @ */
  DIR_RE: /^(?:v-|:|@)/,

  /** Matches modifiers like .camel, .lazy, etc. */
  MODIFIER_RE: /\.([\w-]+)/g,

  /** Matches v-for alias pattern: "item in items" or "item of items" */
  FOR_ALIAS_RE: /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/,

  /** Matches v-for iterators: ", index" or ", key, index" */
  FOR_ITERATOR_RE: /,([^,\}\]]*)(?:,([^,\}\]]*))?$/,

  /** Matches parentheses to strip from expressions */
  STRIP_PARENS_RE: /^\(|\)$/g,

  /** Matches destructuring patterns: [a, b] or {a, b} */
  DESTRUCTURE_RE: /^[{[]\s*((?:[\w_$]+\s*,?\s*)+)[\]}]$/
} as const