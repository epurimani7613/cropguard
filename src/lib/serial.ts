/**
 * Web Serial typings.
 *
 * TypeScript's DOM lib does not include the Web Serial API, so we declare the
 * narrow slice we use. Chrome/Edge 89+ and Opera implement this; Safari and
 * Firefox do not, which the UI reports rather than silently failing.
 */

export interface SerialPortInfo {
  usbVendorId?: number;
  usbProductId?: number;
}

export interface SerialOptions {
  filters?: { usbVendorId?: number; usbProductId?: number }[];
}

export interface SerialPortOpenOptions {
  baudRate: number;
  dataBits?: 7 | 8;
  stopBits?: 1 | 2;
  parity?: 'none' | 'even' | 'odd';
  bufferSize?: number;
  flowControl?: 'none' | 'hardware';
}

export interface SerialPort extends EventTarget {
  readonly readable: ReadableStream<Uint8Array> | null;
  readonly writable: WritableStream<Uint8Array> | null;
  open(options: SerialPortOpenOptions): Promise<void>;
  close(): Promise<void>;
  getInfo(): SerialPortInfo;
  forget?(): Promise<void>;
}

export interface Serial extends EventTarget {
  getPorts(): Promise<SerialPort[]>;
  requestPort(options?: SerialOptions): Promise<SerialPort>;
  addEventListener(type: 'connect', listener: (event: Event) => void): void;
  addEventListener(type: 'disconnect', listener: (event: Event) => void): void;
}

declare global {
  interface Navigator {
    readonly serial?: Serial;
  }
}

export function getSerial(): Serial | null {
  if (typeof navigator === 'undefined') return null;
  return navigator.serial ?? null;
}

export function isSerialSupported(): boolean {
  return typeof navigator !== 'undefined' && 'serial' in navigator;
}

/**
 * Reads an open port and emits decoded chunks. Firmware output is line
 * oriented, so the caller buffers until a newline arrives.
 */
export async function readSerialLines(
  port: SerialPort,
  onChunk: (chunk: string) => void,
  onError?: (err: unknown) => void,
): Promise<void> {
  const readable = port.readable;
  if (!readable) {
    onError?.(new Error('Port opened but no readable stream — another app may hold the device.'));
    return;
  }

  const reader = readable.getReader();
  const decoder = new TextDecoder();

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) onChunk(decoder.decode(value, { stream: true }));
    }
  } catch (err) {
    // Device unplugged or port reset — surface it, do not loop.
    onError?.(err);
  } finally {
    try {
      reader.releaseLock();
    } catch {
      /* stream already closed */
    }
  }
}

/**
 * Writes a line to an open port.
 *
 * Two real hazards this handles:
 *  - `port.writable` is null when another app holds the device, so we check.
 *  - A writer must be released or the port will not close cleanly, so we lock,
 *    write, and always release in `finally`.
 */
export async function writeSerialLine(
  port: SerialPort,
  line: string,
  onError?: (err: unknown) => void,
): Promise<boolean> {
  const writable = port.writable;
  if (!writable) {
    onError?.(new Error('Port is not writable — the device may be held by another application.'));
    return false;
  }

  const writer = writable.getWriter();
  try {
    await writer.write(new TextEncoder().encode(`${line}\n`));
    return true;
  } catch (err) {
    onError?.(err);
    return false;
  } finally {
    try {
      writer.releaseLock();
    } catch {
      /* stream already closed */
    }
  }
}