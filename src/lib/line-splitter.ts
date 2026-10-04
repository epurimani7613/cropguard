/**
 * Incremental line splitter for byte streams.
 *
 * UART output arrives in arbitrary chunks that rarely align to line
 * boundaries, so we buffer until a newline. Handles `\r\n`, `\n`, and a lone
 * `\r` (some firmware emits CR-only progress lines).
 *
 * Kept free of DOM and React so it can be unit-tested directly.
 */
export class LineSplitter {
  private buffer = '';
  /** Guards against a device that never sends a newline. */
  constructor(private readonly maxBuffer = 8192) {}

  /** Feed a decoded chunk; returns every complete line it produced. */
  push(chunk: string): string[] {
    this.buffer += chunk;

    if (this.buffer.length > this.maxBuffer) {
      // Flush the overflow as one line rather than growing without bound.
      const overflow = this.buffer;
      this.buffer = '';
      return [overflow];
    }

    const lines = this.buffer.split(/\r\n|\n|\r/);
    this.buffer = lines.pop() ?? '';
    return lines.filter((l) => l.trim().length > 0);
  }

  /** Return any trailing partial line and reset. Call before disconnecting. */
  flush(): string | null {
    const rest = this.buffer.trim();
    this.buffer = '';
    return rest.length ? rest : null;
  }

  reset(): void {
    this.buffer = '';
  }
}