export type HoverAction =
  | { type: 'keep' }
  | { type: 'clear' }
  | { type: 'switch'; index: string };

/**
 * Decide what the PDF sentence hover highlight should do when the pointer
 * moves. `foundIndex` is the segment index under the pointer (null when the
 * pointer is over a gap, margin, or any other non-sentence content) and
 * `hoveredIndex` is the currently highlighted segment (null when none).
 */
export const resolveHoverAction = (
  foundIndex: string | null,
  hoveredIndex: string | null,
): HoverAction => {
  if (foundIndex === null) {
    return hoveredIndex === null ? { type: 'keep' } : { type: 'clear' };
  }
  if (foundIndex === hoveredIndex) return { type: 'keep' };
  return { type: 'switch', index: foundIndex };
};
