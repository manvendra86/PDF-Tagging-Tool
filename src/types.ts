export type FieldType = 'Text' | 'Checkbox' | 'Radio' | 'Dropdown' | 'ListBox' | 'Button' | 'Signature' | 'Unknown';

export interface FormFieldItem {
  id: string;
  name: string;
  originalName: string; // The persistent name from the PDF document
  fieldIndex: number; // 0-based deterministic index among form.getFields()
  widgetIndex: number; // 0-based index of this specific button/widget within its field group
  totalWidgetsInField: number; // Total number of widgets belonging to this field group
  type: FieldType;
  pageIndex: number;
  value: string | boolean;
  defaultValue: string;
  options?: string[];
  onState?: string; // Export value / on-state for Checkbox and Radio buttons
  isReadOnly?: boolean;
  isRequired?: boolean;
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface PDFDocumentState {
  filename: string;
  pageCount: number;
  pageSize: { width: number; height: number };
  fields: FormFieldItem[];
  pdfBytes: Uint8Array | null;
}
