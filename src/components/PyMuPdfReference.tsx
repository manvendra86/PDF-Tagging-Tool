import React from 'react';
import { BookOpen, Code, Database, Eye, CheckCircle2 } from 'lucide-react';

export const PyMuPdfReference: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto p-8 bg-slate-950 text-slate-200">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold uppercase tracking-wider">
            <BookOpen className="w-4 h-4" /> PyMuPDF Technical Reference
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">
            PyMuPDF (fitz) AcroForm & Widget Specifications
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Architectural breakdown of PDF form widgets, property fields, and rendering mechanics used in the application.
          </p>
        </div>

        {/* Widget Types Table */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-400" />
            PyMuPDF Widget Constants & Types
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2 px-3 font-semibold">Constant Name</th>
                  <th className="py-2 px-3 font-semibold">Type ID</th>
                  <th className="py-2 px-3 font-semibold">Form Field UI</th>
                  <th className="py-2 px-3 font-semibold">Primary Properties</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                <tr>
                  <td className="py-2 px-3 text-indigo-300">fitz.PDF_WIDGET_TYPE_TEXT</td>
                  <td className="py-2 px-3">1</td>
                  <td className="py-2 px-3 font-sans">Text Input / Textarea</td>
                  <td className="py-2 px-3">field_name, field_value, default_value</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-indigo-300">fitz.PDF_WIDGET_TYPE_CHECKBOX</td>
                  <td className="py-2 px-3">2</td>
                  <td className="py-2 px-3 font-sans">Checkbox</td>
                  <td className="py-2 px-3">field_value (bool), button_caption</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-indigo-300">fitz.PDF_WIDGET_TYPE_RADIOBUTTON</td>
                  <td className="py-2 px-3">3</td>
                  <td className="py-2 px-3 font-sans">Radio Button</td>
                  <td className="py-2 px-3">field_value, button_caption (on-state)</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-indigo-300">fitz.PDF_WIDGET_TYPE_COMBOBOX</td>
                  <td className="py-2 px-3">4</td>
                  <td className="py-2 px-3 font-sans">Dropdown Menu</td>
                  <td className="py-2 px-3">choice_values (list[str]), field_value</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-indigo-300">fitz.PDF_WIDGET_TYPE_LISTBOX</td>
                  <td className="py-2 px-3">5</td>
                  <td className="py-2 px-3 font-sans">List Box Selection</td>
                  <td className="py-2 px-3">choice_values (list[str]), field_value</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-indigo-300">fitz.PDF_WIDGET_TYPE_BUTTON</td>
                  <td className="py-2 px-3">6</td>
                  <td className="py-2 px-3 font-sans">Push Button Action</td>
                  <td className="py-2 px-3">button_caption</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-indigo-300">fitz.PDF_WIDGET_TYPE_SIGNATURE</td>
                  <td className="py-2 px-3">7</td>
                  <td className="py-2 px-3 font-sans">Digital Signature</td>
                  <td className="py-2 px-3">field_name, rect</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Code Pattern Snippets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-emerald-400" />
              1. Reading Fields Across Pages
            </h4>
            <pre className="p-3 bg-slate-950 rounded-lg text-[11px] font-mono text-emerald-300 overflow-x-auto">
{`doc = fitz.open(stream=pdf_bytes, filetype="pdf")

for page_idx in range(len(doc)):
    page = doc[page_idx]
    for widget in page.widgets():
        name = widget.field_name
        w_type = widget.field_type
        value = widget.field_value
        choices = widget.choice_values`}
            </pre>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-indigo-400" />
              2. Rendering Page Pixmap & Highlight
            </h4>
            <pre className="p-3 bg-slate-950 rounded-lg text-[11px] font-mono text-indigo-300 overflow-x-auto">
{`page = doc[page_idx]
# High-DPI 2.0x zoom
pix = page.get_pixmap(
    matrix=fitz.Matrix(2.0, 2.0),
    alpha=False
)
img = Image.open(io.BytesIO(pix.tobytes("png")))
# Draw highlight rectangle around widget.rect`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
