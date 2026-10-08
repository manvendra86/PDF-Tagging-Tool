import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { FieldSidebar } from './components/FieldSidebar';
import { PropertyEditor } from './components/PropertyEditor';
import { PagePreview } from './components/PagePreview';
import { PythonSourceViewer } from './components/PythonSourceViewer';
import { SetupGuide } from './components/SetupGuide';
import { PyMuPdfReference } from './components/PyMuPdfReference';
import { FormFieldItem } from './types';
import { createSampleForm, parsePdfFields, updateFieldInPDFBytes } from './lib/pdfHelper';

export default function App() {
  const [activeTab, setActiveTab] = useState<'editor' | 'python' | 'guide' | 'docs'>('editor');
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [filename, setFilename] = useState<string>('sample_fillable_form.pdf');
  const [fields, setFields] = useState<FormFieldItem[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [pageCount, setPageCount] = useState<number>(1);
  const [pageSize, setPageSize] = useState<{ width: number; height: number }>({ width: 595, height: 842 });
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Initialize with general sample fillable form on mount
  useEffect(() => {
    loadSampleForm('general');
  }, []);

  const loadSampleForm = async (template: 'general' | 'inspection' | 'w4') => {
    try {
      const sample = await createSampleForm(template);
      setPdfBytes(sample.bytes);
      setFilename(sample.filename);

      const parsed = await parsePdfFields(sample.bytes);
      setFields(parsed.fields);
      setPageCount(parsed.pageCount);
      setPageSize(parsed.pageSize);

      if (parsed.fields.length > 0) {
        setSelectedFieldId(parsed.fields[0].id);
        setCurrentPageIndex(parsed.fields[0].pageIndex);
      } else {
        setSelectedFieldId(null);
        setCurrentPageIndex(0);
      }
      setIsDirty(false);
      setSaveSuccessMessage(`Loaded ${sample.filename} with ${parsed.fields.length} interactive fields.`);
      setTimeout(() => setSaveSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to load sample form:', err);
    }
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      setPdfBytes(bytes);
      setFilename(file.name);

      const parsed = await parsePdfFields(bytes);
      setFields(parsed.fields);
      setPageCount(parsed.pageCount);
      setPageSize(parsed.pageSize);

      if (parsed.fields.length > 0) {
        setSelectedFieldId(parsed.fields[0].id);
        setCurrentPageIndex(parsed.fields[0].pageIndex);
      } else {
        setSelectedFieldId(null);
        setCurrentPageIndex(0);
      }
      setIsDirty(false);
      setSaveSuccessMessage(`Uploaded '${file.name}' with ${parsed.fields.length} detected fields.`);
      setTimeout(() => setSaveSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to parse uploaded PDF:', err);
      alert('Could not read interactive fields from this PDF. It may be encrypted or contain no AcroForms.');
    }
  };

  const handleSelectField = (field: FormFieldItem) => {
    setSelectedFieldId(field.id);
    setCurrentPageIndex(field.pageIndex);
    setIsDirty(false);
    setSaveSuccessMessage(null);
  };

  const handleLiveFieldChange = (
    fieldId: string,
    updatedProps: Partial<FormFieldItem>
  ) => {
    setIsDirty(true);
    setFields((prevFields) => {
      const target = prevFields.find((f) => f.id === fieldId);
      if (!target) return prevFields;

      return prevFields.map((f) => {
        // If updating the field name, sync across all widgets belonging to the same field group!
        if (updatedProps.name && f.fieldIndex === target.fieldIndex) {
          return {
            ...f,
            ...updatedProps,
            name: updatedProps.name,
            onState: f.id === fieldId ? (updatedProps.onState ?? f.onState) : f.onState,
            value: updatedProps.value !== undefined ? updatedProps.value : f.value,
          };
        }

        // If this is a radio button group and value changed (option selected), sync value to siblings
        if (target.type === 'Radio' && updatedProps.value !== undefined && f.fieldIndex === target.fieldIndex) {
          return {
            ...f,
            value: updatedProps.value,
            ...(f.id === fieldId ? updatedProps : {}),
          };
        }

        if (f.id === fieldId) {
          return { ...f, ...updatedProps };
        }
        return f;
      });
    });
  };

  const handleSaveField = async (
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
  ) => {
    if (!pdfBytes) return;

    try {
      // 1. Immediately update local state representation with newName and new values
      setFields((prevFields) =>
        prevFields.map((f) => {
          if (f.fieldIndex === fieldInfo.fieldIndex) {
            const isThisWidget = f.widgetIndex === fieldInfo.widgetIndex;
            return {
              ...f,
              name: updatedData.newName,
              originalName: updatedData.newName,
              value: updatedData.newValue,
              onState:
                isThisWidget && updatedData.newExportValue !== undefined
                  ? updatedData.newExportValue
                  : f.onState,
              defaultValue: updatedData.newDefault ?? f.defaultValue,
              options: updatedData.newOptions ?? f.options,
              isReadOnly: updatedData.isReadOnly ?? f.isReadOnly,
              isRequired: updatedData.isRequired ?? f.isRequired,
            };
          }
          return f;
        })
      );

      // 2. Commit updates to PDF document bytes with robust targeting
      const updatedBytes = await updateFieldInPDFBytes(
        pdfBytes,
        {
          fieldIndex: fieldInfo.fieldIndex,
          widgetIndex: fieldInfo.widgetIndex,
          originalName: fieldInfo.originalName,
        },
        updatedData
      );
      setPdfBytes(updatedBytes);

      // 3. Re-parse fields to synchronize geometries and internal indexes
      const reParsed = await parsePdfFields(updatedBytes);
      setFields(reParsed.fields);

      // Re-select the updated widget accurately
      const matched =
        reParsed.fields.find(
          (f) =>
            (f.name === updatedData.newName || f.originalName === updatedData.newName) &&
            f.widgetIndex === fieldInfo.widgetIndex
        ) ||
        reParsed.fields.find((f) => f.name === updatedData.newName) ||
        (reParsed.fields[fieldInfo.fieldIndex] ?? null);

      if (matched) {
        setSelectedFieldId(matched.id);
      }

      setIsDirty(false);
      setSaveSuccessMessage(
        updatedData.newExportValue
          ? `Field '${updatedData.newName}' updated (Export Value: '${updatedData.newExportValue}')!`
          : `Field '${updatedData.newName}' updated successfully!`
      );
      setTimeout(() => setSaveSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Failed to update field:', err);
    }
  };

  const handleDownloadPDF = () => {
    if (!pdfBytes) return;
    const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `modified_${filename}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPython = () => {
    setActiveTab('python');
  };

  const selectedField = fields.find((f) => f.id === selectedFieldId) || null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top Header Contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onDownloadPython={handleDownloadPython}
        onDownloadPDF={pdfBytes ? handleDownloadPDF : undefined}
        hasPdfLoaded={Boolean(pdfBytes)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'editor' && (
          <div className="flex-1 flex w-full h-[calc(100vh-57px)] overflow-hidden">
            {/* Sidebar: Navigation & Detection */}
            <FieldSidebar
              fields={fields}
              selectedFieldId={selectedFieldId}
              onSelectField={handleSelectField}
              onUploadFile={handleUploadFile}
              onLoadSample={loadSampleForm}
              filename={filename}
              pageCount={pageCount}
            />

            {/* Middle: Interactive Property Editor Panel */}
            <div className="w-[420px] shrink-0 flex flex-col h-full bg-slate-900/60">
              <PropertyEditor
                field={selectedField}
                allFields={fields}
                onFieldLiveChange={handleLiveFieldChange}
                onSaveField={handleSaveField}
                onSelectSiblingField={handleSelectField}
                onDownloadPDF={handleDownloadPDF}
                isDirty={isDirty}
                saveSuccessMessage={saveSuccessMessage}
              />
            </div>

            {/* Right: Visual Page Preview with Bounding Box Highlights */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <PagePreview
                pdfBytes={pdfBytes}
                fields={fields}
                selectedField={selectedField}
                onSelectField={handleSelectField}
                currentPageIndex={currentPageIndex}
                onPageChange={(p) => setCurrentPageIndex(p)}
                pageCount={pageCount}
                pageSize={pageSize}
              />
            </div>
          </div>
        )}

        {activeTab === 'python' && <PythonSourceViewer />}
        {activeTab === 'guide' && <SetupGuide />}
        {activeTab === 'docs' && <PyMuPdfReference />}
      </main>
    </div>
  );
}
