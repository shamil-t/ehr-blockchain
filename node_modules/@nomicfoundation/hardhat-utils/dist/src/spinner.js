const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
export const FRAME_INTERVAL_MS = 80;
/**
 * Spinner that writes frames to a stream.
 */
class Spinner {
    isEnabled;
    #text;
    #interval = null;
    #stream;
    constructor(options) {
        this.isEnabled = options.enabled;
        this.#stream = options.stream;
        this.#text = options.text;
    }
    /**
     * Begin rendering frames when enabled.
     */
    start() {
        if (!this.isEnabled) {
            return;
        }
        this.#stopAnimation();
        let frameIndex = 0;
        this.#interval = setInterval(() => {
            this.#render(FRAMES[frameIndex]);
            frameIndex = (frameIndex + 1) % FRAMES.length;
        }, FRAME_INTERVAL_MS);
    }
    /**
     * Stop the spinner without printing a final line.
     */
    stop() {
        this.#stopAnimation();
    }
    #clearLine() {
        this.#stream.clearLine(0);
        this.#stream.cursorTo(0);
    }
    #render(frame) {
        if (!this.isEnabled) {
            return;
        }
        this.#clearLine();
        this.#stream.write(`${frame} ${this.#text}`);
    }
    #stopAnimation() {
        if (this.#interval === null) {
            return;
        }
        clearInterval(this.#interval);
        this.#interval = null;
        if (this.isEnabled) {
            this.#clearLine();
        }
    }
}
/**
 * Create a spinner instance.
 *
 * @example
 * ```typescript
 * const spinner = createSpinner({ text: "Compiling…" });
 * spinner.start();
 *
 * try {
 *   await compileContracts();
 *   spinner.stop();
 *   console.log("Compiled 12 contracts");
 * } catch (error) {
 *   spinner.stop();
 *   console.error("Compilation failed");
 * }
 * ```
 *
 * @param options  Optional spinner configuration.
 * @returns {Spinner} A spinner instance.
 */
export function createSpinner(options = {}) {
    const stream = options.stream ?? process.stdout;
    const enabled = stream.isTTY === true &&
        process.env.TERM !== "dumb" &&
        (options.enabled ?? true);
    const text = options.text ?? "";
    return new Spinner({
        enabled,
        stream,
        text,
    });
}
//# sourceMappingURL=spinner.js.map