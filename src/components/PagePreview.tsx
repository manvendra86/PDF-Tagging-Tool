import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
  Crosshair,
  Loader2,
  FileText,
  Layers,
  Sparkles,
} from 'lucide-react';
import { FormFieldItem } from '../types';
import { renderPdfPageToCanvas } from '../lib/pdfRenderer';

interface PagePreviewProps {
  pdfBytes: Uint8Array | null;
  fields: FormFieldItem[];
  selectedField: FormFieldItem | null;
  onSelectField: (field: FormFieldItem) => void;
  currentPageIndex: number;
  onPageChange: (pageIndex: number) => void;
  pageCount: number;
  pageSize: { width: number; height: number };
}

export const PagePreview: React.FC<PagePreviewProps> = ({
  pdfBytes,
  fields,
  selectedField,
  onSelectField,
  currentPageIndex,
  onPageChange,
  pageCount,
  pageSize,
}) => {
  const [zoom, setZoom] = useState<number>(1.0);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [renderedMetrics, setRenderedMetrics] = useState<{
    pageWidth: number;
    pageHeight: number;
    viewportWidth: number;
    viewportHeight: number;
    scale: number;
  }>({
    pageWidth: pageSize.width || 595,
    pageHeight: pageSize.height || 842,
    viewportWidth: (pageSize.width || 595) * 1.5,
    viewportHeight: (pageSize.height || 842) * 1.5,
    scale: 1.5,
  });

  // Render the current PDF page directly to the canvas using pdfjs-dist
  useEffect(() => {
    if (!pdfBytes || !canvasRef.current) return;

    let isCancelled = false;
    setIsRendering(true);
    setRenderError(null);

    const canvas = canvasRef.current;
    const targetScale = 1.5; // High resolution rendering

    renderPdfPageToCanvas(pdfBytes, currentPageIndex + 1, canvas, targetScale)
      .then((metrics) => {
        if (!isCancelled) {
          setRenderedMetrics({
            pageWidth: metrics.width,
            pageHeight: metrics.height,
            viewportWidth: metrics.viewportWidth,
            viewportHeight: metrics.viewportHeight,
            scale: targetScale,
          });
          setIsRendering(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('PDF page render error:', err);
          setRenderError('Could not render PDF page canvas.');
          setIsRendering(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [pdfBytes, currentPageIndex]);

  // Filter fields on current page
  const pageFields = fields.filter((f) => f.pageIndex === currentPageIndex);

  const baseWidth = renderedMetrics.pageWidth || 595;
  const baseHeight = renderedMetrics.pageHeight || 842;
  const scaleRatio = renderedMetrics.viewportWidth / baseWidth;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* Top Preview Controls Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs text-slate-300">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-white">
            <Eye className="w-4 h-4 text-indigo-400" />
            <span>Interactive Document Preview</span>
          </div>

          <span className="text-[11px] text-slate-400 hidden sm:inline">
            ({pageFields.length} {pageFields.length === 1 ? 'field' : 'fields'} on page)
          </span>
        </div>

        {/* Page Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-1 rounded-md border border-slate-700/60">
          <button
            onClick={() => onPageChange(Math.max(0, currentPageIndex - 1))}
            disabled={currentPageIndex === 0}
            className="p-1 rounded hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 hover:text-white transition-colors"
            title="Previous Page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-mono font-medium text-slate-200">
            Page {currentPageIndex + 1} of {Math.max(1, pageCount)}
          </span>
          <button
            onClick={() => onPageChange(Math.min(pageCount - 1, currentPageIndex + 1))}
            disabled={currentPageIndex >= pageCount - 1}
            className="p-1 rounded hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 hover:text-white transition-colors"
            title="Next Page"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.1).toFixed(1))))}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono px-1.5 text-slate-300 min-w-[38px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(1.8, Number((z + 0.1).toFixed(1))))}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom(1.0)}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors ml-1"
            title="Reset to 100%"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Interactive Field Selector Bar for Current Page */}
      <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-slate-300 flex items-center gap-1.5 shrink-0">
          <Crosshair className="w-3.5 h-3.5 text-indigo-400" />
          <span>Fields on Page {currentPageIndex + 1}:</span>
        </span>

        {/* Dropdown selector for fields on this page */}
        <select
          value={selectedField?.pageIndex === currentPageIndex ? (selectedField?.id || '') : ''}
          onChange={(e) => {
            const chosen = pageFields.find((f) => f.id === e.target.value);
            if (chosen) onSelectField(chosen);
          }}
          className="px-2.5 py-1 bg-slate-950 border border-slate-700 hover:border-slate-600 rounded-md text-xs text-white focus:outline-none focus:border-indigo-500 font-mono cursor-pointer"
        >
          <option value="">-- Choose field on Page {currentPageIndex + 1} --</option>
          {pageFields.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name} ({f.type}){f.type === 'Radio' ? ` [${f.onState || 'Option'}]` : ''}
            </option>
          ))}
        </select>

        {/* Quick clickable buttons/chips for fields on this page */}
        <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto max-w-full">
          {pageFields.map((f) => {
            const isSelected = selectedField?.id === f.id;
            return (
              <button
                key={f.id}
                onClick={() => onSelectField(f)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors flex items-center gap-1 cursor-pointer border ${
                  isSelected
                    ? 'bg-indigo-600 border-indigo-400 text-white font-medium shadow-xs ring-1 ring-indigo-400'
                    : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
                title={`Click to select & edit ${f.name} (${f.type})`}
              >
                <span>{f.type === 'Radio' ? '🔘' : f.type === 'Checkbox' ? '☑️' : f.type === 'Dropdown' ? '🔽' : '✍️'}</span>
                <span>{f.name}</span>
                {f.type === 'Radio' && <span className="opacity-80">[{f.onState || 'Opt'}]</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 overflow-auto p-6 flex justify-center items-start bg-slate-950 relative">
          {/* Loading Indicator */}
          {isRendering && (
            <div className="absolute top-8 z-30 flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 border border-slate-700 rounded-full text-xs text-indigo-300 shadow-xl backdrop-blur-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>Rendering PDF page content...</span>
            </div>
          )}

          {/* Render Error */}
          {renderError && (
            <div className="absolute top-8 z-30 px-4 py-2 bg-rose-950/90 border border-rose-800 text-rose-300 text-xs rounded-lg shadow-xl">
              {renderError}
            </div>
          )}

          {/* Page Canvas Container with Interactive Overlays */}
          <div
            className="relative bg-white shadow-2xl transition-transform duration-100 origin-top rounded-xs border border-slate-400/80 select-none overflow-hidden"
            style={{
              width: `${baseWidth}px`,
              height: `${baseHeight}px`,
              transform: `scale(${zoom})`,
              marginBottom: `${Math.max(40, (zoom - 1) * baseHeight * 0.5 + 40)}px`,
            }}
          >
            {/* The Actual Real PDF Rendered Canvas */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-contain pointer-events-none z-0"
              style={{
                width: `${baseWidth}px`,
                height: `${baseHeight}px`,
              }}
            />

            {/* Form Field Interactive Bounding Boxes Overlay */}
            {pageFields.map((f) => {
              const isSelected = selectedField?.id === f.id;
              // PDF coordinate origin is bottom-left (0,0); convert to top-left coordinate space:
              const top = baseHeight - f.rect.y - f.rect.height;
              const left = f.rect.x;

              return (
                <div
                  key={f.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectField(f);
                  }}
                  className={`absolute cursor-pointer transition-all flex items-center px-1.5 ${
                    isSelected
                      ? 'ring-2 ring-indigo-600 bg-indigo-500/25 z-25 shadow-md'
                      : f.type === 'Radio'
                      ? 'border border-dashed border-amber-500/80 bg-amber-400/20 hover:bg-amber-400/40 z-20'
                      : 'border border-dashed border-indigo-400/80 bg-indigo-400/15 hover:bg-indigo-400/35 z-20'
                  }`}
                  style={{
                    left: `${left}px`,
                    top: `${Math.max(0, top)}px`,
                    width: `${Math.max(16, f.rect.width)}px`,
                    height: `${Math.max(16, f.rect.height)}px`,
                  }}
                  title={`Field: ${f.name} (${f.type})${
                    f.type === 'Radio' ? `\nOption: "${f.onState || ''}"` : ''
                  }\nClick to inspect & edit`}
                >
                  {/* Selected Field Indicator Pin / Tag */}
                  {isSelected && (
                    <div className="absolute -top-6 left-0 flex items-center gap-1 bg-indigo-600 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-30 pointer-events-none">
                      <Crosshair className="w-3 h-3 text-indigo-200" />
                      <span className="font-semibold">{f.name}</span>
                      <span className="text-indigo-200">
                        [{f.type === 'Radio' ? `Radio: ${f.onState || 'Option'}` : f.type}]
                      </span>
                    </div>
                  )}

                  {/* Value overlay display */}
                  <div className="truncate text-[10px] font-mono font-medium text-slate-800 leading-tight">
                    {f.type === 'Checkbox' ? (
                      <span className="text-indigo-700 font-bold">
                        {f.value ? '☑' : '☐'}
                      </span>
                    ) : f.type === 'Radio' ? (
                      <span
                        className={
                          String(f.value) === String(f.onState)
                            ? 'text-amber-700 font-bold'
                            : 'text-slate-600 font-semibold'
                        }
                      >
                        {String(f.value) === String(f.onState) ? '🔘' : '⚪'} {f.onState || ''}
                      </span>
                    ) : (
                      <span>{String(f.value || '')}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
    </div>
  );
};
