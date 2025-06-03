declare module 'blob-stream' {
  interface BlobStream {
    pipe<T>(destination: T): T;
    on(event: string, callback: (chunk?: unknown) => void): void;
    toBlob(type?: string): Blob;
    writable: boolean;
    write(chunk: string | Buffer | Uint8Array): boolean;
    end(): void;
    addListener(event: string, listener: (chunk?: unknown) => void): BlobStream;
    removeListener(event: string, listener: (chunk?: unknown) => void): BlobStream;
  }

  function blobStream(): BlobStream;
  export = blobStream;
}

declare module 'file-saver' {
  export function saveAs(blob: Blob, filename?: string): void;
}
