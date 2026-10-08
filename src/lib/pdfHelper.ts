import {
  PDFDocument,
  StandardFonts,
  rgb,
  PDFTextField,
  PDFCheckBox,
  PDFDropdown,
  PDFOptionList,
  PDFRadioGroup,
  PDFButton,
  PDFName,
  PDFString,
  PDFHexString,
  PDFWidgetAnnotation,
} from 'pdf-lib';
import { FormFieldItem, FieldType } from '../types';

/**
 * Creates a multi-page interactive fillable PDF document with standard AcroForms
 */
export async function createSampleForm(template: 'general' | 'inspection' | 'w4' = 'general'): Promise<{
  bytes: Uint8Array;
  filename: string;
}> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const form = pdfDoc.getForm();

  if (template === 'general') {
    // PAGE 1: Personal & Account Data
    const page1 = pdfDoc.addPage([595, 842]); // A4 (595x842)
    const { height: h1 } = page1.getSize();

    // Title & Headers
    page1.drawText('Sample Fillable PDF Form - Inspection & Testing', {
      x: 50,
      y: h1 - 60,
      size: 17,
      font: fontBold,
      color: rgb(0.1, 0.15, 0.25),
    });
    page1.drawText('Page 1: User Profile & Contact Information', {
      x: 50,
      y: h1 - 85,
      size: 11,
      font,
      color: rgb(0.4, 0.45, 0.55),
    });

    // Divider line
    page1.drawLine({
      start: { x: 50, y: h1 - 100 },
      end: { x: 545, y: h1 - 100 },
      thickness: 1,
      color: rgb(0.85, 0.88, 0.92),
    });

    // 1. Text Field: full_name
    page1.drawText('Full Name:', { x: 50, y: h1 - 135, size: 10, font: fontBold });
    const nameField = form.createTextField('full_name');
    nameField.setText('Jane Doe');
    nameField.addToPage(page1, { x: 180, y: h1 - 145, width: 330, height: 24 });

    // 2. Text Field: email_address
    page1.drawText('Work Email:', { x: 50, y: h1 - 185, size: 10, font: fontBold });
    const emailField = form.createTextField('email_address');
    emailField.setText('jane.doe@example.org');
    emailField.addToPage(page1, { x: 180, y: h1 - 195, width: 330, height: 24 });

    // 3. Dropdown: department_select
    page1.drawText('Department:', { x: 50, y: h1 - 235, size: 10, font: fontBold });
    const deptField = form.createDropdown('department_select');
    deptField.addOptions(['Engineering', 'Product Design', 'Security & Compliance', 'Operations']);
    deptField.select('Engineering');
    deptField.addToPage(page1, { x: 180, y: h1 - 245, width: 260, height: 24 });

    // 4. Checkbox: bulletin_opt_in
    page1.drawText('Receive Security Bulletins:', { x: 50, y: h1 - 280, size: 10, font: fontBold });
    const chkField = form.createCheckBox('bulletin_opt_in');
    chkField.check();
    chkField.addToPage(page1, { x: 230, y: h1 - 285, width: 18, height: 18 });

    // 5. Radio Buttons: preferred_contact (3 options: Email, Phone, Postal)
    page1.drawText('Contact Preference (Radio):', { x: 50, y: h1 - 325, size: 10, font: fontBold });
    const contactRadio = form.createRadioGroup('preferred_contact');
    contactRadio.addOptionToPage('Email', page1, { x: 230, y: h1 - 330, width: 16, height: 16 });
    page1.drawText('Email', { x: 252, y: h1 - 327, size: 9, font });

    contactRadio.addOptionToPage('Phone', page1, { x: 310, y: h1 - 330, width: 16, height: 16 });
    page1.drawText('Phone', { x: 332, y: h1 - 327, size: 9, font });

    contactRadio.addOptionToPage('Postal', page1, { x: 390, y: h1 - 330, width: 16, height: 16 });
    page1.drawText('Postal', { x: 412, y: h1 - 327, size: 9, font });

    contactRadio.select('Email');

    // PAGE 2: Roles & Certification
    const page2 = pdfDoc.addPage([595, 842]);
    const { height: h2 } = page2.getSize();

    page2.drawText('Page 2: Role Access & Verification', {
      x: 50,
      y: h2 - 60,
      size: 16,
      font: fontBold,
      color: rgb(0.1, 0.15, 0.25),
    });
    page2.drawText('Specify assigned authorization roles and certified compliance statements.', {
      x: 50,
      y: h2 - 82,
      size: 10,
      font,
      color: rgb(0.4, 0.45, 0.55),
    });

    page2.drawLine({
      start: { x: 50, y: h2 - 96 },
      end: { x: 545, y: h2 - 96 },
      thickness: 1,
      color: rgb(0.85, 0.88, 0.92),
    });

    // 6. ListBox: assigned_roles
    page2.drawText('Assigned Roles (ListBox):', { x: 50, y: h2 - 125, size: 10, font: fontBold });
    const roleList = form.createOptionList('assigned_roles');
    roleList.addOptions(['Auditor', 'Administrator', 'Contributor', 'Viewer', 'Operator']);
    roleList.select('Administrator');
    roleList.addToPage(page2, { x: 50, y: h2 - 220, width: 280, height: 80 });

    // 7. Text Multiline: audit_notes
    page2.drawText('Audit Remarks / Notes:', { x: 50, y: h2 - 250, size: 10, font: fontBold });
    const notesField = form.createTextField('audit_notes');
    notesField.enableMultiline();
    notesField.setText('Initial verification completed. No compliance violations found.');
    notesField.addToPage(page2, { x: 50, y: h2 - 370, width: 495, height: 105 });

    // 8. Checkbox: terms_certified
    page2.drawText('I certify all above inputs are true and accurate:', { x: 50, y: h2 - 410, size: 10, font: fontBold });
    const certField = form.createCheckBox('terms_certified');
    certField.addToPage(page2, { x: 310, y: h2 - 415, width: 18, height: 18 });

    const bytes = await pdfDoc.save();
    return { bytes, filename: 'sample_fillable_form.pdf' };
  } else if (template === 'inspection') {
    const page = pdfDoc.addPage([595, 842]);
    const { height } = page.getSize();

    page.drawText('Equipment Safety & Facility Compliance Audit', {
      x: 50,
      y: height - 60,
      size: 16,
      font: fontBold,
      color: rgb(0.12, 0.16, 0.24),
    });

    page.drawText('Location / Facility Identifier:', { x: 50, y: height - 110, size: 10, font: fontBold });
    const locField = form.createTextField('facility_id');
    locField.setText('Building-4B / Cleanroom 2');
    locField.addToPage(page, { x: 220, y: height - 120, width: 290, height: 24 });

    page.drawText('Safety Classification Level:', { x: 50, y: height - 160, size: 10, font: fontBold });
    const levelField = form.createDropdown('safety_level');
    levelField.addOptions(['Level 1 - Low Risk', 'Level 2 - Moderate Risk', 'Level 3 - High Risk Critical']);
    levelField.select('Level 1 - Low Risk');
    levelField.addToPage(page, { x: 220, y: height - 170, width: 290, height: 24 });

    // Radio: Inspection status
    page.drawText('Inspection Verdict (Radio):', { x: 50, y: height - 205, size: 10, font: fontBold });
    const verdictRadio = form.createRadioGroup('inspection_verdict');
    verdictRadio.addOptionToPage('Passed', page, { x: 220, y: height - 210, width: 16, height: 16 });
    page.drawText('Passed', { x: 242, y: height - 208, size: 9, font });

    verdictRadio.addOptionToPage('Requires Follow-up', page, { x: 295, y: height - 210, width: 16, height: 16 });
    page.drawText('Requires Follow-up', { x: 317, y: height - 208, size: 9, font });

    verdictRadio.addOptionToPage('Critical Fail', page, { x: 425, y: height - 210, width: 16, height: 16 });
    page.drawText('Critical Fail', { x: 447, y: height - 208, size: 9, font });
    verdictRadio.select('Passed');

    page.drawText('Emergency Stops Operational:', { x: 50, y: height - 245, size: 10, font: fontBold });
    const stopField = form.createCheckBox('emergency_stops_verified');
    stopField.check();
    stopField.addToPage(page, { x: 250, y: height - 251, width: 18, height: 18 });

    page.drawText('Ventilation Airflow Passed:', { x: 50, y: height - 280, size: 10, font: fontBold });
    const ventField = form.createCheckBox('ventilation_passed');
    ventField.check();
    ventField.addToPage(page, { x: 250, y: height - 286, width: 18, height: 18 });

    page.drawText('Corrective Actions Required:', { x: 50, y: height - 320, size: 10, font: fontBold });
    const actionField = form.createTextField('corrective_actions');
    actionField.enableMultiline();
    actionField.setText('Calibrate primary differential pressure sensor before Friday.');
    actionField.addToPage(page, { x: 50, y: height - 430, width: 495, height: 95 });

    const bytes = await pdfDoc.save();
    return { bytes, filename: 'facility_inspection_audit.pdf' };
  } else {
    // W4-like basic sample
    const page = pdfDoc.addPage([595, 842]);
    const { height } = page.getSize();

    page.drawText('Employee Withholding Allowance Certificate (Form W-4)', {
      x: 50,
      y: height - 60,
      size: 15,
      font: fontBold,
    });

    page.drawText('First Name & Middle Initial:', { x: 50, y: height - 110, size: 10, font: fontBold });
    const fname = form.createTextField('first_name');
    fname.setText('Alex M.');
    fname.addToPage(page, { x: 210, y: height - 120, width: 300, height: 24 });

    page.drawText('Last Name:', { x: 50, y: height - 150, size: 10, font: fontBold });
    const lname = form.createTextField('last_name');
    lname.setText('Vanderbilt');
    lname.addToPage(page, { x: 210, y: height - 160, width: 300, height: 24 });

    page.drawText('Marital Status (Radio):', { x: 50, y: height - 195, size: 10, font: fontBold });
    const maritalRadio = form.createRadioGroup('marital_status');
    maritalRadio.addOptionToPage('Single', page, { x: 210, y: height - 200, width: 16, height: 16 });
    page.drawText('Single', { x: 232, y: height - 198, size: 9, font });

    maritalRadio.addOptionToPage('Married', page, { x: 290, y: height - 200, width: 16, height: 16 });
    page.drawText('Married', { x: 312, y: height - 198, size: 9, font });

    maritalRadio.addOptionToPage('Head of Household', page, { x: 370, y: height - 200, width: 16, height: 16 });
    page.drawText('Head of Household', { x: 392, y: height - 198, size: 9, font });
    maritalRadio.select('Single');

    page.drawText('Tax Filing Bracket:', { x: 50, y: height - 235, size: 10, font: fontBold });
    const filingStatus = form.createDropdown('filing_bracket');
    filingStatus.addOptions(['Standard Allowance', 'Itemized Deduction Bracket', 'Exempt Bracket']);
    filingStatus.select('Standard Allowance');
    filingStatus.addToPage(page, { x: 210, y: height - 245, width: 300, height: 24 });

    page.drawText('Claim Exemption from Withholding:', { x: 50, y: height - 280, size: 10, font: fontBold });
    const exempt = form.createCheckBox('exempt_status');
    exempt.addToPage(page, { x: 270, y: height - 285, width: 18, height: 18 });

    const bytes = await pdfDoc.save();
    return { bytes, filename: 'w4_allowance_form.pdf' };
  }
}

/**
 * Extracts export value (on-state) for a radio button or checkbox widget
 */
function extractWidgetExportValue(
  field: any,
  widget: PDFWidgetAnnotation,
  wIdx: number,
  type: FieldType
): string {
  if (type === 'Radio' && field instanceof PDFRadioGroup) {
    const options = field.getOptions();
    if (options && options[wIdx] !== undefined && options[wIdx] !== '') {
      return options[wIdx];
    }
  }

  // Check widget.getOnValue()
  try {
    const onVal = (widget as any).getOnValue ? (widget as any).getOnValue() : null;
    if (onVal && onVal.asString) {
      const s = onVal.asString().replace(/^\//, '');
      if (s && s !== 'Off' && isNaN(Number(s))) {
        return s;
      }
    }
  } catch {}

  // Check appearance dictionary /AP /N
  try {
    const ap = widget.dict.get(PDFName.of('AP'));
    if (ap) {
      const apDict = widget.dict.context.lookup(ap);
      if (apDict && (apDict as any).get) {
        const n = widget.dict.context.lookup((apDict as any).get(PDFName.of('N')));
        if (n && (n as any).keys) {
          const keys = (n as any)
            .keys()
            .map((k: any) => k.asString().replace(/^\//, ''))
            .filter((k: string) => k !== 'Off');
          if (keys.length > 0) {
            return keys[0];
          }
        }
      }
    }
  } catch {}

  if (type === 'Checkbox') {
    return 'Yes';
  }

  if (type === 'Radio') {
    return `Option_${wIdx + 1}`;
  }

  return 'Yes';
}

/**
 * Parses all AcroForm fields across all pages from PDF bytes.
 * For Radio groups and fields with multiple widgets, EVERY individual widget
 * is extracted with its unique widgetIndex, page, geometry, and export value!
 */
export async function parsePdfFields(pdfBytes: Uint8Array): Promise<{
  pageCount: number;
  pageSize: { width: number; height: number };
  fields: FormFieldItem[];
}> {
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const form = pdfDoc.getForm();
  const pageCount = pdfDoc.getPageCount();
  const firstPage = pdfDoc.getPage(0);
  const { width, height } = firstPage.getSize();
  const pages = pdfDoc.getPages();

  const rawFields = form.getFields();
  const parsed: FormFieldItem[] = [];

  for (let i = 0; i < rawFields.length; i++) {
    const field = rawFields[i];
    const name = field.getName();
    let type: FieldType = 'Unknown';
    let value: string | boolean = '';
    let defaultValue = '';
    let options: string[] | undefined;

    if (field instanceof PDFTextField) {
      type = 'Text';
      value = field.getText() || '';
      defaultValue = '';
    } else if (field instanceof PDFCheckBox) {
      type = 'Checkbox';
      value = field.isChecked();
    } else if (field instanceof PDFDropdown) {
      type = 'Dropdown';
      options = field.getOptions();
      const sel = field.getSelected();
      value = sel && sel.length > 0 ? sel[0] : (options[0] || '');
    } else if (field instanceof PDFOptionList) {
      type = 'ListBox';
      options = field.getOptions();
      const sel = field.getSelected();
      value = sel && sel.length > 0 ? sel[0] : '';
    } else if (field instanceof PDFRadioGroup) {
      type = 'Radio';
      options = field.getOptions();
      value = field.getSelected() || '';
    } else if (field instanceof PDFButton) {
      type = 'Button';
      value = '';
    }

    // Extract default value from /DV dictionary entry if available
    try {
      const dv = (field as any).acroField?.dict?.get(PDFName.of('DV'));
      if (dv) {
        defaultValue = dv.asString ? dv.asString() : dv.value || String(dv);
      }
    } catch {
      // fallback
    }

    let widgets: PDFWidgetAnnotation[] = [];
    try {
      widgets = (field as any).acroField.getWidgets() || [];
    } catch {
      widgets = [];
    }

    const widgetCount = widgets.length;

    if (widgetCount === 0) {
      // Fallback if no widget annotations found on the field
      parsed.push({
        id: `field_${i}_w_0`,
        name,
        originalName: name,
        fieldIndex: i,
        widgetIndex: 0,
        totalWidgetsInField: 0,
        type,
        pageIndex: 0,
        value,
        defaultValue,
        options,
        onState: type === 'Checkbox' || type === 'Radio' ? 'Yes' : undefined,
        isReadOnly: field.isReadOnly(),
        isRequired: field.isRequired(),
        rect: { x: 50, y: 100, width: 200, height: 25 },
      });
    } else {
      for (let wIdx = 0; wIdx < widgetCount; wIdx++) {
        const widget = widgets[wIdx];
        let rect = { x: 50, y: 100, width: 200, height: 25 };
        let pageIndex = 0;

        try {
          const r = widget.getRectangle();
          rect = {
            x: Math.round(r.x),
            y: Math.round(r.y),
            width: Math.round(r.width),
            height: Math.round(r.height),
          };

          for (let pIdx = 0; pIdx < pages.length; pIdx++) {
            const pageRef = pages[pIdx].ref;
            const p = widget.P();
            if (p && pageRef && p.toString() === pageRef.toString()) {
              pageIndex = pIdx;
              break;
            }
          }
        } catch {
          // fallback
        }

        const onStateVal =
          type === 'Radio' || type === 'Checkbox'
            ? extractWidgetExportValue(field, widget, wIdx, type)
            : undefined;

        parsed.push({
          id: `field_${i}_w_${wIdx}`,
          name,
          originalName: name,
          fieldIndex: i,
          widgetIndex: wIdx,
          totalWidgetsInField: widgetCount,
          type,
          pageIndex,
          value,
          defaultValue,
          options,
          onState: onStateVal,
          isReadOnly: field.isReadOnly(),
          isRequired: field.isRequired(),
          rect,
        });
      }
    }
  }

  return {
    pageCount,
    pageSize: { width, height },
    fields: parsed,
  };
}

/**
 * Updates a form field property and serializes the modified PDF.
 * Supports updating Field Name, Field Value, Export Value (on-state for Radio & Checkbox),
 * Options, Default Value, and Field Flags.
 */
export async function updateFieldInPDFBytes(
  pdfBytes: Uint8Array,
  targetFieldInfo: { fieldIndex?: number; widgetIndex?: number; originalName: string } | string,
  updatedData: {
    newName: string;
    newValue: string | boolean;
    newExportValue?: string;
    newOptions?: string[];
    newDefault?: string;
    isReadOnly?: boolean;
    isRequired?: boolean;
  }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const form = pdfDoc.getForm();
  const allFields = form.getFields();

  const originalName = typeof targetFieldInfo === 'string' ? targetFieldInfo : targetFieldInfo.originalName;
  const fieldIndex = typeof targetFieldInfo === 'string' ? -1 : (targetFieldInfo.fieldIndex ?? -1);
  const widgetIndex = typeof targetFieldInfo === 'string' ? 0 : (targetFieldInfo.widgetIndex ?? 0);

  try {
    let field: any = null;

    // 1. Try finding by originalName
    try {
      if (originalName) {
        field = form.getField(originalName);
      }
    } catch {
      // ignore
    }

    // 2. Try finding by matching name in allFields
    if (!field && originalName) {
      field = allFields.find(
        (f) =>
          f.getName() === originalName ||
          f.getName().trim() === originalName.trim() ||
          f.getName() === updatedData.newName
      );
    }

    // 3. Fallback by field index
    if (!field && fieldIndex >= 0 && fieldIndex < allFields.length) {
      field = allFields[fieldIndex];
    }

    if (!field) {
      console.warn(`Could not find field '${originalName}' in document.`);
      return await pdfDoc.save();
    }

    // Update field depending on field type
    if (field instanceof PDFTextField) {
      field.setText(String(updatedData.newValue ?? ''));
      if (updatedData.isReadOnly) field.enableReadOnly();
      else field.disableReadOnly();
      if (updatedData.isRequired) field.enableRequired();
      else field.disableRequired();
    } else if (field instanceof PDFCheckBox) {
      if (updatedData.newValue === true || String(updatedData.newValue).toLowerCase() === 'true') {
        field.check();
      } else {
        field.uncheck();
      }

      // Update Checkbox export value if modified
      if (updatedData.newExportValue && updatedData.newExportValue.trim()) {
        const exportVal = updatedData.newExportValue.trim();
        try {
          const widgets = field.acroField.getWidgets();
          for (const w of widgets) {
            const ap = w.dict.get(PDFName.of('AP'));
            if (ap) {
              const apDict = pdfDoc.context.lookup(ap);
              if (apDict && (apDict as any).get) {
                const n = pdfDoc.context.lookup((apDict as any).get(PDFName.of('N')));
                if (n && (n as any).entries) {
                  for (const [key, val] of (n as any).entries()) {
                    const kStr = key.asString().replace(/^\//, '');
                    if (kStr !== 'Off') {
                      (n as any).delete(key);
                      (n as any).set(PDFName.of(exportVal), val);
                    }
                  }
                }
              }
            }
          }
        } catch (e) {
          console.warn('Could not update checkbox export value:', e);
        }
      }
      if (updatedData.isReadOnly) field.enableReadOnly();
      else field.disableReadOnly();
      if (updatedData.isRequired) field.enableRequired();
      else field.disableRequired();
    } else if (field instanceof PDFDropdown) {
      if (updatedData.newOptions && updatedData.newOptions.length > 0) {
        field.setOptions(updatedData.newOptions);
      }
      if (updatedData.newValue) {
        try {
          field.select(String(updatedData.newValue));
        } catch {
          if (updatedData.newOptions && !updatedData.newOptions.includes(String(updatedData.newValue))) {
            field.addOptions([String(updatedData.newValue)]);
            field.select(String(updatedData.newValue));
          }
        }
      }
      if (updatedData.isReadOnly) field.enableReadOnly();
      else field.disableReadOnly();
      if (updatedData.isRequired) field.enableRequired();
      else field.disableRequired();
    } else if (field instanceof PDFOptionList) {
      if (updatedData.newOptions && updatedData.newOptions.length > 0) {
        field.setOptions(updatedData.newOptions);
      }
      if (updatedData.newValue) {
        try {
          field.select(String(updatedData.newValue));
        } catch {
          // ignore
        }
      }
      if (updatedData.isReadOnly) field.enableReadOnly();
      else field.disableReadOnly();
      if (updatedData.isRequired) field.enableRequired();
      else field.disableRequired();
    } else if (field instanceof PDFRadioGroup) {
      const widgets = field.acroField.getWidgets();
      const currentOptions = field.getOptions();

      // 1. Update export value of the selected radio button if specified
      if (updatedData.newExportValue && updatedData.newExportValue.trim()) {
        const newExportVal = updatedData.newExportValue.trim();
        const updatedOptions =
          currentOptions.length > 0
            ? [...currentOptions]
            : widgets.map((_, i) => `Option_${i + 1}`);

        while (updatedOptions.length <= widgetIndex) {
          updatedOptions.push(`Option_${updatedOptions.length + 1}`);
        }
        const oldExportVal = updatedOptions[widgetIndex];
        updatedOptions[widgetIndex] = newExportVal;

        // Set /Opt array in field dictionary
        const pdfOptArray = pdfDoc.context.obj(
          updatedOptions.map((opt) => PDFHexString.fromText(opt))
        );
        field.acroField.dict.set(PDFName.of('Opt'), pdfOptArray);

        // Update widget appearance dictionary if custom named states exist
        if (widgetIndex < widgets.length) {
          const targetWidget = widgets[widgetIndex];
          const ap = targetWidget.dict.get(PDFName.of('AP'));
          if (ap) {
            const apDict = pdfDoc.context.lookup(ap);
            if (apDict && (apDict as any).get) {
              const n = pdfDoc.context.lookup((apDict as any).get(PDFName.of('N')));
              if (n && (n as any).entries) {
                for (const [key, val] of (n as any).entries()) {
                  const kStr = key.asString().replace(/^\//, '');
                  if (kStr !== 'Off' && isNaN(Number(kStr))) {
                    (n as any).delete(key);
                    (n as any).set(PDFName.of(newExportVal), val);
                  }
                }
              }
            }
          }
        }

        // If the group was selected to the old export value, or if newValue was set to the new export value:
        if (
          field.getSelected() === oldExportVal ||
          updatedData.newValue === newExportVal ||
          updatedData.newValue === oldExportVal
        ) {
          try {
            field.select(newExportVal);
          } catch {
            (field.acroField as any).setValue(PDFName.of(newExportVal));
          }
        }
      }

      // 2. Update selected value if user selected an option
      if (updatedData.newValue && typeof updatedData.newValue === 'string') {
        try {
          field.select(updatedData.newValue);
        } catch {
          (field.acroField as any).setValue(PDFName.of(updatedData.newValue));
        }
      }

      if (updatedData.isReadOnly) field.enableReadOnly();
      else field.disableReadOnly();
      if (updatedData.isRequired) field.enableRequired();
      else field.disableRequired();
    }

    // Update Default Value (/DV)
    if (updatedData.newDefault !== undefined && (field as any).acroField?.dict) {
      try {
        (field as any).acroField.dict.set(
          PDFName.of('DV'),
          PDFHexString.fromText(String(updatedData.newDefault))
        );
      } catch (e) {
        console.warn('Could not set default value:', e);
      }
    }

    // Rename field if newName differs and is non-empty (/T)
    if (
      updatedData.newName &&
      updatedData.newName.trim() &&
      updatedData.newName.trim() !== originalName &&
      (field as any).acroField?.dict
    ) {
      const trimmedName = updatedData.newName.trim();
      try {
        const hexName = PDFHexString.fromText(trimmedName);
        (field as any).acroField.dict.set(PDFName.of('T'), hexName);

        // Also update any child widget dictionaries having an explicit /T entry
        const widgets = (field as any).acroField?.getWidgets?.() || [];
        for (const w of widgets) {
          if (w.dict.get(PDFName.of('T'))) {
            w.dict.set(PDFName.of('T'), hexName);
          }
        }
      } catch (e) {
        console.warn('Could not rename field:', e);
      }
    }
  } catch (err) {
    console.warn('Field update error:', err);
  }

  return await pdfDoc.save();
}
