import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Configure the worker source
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
}

/**
 * Renders a specific page of a PDF Uint8Array onto an HTMLCanvasElement
 */
export async function renderPdfPageToCanvas(
  pdfBytes: Uint8Array,
  pageNumber: number, // 1-indexed
  canvas: HTMLCanvasElement,
  scale: number = 1.5
): Promise<{ width: number; height: number; viewportWidth: number; viewportHeight: number }> {
  // Make a copy of the buffer because pdfjs transfers/neuters the underlying ArrayBuffer
  const data = pdfBytes.slice();
  const loadingTask = pdfjsLib.getDocument({
    data,
    cMapUrl: 'https://unpkg.com/pdfjs-dist@4.10.38/cmaps/',
    cMapPacked: true,
  });

  const pdfDoc = await loadingTask.promise;
  const page = await pdfDoc.getPage(pageNumber);

  const viewport = page.getViewport({ scale });
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas 2D context not available');
  }

  // Clear previous render
  context.clearRect(0, 0, canvas.width, canvas.height);

  const renderContext = {
    canvasContext: context,
    viewport: viewport,
    canvas: canvas,
  };

  await page.render(renderContext).promise;

  return {
    width: page.view[2] - page.view[0],
    height: page.view[3] - page.view[1],
    viewportWidth: viewport.width,
    viewportHeight: viewport.height,
  };
}
