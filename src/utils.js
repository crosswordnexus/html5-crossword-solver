/**
 * Function to check if a cell is solved correctly
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
