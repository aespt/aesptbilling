declare module 'html2pdf.js' {
  interface HTML2PDFOptions {
    margin?: number | [number, number, number, number];
    filename?: string;
    image?: {
      type?: string;
      quality?: number;
    };
    enableLinks?: boolean;
    html2canvas?: {
      scale?: number;
      useCORS?: boolean;
      logging?: boolean;
      allowTaint?: boolean;
      backgroundColor?: string;
    };
    jsPDF?: {
      orientation?: 'portrait' | 'landscape';
      unit?: 'mm' | 'cm' | 'in' | 'pt' | 'px';
      format?: string | [number, number];
    };
  }

  interface HTML2PDFInstance {
    from(element: HTMLElement | string): HTML2PDFInstance;
    set(options: HTML2PDFOptions): HTML2PDFInstance;
    save(): Promise<void>;
    output(
      type: string,
      options?: Record<string, unknown>
    ): string | Blob | ArrayBuffer | Uint8Array;
    toPdf(): HTML2PDFInstance;
    toImg(): HTML2PDFInstance;
    toCanvas(): Promise<HTMLCanvasElement>;
  }

  function html2pdf(): HTML2PDFInstance;
  namespace html2pdf {
    function worker(): HTML2PDFInstance;
  }

  export = html2pdf;
}
