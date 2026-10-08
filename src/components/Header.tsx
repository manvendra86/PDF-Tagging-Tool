import React from 'react';
import { FileText, Code2, Terminal, BookOpen, Download } from 'lucide-react';

interface HeaderProps {
  activeTab: 'editor' | 'python' | 'guide' | 'docs';
  setActiveTab: (tab: 'editor' | 'python' | 'guide' | 'docs') => void;
  onDownloadPython: () => void;
  onDownloadPDF?: () => void;
  hasPdfLoaded: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onDownloadPython,
  onDownloadPDF,
  hasPdfLoaded,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3.5 bg-slate-900 border-b border-slate-800 text-slate-100">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm font-bold text-sm tracking-tighter">
          Py
        </div>
        <div className="flex flex-col">
          <span className="text-base font-semibold tracking-tight text-white leading-none">
            PyMuPDF AcroForm Studio
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5">
            Interactive PDF Field Inspector & Streamlit Engine
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden md:flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 text-xs font-medium">
        <button
          onClick={() => setActiveTab('editor')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
            activeTab === 'editor'
              ? 'bg-slate-700 text-white shadow-xs font-semibold'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-indigo-400" />
          Interactive Studio
        </button>

        <button
          onClick={() => setActiveTab('python')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
            activeTab === 'python'
              ? 'bg-slate-700 text-white shadow-xs font-semibold'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <Code2 className="w-3.5 h-3.5 text-emerald-400" />
          Python Source (app.py)
        </button>

        <button
          onClick={() => setActiveTab('guide')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
            activeTab === 'guide'
              ? 'bg-slate-700 text-white shadow-xs font-semibold'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <Terminal className="w-3.5 h-3.5 text-amber-400" />
          Terminal Setup & Run
        </button>

        <button
          onClick={() => setActiveTab('docs')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
            activeTab === 'docs'
              ? 'bg-slate-700 text-white shadow-xs font-semibold'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-sky-400" />
          PyMuPDF API Specs
        </button>
      </nav>

      {/* Zone 3: Primary Action buttons */}
      <div className="flex items-center gap-2">
        {hasPdfLoaded && onDownloadPDF && (
          <button
            onClick={onDownloadPDF}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 hover:text-white transition-colors"
            title="Download currently active modified PDF"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            Export PDF
          </button>
        )}
        <button
          onClick={onDownloadPython}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 shadow-sm transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Download app.py
        </button>
      </div>
    </header>
  );
};
