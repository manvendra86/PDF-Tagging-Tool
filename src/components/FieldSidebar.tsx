import React, { useState } from 'react';
import {
  Upload,
  Search,
  CheckSquare,
  Type,
  ChevronDown,
  ListFilter,
  FileCheck2,
  Sparkles,
  Radio,
  FileSpreadsheet,
} from 'lucide-react';
import { FormFieldItem, FieldType } from '../types';

interface FieldSidebarProps {
  fields: FormFieldItem[];
  selectedFieldId: string | null;
  onSelectField: (field: FormFieldItem) => void;
  onUploadFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLoadSample: (template: 'general' | 'inspection' | 'w4') => void;
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
      {/* Upload and Sample Section */}
      <div className="p-3.5 border-b border-slate-800/80 space-y-2.5">
        <label className="flex items-center justify-center gap-2 w-full py-2 px-3 border border-dashed border-slate-700 hover:border-indigo-500 rounded-lg cursor-pointer bg-slate-800/40 hover:bg-slate-800/80 transition-all text-xs font-medium text-slate-300 hover:text-white">
          <Upload className="w-4 h-4 text-indigo-400" />
          <span>Upload Fillable PDF</span>
          <input type="file" accept=".pdf" className="hidden" onChange={onUploadFile} />
        </label>

        {/* Built-in Samples Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 font-medium">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Quick Sample Forms:
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => onLoadSample('general')}
              className="py-1 px-1.5 text-[11px] bg-slate-800 hover:bg-slate-700/80 text-slate-300 rounded border border-slate-700/60 truncate transition-colors cursor-pointer"
              title="Multi-page Sample Form with Radio Group, Text, Checkbox, Dropdown & ListBox"
            >
              Profile Form
            </button>
            <button
              onClick={() => onLoadSample('inspection')}
              className="py-1 px-1.5 text-[11px] bg-slate-800 hover:bg-slate-700/80 text-slate-300 rounded border border-slate-700/60 truncate transition-colors cursor-pointer"
              title="Facility Safety Audit with Radio Verdict and Checklist"
            >
              Audit Form
            </button>
            <button
              onClick={() => onLoadSample('w4')}
              className="py-1 px-1.5 text-[11px] bg-slate-800 hover:bg-slate-700/80 text-slate-300 rounded border border-slate-700/60 truncate transition-colors cursor-pointer"
              title="Employee Withholding Allowance (W-4) Form with Radio Marital Status"
            >
              W-4 Form
            </button>
          </div>
        </div>
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
                className={`w-full text-left p-3 transition-colors flex items-start gap-2.5 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-950/50 border-l-2 border-indigo-500 text-white'
                    : 'hover:bg-slate-800/50 text-slate-300'
                }`}
              >
                <div className="mt-0.5 p-1 rounded bg-slate-800/80 border border-slate-700/50">
                  {getFieldIcon(field.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold font-mono truncate text-slate-100">
                      {field.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0 bg-slate-800 px-1 rounded">
                      P.{field.pageIndex + 1}
                    </span>
                  </div>

                  {field.type === 'Radio' ? (
                    <div className="mt-1 space-y-0.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-amber-300 font-medium truncate">
                          Option: &quot;{field.onState || 'Option'}&quot;
                        </span>
                        <span className="text-[10px] font-mono px-1 rounded bg-amber-950/60 text-amber-300 border border-amber-900/50 shrink-0">
                          Button {(field.widgetIndex ?? 0) + 1}/{field.totalWidgetsInField || 1}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="text-slate-500 font-mono truncate">Group: {field.name}</span>
                        <span
                          className={
                            String(field.value) === String(field.onState)
                              ? 'text-amber-400 font-semibold'
                              : 'text-slate-500'
                          }
                        >
                          {String(field.value) === String(field.onState)
                            ? '● Selected'
                            : '○ Inactive'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2 mt-1 text-[11px] text-slate-400">
                      <span className="truncate">{field.type}</span>
                      <span className="truncate max-w-[110px] text-slate-500 font-mono text-[10px]">
                        {typeof field.value === 'boolean'
                          ? field.value
                            ? '✓ Checked'
                            : '✗ Unchecked'
                          : String(field.value || '(empty)')}
                      </span>
                    </div>
                  )}
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
