import { Writable } from "node:stream";
/**
 * Creates a Transform that writes everything to actualWritable, without closing it
 * when finished.
 *
 * This is useful to pipe things to stdout, without closing it, while being
 * able to await for the result of the pipe to finish.
 */
export declare function createNonClosingWriter(actualWritable: Writable): Writable;
//# sourceMappingURL=stream.d.ts.map