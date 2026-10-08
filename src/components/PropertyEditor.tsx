import React, { useState, useEffect } from 'react';
import {
  Save,
  Download,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  Check,
  X,
  FileDown,
  Radio as RadioIcon,
  CheckSquare,
  Sparkles,
} from 'lucide-react';
import { FormFieldItem } from '../types';

interface PropertyEditorProps {
  field: FormFieldItem | null;
  allFields?: FormFieldItem[];
  onFieldLiveChange: (fieldId: string, updatedProps: Partial<FormFieldItem>) => void;
  onSaveField: (
    fieldInfo: {
      fieldId: string;
      fieldIndex: number;
      widgetIndex: number;
      originalName: string;
    },
    updatedData: {
      newName: string;
      newValue: string | boolean;
      newExportValue?: string;
      newOptions?: string[];
      newDefault?: string;
      isReadOnly?: boolean;
      isRequired?: boolean;
    }
  ) => void;
  onSelectSiblingField?: (field: FormFieldItem) => void;
  onDownloadPDF: () => void;
  isDirty: boolean;
  saveSuccessMessage: string | null;
}

export const PropertyEditor: React.FC<PropertyEditorProps> = ({
  field,
  allFields = [],
  onFieldLiveChange,
  onSaveField,
  onSelectSiblingField,
  onDownloadPDF,
  isDirty,
  saveSuccessMessage,
}) => {
  // Local form state
  const [name, setName] = useState(field?.name || '');
  const [value, setValue] = useState<string | boolean>(field?.value ?? '');
  const [exportValue, setExportValue] = useState(field?.onState || '');
  const [defaultValue, setDefaultValue] = useState(field?.defaultValue || '');
  const [optionsStr, setOptionsStr] = useState(field?.options ? field.options.join(', ') : '');
  const [isReadOnly, setIsReadOnly] = useState(field?.isReadOnly || false);
  const [isRequired, setIsRequired] = useState(field?.isRequired || false);

  // Sync state whenever selected field changes
  useEffect(() => {
    if (!field) return;
    setName(field.name);
    setValue(field.value);
    setExportValue(
      field.onState ||
        (field.type === 'Checkbox' ? 'Yes' : `Option_${(field.widgetIndex ?? 0) + 1}`)
    );
    setDefaultValue(field.defaultValue || '');
    setOptionsStr(field.options ? field.options.join(', ') : '');
    setIsReadOnly(field.isReadOnly || false);
    setIsRequired(field.isRequired || false);
  }, [
    field?.id,
    field?.name,
    field?.value,
    field?.onState,
    field?.widgetIndex,
    field?.defaultValue,
    field?.options,
    field?.isReadOnly,
    field?.isRequired,
  ]);

  if (!field) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
        <Sliders className="w-12 h-12 stroke-[1.5] text-slate-600 mb-3" />
        <h3 className="text-sm font-semibold text-slate-300">No Field Selected</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Select an AcroForm field from the left sidebar or click directly on any highlighted box in the preview to edit its properties.
        </p>
      </div>
    );
  }

  // Find other buttons in the same radio group if this is a radio field
  const siblingRadioButtons =
    field.type === 'Radio'
      ? allFields.filter(
          (f) =>
            f.type === 'Radio' &&
            (f.fieldIndex === field.fieldIndex || f.originalName === field.originalName)
        )
      : [];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedOptions = optionsStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    onSaveField(
      {
        fieldId: field.id,
        fieldIndex: field.fieldIndex,
        widgetIndex: field.widgetIndex ?? 0,
        originalName: field.originalName,
      },
      {
        newName: name.trim(),
        newValue: value,
        newExportValue: exportValue.trim() || undefined,
        newOptions: parsedOptions.length > 0 ? parsedOptions : undefined,
        newDefault: defaultValue,
        isReadOnly,
        isRequired,
      }
    );
  };

  const isRadioActive = field.type === 'Radio' && String(value) === String(exportValue);

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-900/60 border-r border-slate-800">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white">Field Property Editor</h2>
            <span
              className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border ${
                field.type === 'Radio'
                  ? 'bg-amber-950/60 text-amber-300 border-amber-700/50'
                  : field.type === 'Checkbox'
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50'
                  : 'bg-indigo-900/60 text-indigo-300 border-indigo-700/50'
              }`}
            >
              {field.type}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Targeting{' '}
            {field.type === 'Radio'
              ? `Radio Button ${(field.widgetIndex ?? 0) + 1} of ${
                  field.totalWidgetsInField || siblingRadioButtons.length || 1
                } on `
              : 'widget on '}
            <span className="text-slate-200 font-medium">Page {field.pageIndex + 1}</span>
          </p>
        </div>

        {isDirty && (
          <span className="text-[11px] text-amber-400 font-medium bg-amber-950/60 border border-amber-800/80 px-2 py-0.5 rounded flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Unsaved Changes
          </span>
        )}
      </div>

      {saveSuccessMessage && (
        <div className="p-2.5 rounded-lg bg-emerald-950/70 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* Sibling Radio Buttons Navigator in this Group */}
      {field.type === 'Radio' && siblingRadioButtons.length > 1 && (
        <div className="p-3 rounded-lg bg-slate-950/60 border border-amber-900/40 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-amber-300 flex items-center gap-1.5">
              <RadioIcon className="w-3.5 h-3.5 text-amber-400" />
              Radio Group Options ({siblingRadioButtons.length} buttons):
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Group: {field.name}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {siblingRadioButtons.map((sibling, idx) => {
              const isCurrent = sibling.id === field.id;
              const isSelectedVal = String(sibling.value) === String(sibling.onState);
              return (
                <button
                  key={sibling.id}
                  type="button"
                  onClick={() => onSelectSiblingField && onSelectSiblingField(sibling)}
                  className={`text-xs px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition-all ${
                    isCurrent
                      ? 'bg-amber-600 text-white border-amber-500 font-semibold shadow-xs'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                  title={`Click to edit Button ${idx + 1} (Export Value: ${sibling.onState || 'Option'})`}
                >
                  <span className="text-[10px] opacity-75">{isSelectedVal ? '●' : '○'}</span>
                  <span>
                    Button {idx + 1}: &quot;{sibling.onState || `Option ${idx + 1}`}&quot;
                  </span>
                  {isSelectedVal && (
                    <span className="text-[9px] bg-amber-800/80 px-1 rounded uppercase tracking-wider font-bold">
                      Active
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Editor Form */}
      <form onSubmit={handleSave} className="space-y-4">
        {/* 1. Field Identifier / Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>
              {field.type === 'Radio' ? 'Radio Group Name Identifier' : 'Field Name Identifier'}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">AcroForm /T</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              const newName = e.target.value;
              setName(newName);
              if (field) {
                onFieldLiveChange(field.id, { name: newName });
              }
            }}
            className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
            placeholder="e.g. preferred_contact"
            required
          />
          <p className="text-[11px] text-slate-500">
            {field.type === 'Radio'
              ? 'Group identifier shared by all radio buttons in this group. Renaming will update the group name.'
              : 'Internal key used to identify and populate this field across PDF parsers.'}
          </p>
        </div>

        {/* 2. Values & States based on Field Type */}
        <div className="p-3.5 rounded-lg bg-slate-950/50 border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200">Field Value & State</span>
            <span className="text-[10px] text-slate-400 font-mono">PyMuPDF .field_value</span>
          </div>

          {/* RADIO BUTTON SPECIFIC EDITOR */}
          {field.type === 'Radio' && (
            <div className="space-y-3">
              {/* Export Value (On-State) Input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-amber-300 flex items-center justify-between">
                  <span>Export Value (On-State / Button Value)</span>
                  <span className="text-[10px] text-slate-500 font-mono">/Opt or /AP</span>
                </label>
                <input
                  type="text"
                  value={exportValue}
                  onChange={(e) => {
                    const newExp = e.target.value;
                    setExportValue(newExp);
                    if (isRadioActive) {
                      setValue(newExp);
                    }
                    if (field) {
                      onFieldLiveChange(field.id, {
                        onState: newExp,
                        value: isRadioActive ? newExp : value,
                      });
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-900 border border-amber-900/50 focus:border-amber-500 rounded-md text-xs font-mono text-amber-100 focus:outline-none"
                  placeholder="e.g. Email, CreditCard, Standard"
                  required
                />
                <p className="text-[11px] text-slate-400">
                  The value stored and transmitted when this specific radio button is selected.
                </p>
              </div>

              {/* Selection State / Toggle */}
              <div className="pt-2 border-t border-slate-800/70 space-y-2">
                <label className="text-xs font-medium text-slate-300">
                  Selection State for this Radio Button:
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setValue(exportValue);
                      if (field) {
                        onFieldLiveChange(field.id, { value: exportValue });
                      }
                    }}
                    className={`flex-1 py-2 px-3 rounded-md text-xs font-medium flex items-center justify-center gap-2 border transition-all ${
                      isRadioActive
                        ? 'bg-amber-600/30 border-amber-500 text-amber-200'
                        : 'bg-slate-900 border-slate-700 hover:border-slate-500 text-slate-300'
                    }`}
                  >
                    <span className="text-sm">{isRadioActive ? '🔘' : '⚪'}</span>
                    <span>{isRadioActive ? 'Selected (Active)' : 'Click to Select this Button'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Current Radio Group selected value:{' '}
                  <span className="font-mono text-slate-300">
                    {String(value) || '(none)'}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* CHECKBOX SPECIFIC EDITOR */}
          {field.type === 'Checkbox' && (
            <div className="space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-200">
                <input
                  type="checkbox"
                  checked={Boolean(value)}
                  onChange={(e) => {
                    const newVal = e.target.checked;
                    setValue(newVal);
                    if (field) onFieldLiveChange(field.id, { value: newVal });
                  }}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-700 bg-slate-900"
                />
                <span className="font-medium">
                  {value ? 'Active (Checked / True)' : 'Inactive (Unchecked / False)'}
                </span>
              </label>

              {/* Editable Checkbox Export Value */}
              <div className="pt-2 border-t border-slate-800/60 space-y-1">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>On-State Export Value</span>
                  <span className="text-[10px] text-slate-500 font-mono">/AS</span>
                </label>
                <input
                  type="text"
                  value={exportValue}
                  onChange={(e) => {
                    const newExp = e.target.value;
                    setExportValue(newExp);
                    if (field) onFieldLiveChange(field.id, { onState: newExp });
                  }}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Yes"
                />
                <p className="text-[11px] text-slate-500">
                  Export value transmitted when this checkbox is checked (default: &apos;Yes&apos;).
                </p>
              </div>
            </div>
          )}

          {/* DROPDOWN SPECIFIC EDITOR */}
          {field.type === 'Dropdown' && (
            <div className="space-y-2.5">
              <label className="text-[11px] font-medium text-slate-400">Current Selected Value:</label>
              <select
                value={String(value)}
                onChange={(e) => {
                  const newVal = e.target.value;
                  setValue(newVal);
                  if (field) onFieldLiveChange(field.id, { value: newVal });
                }}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {optionsStr
                  .split(',')
                  .map((o) => o.trim())
                  .filter(Boolean)
                  .map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* LISTBOX SPECIFIC EDITOR */}
          {field.type === 'ListBox' && (
            <div className="space-y-2.5">
              <label className="text-[11px] font-medium text-slate-400">Selected List Item:</label>
              <select
                value={String(value)}
                onChange={(e) => {
                  const newVal = e.target.value;
                  setValue(newVal);
                  if (field) onFieldLiveChange(field.id, { value: newVal });
                }}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {optionsStr
                  .split(',')
                  .map((o) => o.trim())
                  .filter(Boolean)
                  .map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* TEXT SPECIFIC EDITOR */}
          {field.type === 'Text' && (
            <div className="space-y-1.5">
              <textarea
                value={String(value)}
                onChange={(e) => {
                  const newVal = e.target.value;
                  setValue(newVal);
                  if (field) onFieldLiveChange(field.id, { value: newVal });
                }}
                rows={3}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-md text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
                placeholder="Enter field value text..."
              />
            </div>
          )}
        </div>

        {/* 3. Dropdown / List Options Editor */}
        {(field.type === 'Dropdown' || field.type === 'ListBox') && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Dropdown / List Options</span>
              <span className="text-[10px] text-slate-500">Comma-separated</span>
            </label>
            <textarea
              value={optionsStr}
              onChange={(e) => {
                const newOptsStr = e.target.value;
                setOptionsStr(newOptsStr);
                const parsed = newOptsStr
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean);
                if (field) onFieldLiveChange(field.id, { options: parsed });
              }}
              rows={2}
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              placeholder="e.g. Option 1, Option 2, Option 3"
            />
            <p className="text-[11px] text-slate-500">
              Enter options separated by commas. These will populate the choices array.
            </p>
          </div>
        )}

        {/* 4. Default Value (/DV) */}
        {field.type === 'Text' && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Default Value</span>
              <span className="text-[10px] text-slate-500 font-mono">AcroForm /DV</span>
            </label>
            <input
              type="text"
              value={defaultValue}
              onChange={(e) => {
                const newDef = e.target.value;
                setDefaultValue(newDef);
                if (field) onFieldLiveChange(field.id, { defaultValue: newDef });
              }}
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs font-sans text-slate-200 focus:outline-none focus:border-indigo-500"
              placeholder="e.g. Enter value..."
            />
            <p className="text-[11px] text-slate-500">
              The initial text loaded when form is reset or first opened.
            </p>
          </div>
        )}

        {/* 5. Field Flags (Read-Only & Required) */}
        <div className="p-3.5 rounded-lg bg-slate-950/40 border border-slate-800/80 space-y-2.5">
          <span className="text-xs font-semibold text-slate-300 block">Field Flags & Permissions</span>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={isReadOnly}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIsReadOnly(checked);
                  if (field) onFieldLiveChange(field.id, { isReadOnly: checked });
                }}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-700 bg-slate-900"
              />
              <span>Read-Only</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={isRequired}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIsRequired(checked);
                  if (field) onFieldLiveChange(field.id, { isRequired: checked });
                }}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-700 bg-slate-900"
              />
              <span>Required</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 space-y-2">
          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Field Properties & Update PDF</span>
          </button>

          <button
            type="button"
            onClick={onDownloadPDF}
            className="w-full py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center justify-center gap-2 border border-slate-700/80 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Download Modified PDF Document</span>
          </button>
        </div>
      </form>
    </div>
  );
};
