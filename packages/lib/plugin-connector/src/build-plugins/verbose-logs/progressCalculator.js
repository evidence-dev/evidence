/**
 * Calculates the percentage of completion based on current and total values.
 * @param {number} current The current progress value.
 * @param {number} total The total value for completion.
 * @returns {number} The percentage of completion.
 */
export function calculateProgress(current, total) {
  if (total === 0) return 0;
  return Math.round((current / total) * 100);
}