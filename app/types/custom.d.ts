declare module 'blob-stream' {
  interface BlobStream {
    pipe<T>(destination: T): T;
    on(event: string, callback: Function): void;
    toBlob(type?: string): Blob;
    writable: boolean;
    write(chunk: any): boolean;
    end(): void;
    addListener(event: string, listener: Function): BlobStream;
    removeListener(event: string, listener: Function): BlobStream;
  }

  function blobStream(): BlobStream;
  export = blobStream;
}

declare module 'file-saver' {
  export function saveAs(blob: Blob, filename?: string): void;
}
