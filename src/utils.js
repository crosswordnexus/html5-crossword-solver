/**
 * @file utils.js
 * @description General standalone utility functions and algorithms for the crossword solver.
 * 
 * What belongs here:
 * - Stateless, pure helper functions (like isCorrect).
 * - DOM/HTML formatting utilities (like escape, sanitize, etc., if extracted in the future).
 * - Data structure manipulation helpers that do not fit into specific domain models.
 */
export function isCorrect(entry, solution) {
  // if we have a rebus or non-alpha solution or no solution, accept anything
  if (entry && (!solution || solution.length > 1 || /[^A-Za-z]/.test(solution))) {
    return true;
  }
  // otherwise, only mark as okay if we have an exact match
  else {
    return entry == solution;
  }
}
