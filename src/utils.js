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

export function escape(string) {
  return string || '';
}

const maxClueSizes = [
  [1080, 15],
  [1200, 17],
  [Infinity, 21],
];

export function resizeText(rootElement, nodeList) {
  const minSize = 7;
  const rootWidth = rootElement.width();
  const maxSize = maxClueSizes.find(bp => bp[0] > rootWidth)?.[1] ?? 24;
  const unit = 'px';

  for (var j = 0; j < nodeList.length; j++) {
    const el = nodeList[j];
    const parent = el.parentNode;
    let low = minSize;
    let high = maxSize;
    let best = minSize;

    // binary search for largest size that fits
    while (low <= high) {
      const mid = Math.ceil((low + high) / 2);
      el.style.fontSize = `${mid}${unit}`;

      const overflow = el.scrollHeight > parent.clientHeight ||
        el.scrollWidth > parent.clientWidth;

      if (overflow) {
        high = mid - 1;
      } else {
        best = mid;
        low = mid + 1;
      }
    }
    el.style.fontSize = `${best}${unit}`;
  }
}

