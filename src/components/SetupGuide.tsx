import React, { useState } from 'react';
import { Terminal, Copy, Check, Play, ShieldAlert, Cpu, CheckCircle2 } from 'lucide-react';

export const SetupGuide: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyCommand = (cmd: string, index: number) => {
    navigator.clipboard.writeText(cmd);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-slate-950 text-slate-200">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Terminal className="w-4 h-4" /> Local Development Setup
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">
            Running the PyMuPDF & Streamlit Studio Locally
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Follow this 4-step quickstart to run the complete AcroForm inspector application on your workstation.
          </p>
        </div>

        {/* Step Cards */}
        <div className="space-y-6">
          {/* Step 1 */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <h3 className="text-sm font-semibold text-white">
                  Create and Activate a Python Virtual Environment
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">Python 3.10+</span>
            </div>
            <p className="text-xs text-slate-400">
              Isolate your dependencies to avoid conflicts with system packages.
            </p>

            <div className="space-y-2 pt-1">
              <div className="text-[11px] text-slate-400 font-medium">macOS / Linux:</div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400">
                <code>python3 -m venv venv && source venv/bin/activate</code>
                <button
                  onClick={() =>
                    copyCommand('python3 -m venv venv && source venv/bin/activate', 1)
                  }
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  title="Copy command"
                >
                  {copiedIndex === 1 ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="text-[11px] text-slate-400 font-medium pt-1">Windows (PowerShell):</div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400">
                <code>python -m venv venv; .\venv\Scripts\Activate.ps1</code>
                <button
                  onClick={() =>
                    copyCommand('python -m venv venv; .\\venv\\Scripts\\Activate.ps1', 2)
                  }
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  title="Copy command"
                >
                  {copiedIndex === 2 ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <h3 className="text-sm font-semibold text-white">
                  Install Required Dependencies
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">pip install</span>
            </div>
            <p className="text-xs text-slate-400">
              Install the exact tested versions: <code className="text-indigo-300">streamlit==1.38.0</code>, <code className="text-indigo-300">pymupdf==1.24.9</code>, and <code className="text-indigo-300">Pillow&gt;=10.0.0</code>.
            </p>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400">
              <code>pip install -r requirements.txt</code>
              <button
                onClick={() => copyCommand('pip install -r requirements.txt', 3)}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Copy command"
              >
                {copiedIndex === 3 ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                  3
                </span>
                <h3 className="text-sm font-semibold text-white">
                  Launch the Streamlit Application
                </h3>
              </div>
              <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                <Play className="w-3 h-3" /> Live UI
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Run Streamlit directly from your terminal. It will open automatically in your browser at <code className="text-indigo-300">http://localhost:8501</code>.
            </p>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400">
              <code>streamlit run app.py</code>
              <button
                onClick={() => copyCommand('streamlit run app.py', 4)}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Copy command"
              >
                {copiedIndex === 4 ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                4
              </span>
              <h3 className="text-sm font-semibold text-white">
                Core Interactive Workflow in Streamlit
              </h3>
            </div>
            <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
              <li>
                <strong className="text-white">Upload or Sample:</strong> Drag and drop any fillable PDF or click <em>Load Sample Fillable PDF</em>.
              </li>
              <li>
                <strong className="text-white">Sidebar Selector:</strong> All widgets across all pages appear in the sidebar with page numbers and field types.
              </li>
              <li>
                <strong className="text-white">Property Editor:</strong> Modify the field name identifier, export states/checkbox values, choice values, or default text.
              </li>
              <li>
                <strong className="text-white">Visual Preview:</strong> PyMuPDF draws an indigo bounding box around the active field on the page preview image.
              </li>
              <li>
                <strong className="text-white">Save & Download:</strong> Click <em>Save Field Properties & Update PDF</em>, then download the finalized document.
              </li>
            </ul>
          </div>
        </div>

        {/* Troubleshooting & Production Notes */}
        <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
            <ShieldAlert className="w-4 h-4" />
            <span>Helpful PyMuPDF Tips & Troubleshooting</span>
          </div>
          <div className="text-xs text-slate-400 space-y-2">
            <p>
              • <strong>Encrypted PDFs:</strong> If a PDF has an owner or user password, call <code className="text-slate-300 font-mono">doc.authenticate(password)</code> before reading widgets.
            </p>
            <p>
              • <strong>Committing Widget Changes:</strong> PyMuPDF requires calling <code className="text-slate-300 font-mono">widget.update()</code> before saving the document with <code className="text-slate-300 font-mono">doc.tobytes(garbage=3, deflate=True)</code>.
            </p>
            <p>
              • <strong>Non-Interactive Forms (Flat PDFs):</strong> Scanned documents without digital AcroForms will return empty list from <code className="text-slate-300 font-mono">page.widgets()</code>. The app provides a sample generator for immediate testing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
