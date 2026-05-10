import type { TableItem } from "../format.js";
/**
 * Calculate the display width of a string by removing ANSI escape codes.
 *
 * NOTE: This implementation only removes basic ANSI color/style codes and may
 * not handle all escape sequences (e.g., cursor movement, complex control
 * sequences).
 */
export declare function getStringWidth(str: string): number;
/**
 * Calculates the minimum width needed by each column in the table
 * to fit its content (accounting for ANSI color codes).
 */
export declare function getColumnWidths(items: TableItem[]): number[];
/**
 * Calculates the inner width needed to fit the rows and headers
 * (excludes borders, which are added during rendering).
 *
 * Each column is padded by 1 space on each side, and columns are
 * separated by " │ " (3 spaces).
 */
export declare function getContentWidth(columnWidths: number[]): number;
/**
 * Calculates the inner width needed to fit titles and section headers
 * (excludes borders, which are added during rendering).
 *
 * Each title/header is padded by 1 space on each side.
 * Accounts for ANSI color codes.
 */
export declare function getHeadingWidth(items: TableItem[]): number;
/**
 * Calculates the width needed for unused columns when a row/header has fewer
 * cells than the total column count (e.g., if table has 6 columns but row
 * only has 2 cells, calculates space for the remaining 4 columns).
 */
export declare function getUnusedColumnsWidth(columnWidths: number[], previousCellCount: number): number;
/**
 * Renders a horizontal rule segment by repeating a character for each column
 * with padding, joined by a separator (e.g., "─────┼─────┼─────").
 */
export declare function renderRuleSegment(columnWidths: number[], char: string, joiner: string): string;
/**
 * Renders a complete horizontal rule with left and right borders
 * (e.g., "╟─────┼─────┼─────╢").
 */
export declare function renderHorizontalRule(leftBorder: string, columnWidths: number[], char: string, joiner: string, rightBorder: string): string;
/**
 * Renders a content line containing cells from either a header or row.
 *
 * Handles two cases:
 * - Full width: When all columns are used, cells are separated by " │ " and
 *   line ends with " ║" (e.g., "║ cell1 │ cell2 │ cell3 ║")
 * - Short line: When fewer columns are used, active cells are followed by
 *   " │ " and empty space, ending with "║" (e.g., "║ cell1 │ cell2 │       ║")
 *
 * Accounts for ANSI color codes when padding cells.
 */
export declare function renderContentLine(cells: string[], columnWidths: number[], currentCellCount: number): string;
/**
 * Renders the horizontal rule that appears above a header row.
 *
 * Handles three cases:
 * - Transition rule: When going from more columns to fewer, shows ┴ marks
 *   where columns collapse (e.g., "╟───┼───┼───┴───┴───╢")
 * - Full width: When header uses all columns (e.g., "╟───┬───┬───╢" or "╟───┼───┼───╢")
 * - Short header: When header uses fewer columns than max (e.g., "╟───┬─────────╢")
 *
 * The innerJoiner determines the separator character: ┬ after section-header, ┼ otherwise.
 */
export declare function renderHeaderOpen(columnWidths: number[], currentCellCount: number, innerJoiner: string, needsTransition: boolean): string;
/**
 * Renders the horizontal rule that appears above a row.
 *
 * Handles two cases:
 * - Full width: When row uses all columns, renders with ┼ joiners and
 *   ends with ╢ (e.g., "╟───┼───┼───╢")
 * - Short row: When row uses fewer columns, renders active columns with
 *   ┼ joiners, ends with ┤, then fills remaining space and ends with ║
 *   (e.g., "╟───┼───┤         ║")
 */
export declare function renderRowSeparator(columnWidths: number[], currentCellCount: number): string;
/**
 * Renders the section's bottom border, placing ╧ marks under column
 * separators where the last row/header had cells (e.g., if the last row
 * looked like "║ a │ b │       ║", the bottom border would be
 *             "╚═══╧═══╧═══════╝").
 */
export declare function renderSectionClose(columnWidths: number[], previousCellCount: number): string;
//# sourceMappingURL=format.d.ts.map