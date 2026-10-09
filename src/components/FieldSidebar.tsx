import React, { useState } from 'react';
import {
  Upload,
  Search,
  CheckSquare,
  Type,
  ChevronDown,
  ListFilter,
  FileCheck2,
  Radio,
} from 'lucide-react';
import { FormFieldItem, FieldType } from '../types';

interface FieldSidebarProps {
  fields: FormFieldItem[];
  selectedFieldId: string | null;
  onSelectField: (field: FormFieldItem) => void;
  onUploadFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLoadSample?: (template: 'general' | 'inspection' | 'w4') => void;
  filename: string;
  pageCount: number;
}

export const FieldSidebar: React.FC<FieldSidebarProps> = ({
  fields,
  selectedFieldId,
  onSelectField,
  onUploadFile,
  onLoadSample,
  filename,
  pageCount,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const filteredFields = fields.filter((f) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      f.name.toLowerCase().includes(q) ||
      f.type.toLowerCase().includes(q) ||
      (f.onState && f.onState.toLowerCase().includes(q)) ||
      String(f.value).toLowerCase().includes(q);
    const matchesType = typeFilter === 'ALL' || f.type.toUpperCase() === typeFilter;
    return matchesSearch && matchesType;
  });

  const getFieldIcon = (type: FieldType) => {
    switch (type) {
      case 'Checkbox':
        return <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Dropdown':
        return <ChevronDown className="w-3.5 h-3.5 text-sky-400" />;
      case 'ListBox':
        return <ListFilter className="w-3.5 h-3.5 text-purple-400" />;
      case 'Radio':
        return <Radio className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Type className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  return (
    <aside className="w-80 shrink-0 border-r border-slate-800 bg-slate-900/95 flex flex-col h-[calc(100vh-57px)]">
      {/* Upload Section */}
      <div className="p-3.5 border-b border-slate-800/80">
        <label className="flex items-center justify-center gap-2 w-full py-2.5 px-3 border border-dashed border-slate-700 hover:border-indigo-500 rounded-lg cursor-pointer bg-slate-800/40 hover:bg-slate-800/80 transition-all text-xs font-medium text-slate-300 hover:text-white group">
          <Upload className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
          <span>Upload Fillable PDF</span>
          <input type="file" accept=".pdf" className="hidden" onChange={onUploadFile} />
        </label>
      </div>

      {/* Search & Type Filter */}
      <div className="p-3 border-b border-slate-800/80 space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search fields by name, option, type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950/70 border border-slate-800 rounded-md text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Filter Pills / Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none text-[11px]">
          {['ALL', 'TEXT', 'CHECKBOX', 'RADIO', 'DROPDOWN', 'LISTBOX'].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-2 py-0.5 rounded transition-colors whitespace-nowrap cursor-pointer ${
                typeFilter === t
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'bg-slate-800/70 text-slate-400 hover:text-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Field List Dropdown */}
      <div className="p-3 bg-slate-900/90 border-b border-slate-800 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
          <span className="flex items-center gap-1.5">
            <ListFilter className="w-3.5 h-3.5 text-indigo-400" />
            <span>Field List Dropdown:</span>
          </span>
          <span className="text-[10px] text-indigo-400 font-mono">{filteredFields.length} fields</span>
        </div>
        <select
          value={selectedFieldId || ''}
          onChange={(e) => {
            const chosen = fields.find((f) => f.id === e.target.value);
            if (chosen) onSelectField(chosen);
          }}
          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 rounded-md text-xs text-white focus:outline-none font-mono cursor-pointer transition-colors"
        >
          {filteredFields.length === 0 ? (
            <option value="">No matching fields</option>
          ) : (
            filteredFields.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} — {f.type} (Page {f.pageIndex + 1})
              </option>
            ))
          )}
        </select>
      </div>

      {/* Field List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
        {filteredFields.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 space-y-1">
            <p>No matching fields found.</p>
            <p className="text-[11px] text-slate-600">Try clearing your search query or uploading a fillable PDF.</p>
          </div>
        ) : (
          filteredFields.map((field) => {
            const isSelected = field.id === selectedFieldId;
            return (
              <button
                key={field.id}
                onClick={() => onSelectField(field)}
                className={`w-full text-left p-3 transition-colors flex items-start gap-2.5 cursor-pointer group ${
                  isSelected
                    ? 'bg-indigo-950/60 border-l-3 border-indigo-500 text-white'
                    : 'hover:bg-slate-800/50 text-slate-300'
                }`}
              >
                {/* Visual Icon */}
                <div
                  className={`mt-0.5 p-1.5 rounded border shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-indigo-900/60 border-indigo-500/60'
                      : 'bg-slate-800/80 border-slate-700/50 group-hover:border-slate-600'
                  }`}
                >
                  {getFieldIcon(field.type)}
                </div>

                {/* Field Details: Name, under that Field Type & Page Number */}
                <div className="flex-1 min-w-0">
                  {/* Row 1: Name of the field */}
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-xs font-semibold font-mono text-slate-100 truncate">
                      {field.name}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60 shrink-0 font-medium">
                      Page {field.pageIndex + 1}
                    </span>
                  </div>

                  {/* Row 2: Under that field type badge & metadata */}
                  <div className="mt-1 flex items-center justify-between gap-1.5 text-[11px]">
                    <span
                      className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium ${
                        field.type === 'Radio'
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-800/50'
                          : field.type === 'Checkbox'
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50'
                          : field.type === 'Dropdown' || field.type === 'ListBox'
                          ? 'bg-sky-950/80 text-sky-300 border border-sky-800/50'
                          : 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/50'
                      }`}
                    >
                      {field.type}
                    </span>

                    {/* Secondary detail (value preview / option name) */}
                    <span className="text-[10px] font-mono text-slate-400 truncate max-w-[130px] text-right">
                      {field.type === 'Radio' ? (
                        <span className="text-amber-300/90 truncate">
                          &quot;{field.onState || 'Option'}&quot; #{((field.widgetIndex ?? 0) + 1)}/{field.totalWidgetsInField || 1}
                        </span>
                      ) : typeof field.value === 'boolean' ? (
                        field.value ? '✓ Checked' : '○ Unchecked'
                      ) : (
                        String(field.value || '(empty)')
                      )}
                    </span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-[11px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-1.5 truncate">
          <FileCheck2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="truncate" title={filename}>
            {filename}
          </span>
        </div>
        <span className="tabular-nums font-mono shrink-0 text-slate-400">
          {fields.length} {fields.length === 1 ? 'widget' : 'widgets'} · {pageCount}p
        </span>
      </div>
    </aside>
  );
};
