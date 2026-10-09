"""
PyMuPDF & Streamlit PDF AcroForm Inspector & Editor
===================================================
A complete, local Python application for uploading fillable PDF documents,
inspecting all AcroForm widgets/fields across all pages, editing properties
(field name identifiers, radio export values, checkbox states, choice values,
default values, etc.), saving modifications back to the document with PyMuPDF,
and downloading the finalized PDF.
"""

import base64
import io
import fitz  # PyMuPDF
from PIL import Image, ImageDraw
import streamlit as st

# Configure Streamlit page layout and metadata
st.set_page_config(
    page_title="PDF AcroForm Inspector & Editor",
    page_icon="📄",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom CSS styling to provide a modern, sleek studio appearance matching the web view
st.markdown(
    """
<style>
    .stApp {
        background-color: #020617;
        color: #f8fafc;
    }
    [data-testid="stSidebar"] {
        background-color: #0f172a !important;
        border-right: 1px solid #1e293b !important;
    }
    .field-card {
        padding: 12px;
        background-color: #0f172a;
        border: 1px solid #1e293b;
        border-radius: 8px;
        margin-bottom: 12px;
    }
    .field-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        font-family: monospace;
    }
    .badge-text { background: rgba(79, 70, 229, 0.2); color: #818cf8; border: 1px solid rgba(79, 70, 229, 0.4); }
    .badge-check { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); }
    .badge-radio { background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); }
    .badge-combo { background: rgba(14, 165, 233, 0.2); color: #38bdf8; border: 1px solid rgba(14, 165, 233, 0.4); }
</style>
""",
    unsafe_allow_html=True,
)

# Friendly mapping for PyMuPDF widget types
WIDGET_TYPE_NAMES = {
    fitz.PDF_WIDGET_TYPE_UNKNOWN: "Unknown",
    fitz.PDF_WIDGET_TYPE_BUTTON: "Push Button",
    fitz.PDF_WIDGET_TYPE_CHECKBOX: "Checkbox",
    fitz.PDF_WIDGET_TYPE_COMBOBOX: "ComboBox (Dropdown)",
    fitz.PDF_WIDGET_TYPE_LISTBOX: "ListBox (Multi-option)",
    fitz.PDF_WIDGET_TYPE_RADIOBUTTON: "Radio Button",
    fitz.PDF_WIDGET_TYPE_SIGNATURE: "Digital Signature",
    fitz.PDF_WIDGET_TYPE_TEXT: "Text Field",
}

ZOOM_OPTIONS = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5]


def create_sample_fillable_pdf() -> bytes:
    """Generate a multi-page interactive fillable PDF with text, checkboxes, radio buttons, dropdowns, and listboxes."""
    doc = fitz.open()

    # Page 1: Personal & Account Information
    page1 = doc.new_page(width=595, height=842)
    page1.insert_text(
        fitz.Point(50, 60),
        "Sample Fillable PDF Form - Inspection & Testing",
        fontsize=16,
        fontname="helv",
    )
    page1.insert_text(
        fitz.Point(50, 80),
        "Page 1: User Profile & Contact Information",
        fontsize=10,
        fontname="helv",
    )

    # Text Field: Full Name
    page1.insert_text(fitz.Point(50, 130), "Full Name:", fontsize=10)
    w_name = fitz.Widget()
    w_name.rect = fitz.Rect(160, 115, 450, 138)
    w_name.field_type = fitz.PDF_WIDGET_TYPE_TEXT
    w_name.field_name = "full_name"
    w_name.field_value = "Jane Doe"
    w_name.default_value = "Enter your full legal name"
    page1.add_widget(w_name)

    # Text Field: Work Email
    page1.insert_text(fitz.Point(50, 175), "Work Email:", fontsize=10)
    w_email = fitz.Widget()
    w_email.rect = fitz.Rect(160, 160, 450, 183)
    w_email.field_type = fitz.PDF_WIDGET_TYPE_TEXT
    w_email.field_name = "email_address"
    w_email.field_value = "jane.doe@example.org"
    w_email.default_value = "name@company.com"
    page1.add_widget(w_email)

    # Dropdown: Department (ComboBox)
    page1.insert_text(fitz.Point(50, 220), "Department:", fontsize=10)
    w_dept = fitz.Widget()
    w_dept.rect = fitz.Rect(160, 205, 350, 228)
    w_dept.field_type = fitz.PDF_WIDGET_TYPE_COMBOBOX
    w_dept.field_name = "department_select"
    w_dept.choice_values = ["Engineering", "Product Design", "Security & Compliance", "Operations"]
    w_dept.field_value = "Engineering"
    page1.add_widget(w_dept)

    # Checkbox: Newsletter / Notifications
    page1.insert_text(fitz.Point(50, 265), "Receive Security Bulletins:", fontsize=10)
    w_chk = fitz.Widget()
    w_chk.rect = fitz.Rect(230, 252, 248, 270)
    w_chk.field_type = fitz.PDF_WIDGET_TYPE_CHECKBOX
    w_chk.field_name = "bulletin_opt_in"
    w_chk.field_value = True
    page1.add_widget(w_chk)

    # Radio Buttons: Preferred Contact (Multiple buttons for the same group!)
    page1.insert_text(fitz.Point(50, 310), "Preferred Contact (Radio Group):", fontsize=10)

    page1.insert_text(fitz.Point(230, 310), "Email", fontsize=9)
    w_radio1 = fitz.Widget()
    w_radio1.rect = fitz.Rect(210, 298, 226, 314)
    w_radio1.field_type = fitz.PDF_WIDGET_TYPE_RADIOBUTTON
    w_radio1.field_name = "preferred_contact"
    w_radio1.button_caption = "Email"
    w_radio1.field_value = "Email"
    page1.add_widget(w_radio1)

    page1.insert_text(fitz.Point(310, 310), "Phone", fontsize=9)
    w_radio2 = fitz.Widget()
    w_radio2.rect = fitz.Rect(290, 298, 306, 314)
    w_radio2.field_type = fitz.PDF_WIDGET_TYPE_RADIOBUTTON
    w_radio2.field_name = "preferred_contact"
    w_radio2.button_caption = "Phone"
    w_radio2.field_value = False
    page1.add_widget(w_radio2)

    page1.insert_text(fitz.Point(390, 310), "Postal", fontsize=9)
    w_radio3 = fitz.Widget()
    w_radio3.rect = fitz.Rect(370, 298, 386, 314)
    w_radio3.field_type = fitz.PDF_WIDGET_TYPE_RADIOBUTTON
    w_radio3.field_name = "preferred_contact"
    w_radio3.button_caption = "Postal"
    w_radio3.field_value = False
    page1.add_widget(w_radio3)

    # Page 2: Permissions & Multi-select
    page2 = doc.new_page(width=595, height=842)
    page2.insert_text(
        fitz.Point(50, 60),
        "Page 2: Role Access & Selections",
        fontsize=16,
        fontname="helv",
    )

    # ListBox: Permitted Roles
    page2.insert_text(fitz.Point(50, 120), "Assigned Roles (ListBox):", fontsize=10)
    w_list = fitz.Widget()
    w_list.rect = fitz.Rect(50, 135, 300, 220)
    w_list.field_type = fitz.PDF_WIDGET_TYPE_LISTBOX
    w_list.field_name = "assigned_roles"
    w_list.choice_values = ["Auditor", "Administrator", "Contributor", "Viewer", "Operator"]
    w_list.field_value = "Administrator"
    page2.add_widget(w_list)

    # Multiline Text: Notes
    page2.insert_text(fitz.Point(50, 270), "Audit Remarks / Notes:", fontsize=10)
    w_notes = fitz.Widget()
    w_notes.rect = fitz.Rect(50, 285, 520, 390)
    w_notes.field_type = fitz.PDF_WIDGET_TYPE_TEXT
    w_notes.field_name = "audit_notes"
    w_notes.field_value = "Initial verification completed. No compliance violations found."
    w_notes.field_flags = fitz.PDF_TX_FIELD_IS_MULTILINE
    page2.add_widget(w_notes)

    # Checkbox: Agreement
    page2.insert_text(fitz.Point(50, 440), "I certify all above inputs are valid:", fontsize=10)
    w_agree = fitz.Widget()
    w_agree.rect = fitz.Rect(260, 428, 278, 446)
    w_agree.field_type = fitz.PDF_WIDGET_TYPE_CHECKBOX
    w_agree.field_name = "terms_certified"
    w_agree.field_value = False
    page2.add_widget(w_agree)

    output = doc.tobytes(garbage=3, deflate=True)
    doc.close()
    return output


def extract_all_fields(pdf_bytes: bytes) -> list[dict]:
    """Parse all interactive AcroForm widgets across all pages of the document.
    Every individual widget annotation is preserved with its index, page, and export value."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    fields = []
    group_counts = {}

    for page_idx in range(len(doc)):
        page = doc[page_idx]
        for w_idx, widget in enumerate(page.widgets()):
            w_type = widget.field_type
            type_str = WIDGET_TYPE_NAMES.get(w_type, f"Type {w_type}")
            name = widget.field_name or f"Unnamed_P{page_idx + 1}"

            # Track number of buttons in this group
            group_key = f"{name}_{w_type}"
            group_counts[group_key] = group_counts.get(group_key, 0) + 1
            button_idx = group_counts[group_key]

            # Determine export value / on-state
            on_state = getattr(widget, "button_caption", "")
            if not on_state and callable(getattr(widget, "on_state", None)):
                try:
                    on_state = widget.on_state()
                except Exception:
                    on_state = ""
            if not on_state:
                on_state = getattr(widget, "on_state", "") if hasattr(widget, "on_state") else ""
            if not on_state:
                on_state = f"Option_{button_idx}" if w_type == fitz.PDF_WIDGET_TYPE_RADIOBUTTON else "Yes"

            fields.append({
                "global_idx": len(fields),
                "page_idx": page_idx,
                "widget_idx": w_idx,
                "button_idx": button_idx,
                "field_name": name,
                "field_type": w_type,
                "field_type_str": type_str,
                "field_value": widget.field_value,
                "default_value": getattr(widget, "default_value", "") or "",
                "choice_values": getattr(widget, "choice_values", []) or [],
                "rect": [round(coord, 2) for coord in widget.rect],
                "on_state": on_state,
                "field_flags": widget.field_flags,
            })

    # Annotate total buttons in each radio group
    for f in fields:
        group_key = f"{f['field_name']}_{f['field_type']}"
        f["total_in_group"] = group_counts.get(group_key, 1)

    doc.close()
    return fields


def render_page_with_highlight(
    pdf_bytes: bytes,
    page_idx: int,
    target_rect: list[float] | None = None,
    zoom_factor: float = 1.5,
) -> Image.Image:
    """Render a visual PNG image preview of the specific page with a highlight box over target_rect."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    if page_idx >= len(doc):
        doc.close()
        return Image.new("RGB", (500, 300), color=(15, 23, 42))

    page = doc[page_idx]
    zoom = max(0.5, float(zoom_factor))
    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat, alpha=False)

    img = Image.open(io.BytesIO(pix.tobytes("png")))
    doc.close()

    # Draw highlight overlay on PIL image if target_rect is provided
    if target_rect and len(target_rect) == 4:
        draw = ImageDraw.Draw(img)
        x0, y0, x1, y1 = target_rect
        scaled_box = [x0 * zoom, y0 * zoom, x1 * zoom, y1 * zoom]

        padding = max(2, int(3 * zoom))
        outer_box = [
            scaled_box[0] - padding,
            scaled_box[1] - padding,
            scaled_box[2] + padding,
            scaled_box[3] + padding,
        ]

        # Outer highlight border (vivid indigo border)
        border_thickness = max(2, int(2.5 * zoom))
        for i in range(border_thickness):
            draw.rectangle(
                [outer_box[0] - i, outer_box[1] - i, outer_box[2] + i, outer_box[3] + i],
                outline=(79, 70, 229, 255),
            )

    return img


def render_st_image_compat(image_obj, caption: str | None = None):
    """
    Safely render an image with backward compatibility across all Streamlit versions.
    Streamlit >= 1.39 uses 'use_container_width=True'.
    Streamlit < 1.39 uses 'use_column_width=True'.
    """
    try:
        st.image(image_obj, caption=caption, use_container_width=True)
    except TypeError:
        try:
            st.image(image_obj, caption=caption, use_column_width=True)
        except TypeError:
            st.image(image_obj, caption=caption)


def update_field_in_pdf(
    pdf_bytes: bytes,
    page_idx: int,
    widget_idx: int,
    original_field_name: str,
    new_field_name: str,
    new_value: any,
    new_export_value: str,
    new_default_val: str,
    new_choices: list[str],
) -> bytes:
    """Commit field updates back to the widget object and serialize the modified PDF."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    page = doc[page_idx]
    widgets = list(page.widgets())

    target_widget = None
    if 0 <= widget_idx < len(widgets):
        target_widget = widgets[widget_idx]
    else:
        for w in widgets:
            if w.field_name == original_field_name:
                target_widget = w
                break

    if target_widget:
        # 1. Update export value (on-state) for radio button or checkbox
        if new_export_value and new_export_value.strip():
            cleaned_exp = new_export_value.strip()
            if hasattr(target_widget, "button_caption"):
                target_widget.button_caption = cleaned_exp
            if hasattr(target_widget, "on_state"):
                try:
                    target_widget.on_state = cleaned_exp
                except Exception:
                    pass

        # 2. Update value depending on widget type
        if target_widget.field_type in (fitz.PDF_WIDGET_TYPE_COMBOBOX, fitz.PDF_WIDGET_TYPE_LISTBOX):
            if new_choices:
                target_widget.choice_values = new_choices
            target_widget.field_value = str(new_value) if new_value is not None else ""
        elif target_widget.field_type == fitz.PDF_WIDGET_TYPE_RADIOBUTTON:
            if isinstance(new_value, bool):
                target_widget.field_value = new_value
            elif str(new_value).lower() in ("true", "1", "yes", "on"):
                target_widget.field_value = True
            elif str(new_value).lower() in ("false", "0", "no", "off"):
                target_widget.field_value = False
            else:
                target_widget.field_value = new_value
        elif target_widget.field_type == fitz.PDF_WIDGET_TYPE_CHECKBOX:
            if isinstance(new_value, bool):
                target_widget.field_value = new_value
            elif str(new_value).lower() in ("true", "1", "yes", "on"):
                target_widget.field_value = True
            else:
                target_widget.field_value = False
        else:
            target_widget.field_value = str(new_value) if new_value is not None else ""

        if hasattr(target_widget, "default_value"):
            target_widget.default_value = new_default_val

        # 3. Update field name identifier across document
        if new_field_name and new_field_name.strip():
            trimmed_name = new_field_name.strip()
            # If this is a radio button or grouped widget, update all sibling widgets in the group across the document
            if target_widget.field_type == fitz.PDF_WIDGET_TYPE_RADIOBUTTON:
                for p in doc:
                    for w in p.widgets():
                        if w.field_name == original_field_name or w.field_name == target_widget.field_name:
                            w.field_name = trimmed_name
                            w.update()
            target_widget.field_name = trimmed_name

        target_widget.update()

    output_bytes = doc.tobytes(garbage=3, deflate=True)
    doc.close()
    return output_bytes


# ---------------------------------------------------------
# App State Initialization
# ---------------------------------------------------------
if "current_pdf_bytes" not in st.session_state:
    st.session_state["current_pdf_bytes"] = None

if "filename" not in st.session_state:
    st.session_state["filename"] = "document.pdf"

if "success_msg" not in st.session_state:
    st.session_state["success_msg"] = None

if "zoom_level" not in st.session_state or st.session_state["zoom_level"] not in ZOOM_OPTIONS:
    st.session_state["zoom_level"] = 1.5

if "selected_field_idx" not in st.session_state:
    st.session_state["selected_field_idx"] = 0

if "preview_page_idx" not in st.session_state:
    st.session_state["preview_page_idx"] = 0


# ---------------------------------------------------------
# Main UI Layout
# ---------------------------------------------------------
st.title("📄 PDF AcroForm Field Inspector & Editor")
st.caption("Inspect, modify, and export interactive PDF form field properties with visual page preview powered by PyMuPDF.")

# Top Action Toolbar
col_upload, col_sample = st.columns([3, 1])

with col_upload:
    uploaded_file = st.file_uploader(
        "Upload a Fillable PDF (with AcroForms)",
        type=["pdf"],
        help="Upload any PDF containing interactive form fields (text boxes, checkboxes, radio buttons, dropdowns, etc.).",
    )
    if uploaded_file is not None:
        file_bytes = uploaded_file.read()
        if st.session_state.get("last_uploaded_name") != uploaded_file.name:
            st.session_state["current_pdf_bytes"] = file_bytes
            st.session_state["filename"] = uploaded_file.name
            st.session_state["last_uploaded_name"] = uploaded_file.name
            st.session_state["selected_field_idx"] = 0
            st.session_state["preview_page_idx"] = 0
            st.session_state["success_msg"] = f"Uploaded '{uploaded_file.name}' successfully."
            st.rerun()

with col_sample:
    st.write("")
    st.write("")
    if st.button("✨ Load Sample Fillable PDF", use_container_width=True):
        st.session_state["current_pdf_bytes"] = create_sample_fillable_pdf()
        st.session_state["filename"] = "sample_fillable_form.pdf"
        st.session_state["last_uploaded_name"] = "sample_fillable_form.pdf"
        st.session_state["selected_field_idx"] = 0
        st.session_state["preview_page_idx"] = 0
        st.session_state["success_msg"] = "Loaded multi-page sample fillable PDF with text, checkboxes, radio group & listbox."
        st.rerun()

# Check if document is available
if st.session_state["current_pdf_bytes"] is None:
    st.info("👋 Upload a fillable PDF using the box above, or click **'Load Sample Fillable PDF'** to test immediately.")
    st.stop()

# Show transient notifications
if st.session_state.get("success_msg"):
    st.success(st.session_state["success_msg"])
    st.session_state["success_msg"] = None

pdf_bytes = st.session_state["current_pdf_bytes"]

# Parse all interactive form fields across pages
fields = extract_all_fields(pdf_bytes)

if not fields:
    st.warning("⚠️ No interactive AcroForm fields were detected in this document. Please upload a fillable PDF or load the sample.")
    st.stop()

total_doc_pages = fitz.open(stream=pdf_bytes, filetype="pdf").page_count

# ---------------------------------------------------------
# Sidebar: Field Detection & Navigation
# ---------------------------------------------------------
st.sidebar.header(f"Detected Fields ({len(fields)})")

# Search / Filter
filter_text = st.sidebar.text_input("🔍 Filter fields by name, option, or value:", "")
filtered_indices = [
    i for i, f in enumerate(fields)
    if filter_text.lower() in f["field_name"].lower()
    or filter_text.lower() in f["field_type_str"].lower()
    or filter_text.lower() in str(f.get("on_state", "")).lower()
    or filter_text.lower() in str(f.get("field_value", "")).lower()
]

if not filtered_indices:
    st.sidebar.info("No fields match your filter.")
    filtered_indices = list(range(len(fields)))

# Format options for sidebar selector with LIVE dynamic values
def format_sidebar_label(idx: int) -> str:
    f = fields[idx]
    val = f.get("field_value")
    w_type = f["field_type"]
    page_str = f"P{f['page_idx'] + 1}"
    name_str = f["field_name"]

    if w_type == fitz.PDF_WIDGET_TYPE_RADIOBUTTON:
        opt = f.get("on_state", f"Option_{f['button_idx']}")
        is_sel = False
        if isinstance(val, bool):
            is_sel = val
        elif val is not None and str(val).strip():
            is_sel = (str(val) == str(opt))
        sel_symbol = "● Selected" if is_sel else "○ Inactive"
        return f"{page_str} | {name_str} [{sel_symbol}: '{opt}'] (Radio #{f['button_idx']}/{f.get('total_in_group', 1)})"

    elif w_type == fitz.PDF_WIDGET_TYPE_CHECKBOX:
        chk_status = "✓ Checked" if bool(val) else "✗ Unchecked"
        return f"{page_str} | {name_str} [{chk_status}] (Checkbox)"

    elif w_type in (fitz.PDF_WIDGET_TYPE_COMBOBOX, fitz.PDF_WIDGET_TYPE_LISTBOX):
        display_val = str(val)[:18] if val else "(none)"
        return f"{page_str} | {name_str} [Val: '{display_val}'] ({f['field_type_str'].split()[0]})"

    else:
        # Text field
        display_val = str(val)[:18] if val else "(empty)"
        return f"{page_str} | {name_str} [Val: '{display_val}']"

# Ensure selected index is within bounds of filtered list
default_sidebar_idx = 0
if st.session_state.get("selected_field_idx") in filtered_indices:
    default_sidebar_idx = filtered_indices.index(st.session_state["selected_field_idx"])

selected_index = st.sidebar.radio(
    "Select a field to inspect & edit:",
    options=filtered_indices,
    format_func=format_sidebar_label,
    index=default_sidebar_idx,
    key="sidebar_field_radio",
)

st.session_state["selected_field_idx"] = selected_index
selected_field = fields[selected_index]
active_page_idx = selected_field["page_idx"]

# Sync page preview when field selection changes
st.session_state["preview_page_idx"] = active_page_idx

# Sidebar Summary
st.sidebar.divider()
st.sidebar.markdown(f"**Document Name:** `{st.session_state['filename']}`")
st.sidebar.markdown(f"**Total Pages:** {total_doc_pages}")
st.sidebar.markdown(f"**Total Form Widgets:** {len(fields)}")

# ---------------------------------------------------------
# Main Two-Column View: Editor Panel (Left) & Visual Preview (Right)
# ---------------------------------------------------------
col_editor, col_preview = st.columns([1, 1], gap="large")

with col_editor:
    st.subheader("🛠️ Field Property Editor")
    st.markdown(
        f"Editing widget **`{selected_field['field_name']}`** on **Page {active_page_idx + 1}** "
        f"*(Type: {selected_field['field_type_str']})*"
    )

    # Sibling Radio Buttons Quick Bar
    if selected_field["field_type"] == fitz.PDF_WIDGET_TYPE_RADIOBUTTON:
        siblings = [
            f for f in fields
            if f["field_type"] == fitz.PDF_WIDGET_TYPE_RADIOBUTTON
            and f["field_name"] == selected_field["field_name"]
        ]
        if len(siblings) > 1:
            st.markdown(f"**Radio Group Buttons ({len(siblings)} buttons in '{selected_field['field_name']}'):**")
            cols_s = st.columns(len(siblings))
            for s_idx, sib in enumerate(siblings):
                with cols_s[s_idx]:
                    is_current = sib["global_idx"] == selected_field["global_idx"]
                    is_active = (
                        bool(sib["field_value"])
                        if isinstance(sib["field_value"], bool)
                        else (str(sib["field_value"]) == str(sib["on_state"]))
                    )
                    marker = "● " if is_active else "○ "
                    label = f"{marker}Btn {sib['button_idx']}: {sib['on_state']}"
                    if is_current:
                        st.button(f"👉 {label}", key=f"sib_btn_{sib['global_idx']}", disabled=True, use_container_width=True)
                    else:
                        if st.button(label, key=f"sib_btn_{sib['global_idx']}", use_container_width=True):
                            st.session_state["selected_field_idx"] = sib["global_idx"]
                            st.session_state["preview_page_idx"] = sib["page_idx"]
                            st.rerun()

    with st.form(key=f"field_edit_form_{selected_index}"):
        # 1. Field Name Identifier
        new_name = st.text_input(
            "Field Name Identifier (Group /T):",
            value=selected_field["field_name"],
            help="Internal name identifier used for this AcroForm widget. Renaming updates the field identifier across the document.",
        )

        # 2. Values & States based on Widget Type
        current_val = selected_field["field_value"]
        w_type = selected_field["field_type"]

        new_val = current_val
        new_choices = selected_field["choice_values"]
        new_default = selected_field["default_value"]
        new_export_val = selected_field.get("on_state", "Yes")

        if w_type == fitz.PDF_WIDGET_TYPE_CHECKBOX:
            st.markdown("**Checkbox State & Export Value:**")
            is_checked = bool(current_val) if current_val is not None else False
            new_val = st.checkbox("Checked / Active State", value=is_checked)
            new_export_val = st.text_input(
                "On-State Export Value (/AS):",
                value=str(selected_field.get("on_state", "Yes")),
                help="The export value or token sent when this checkbox is checked.",
            )

        elif w_type == fitz.PDF_WIDGET_TYPE_RADIOBUTTON:
            st.markdown("**Radio Button Option & Export Value:**")
            new_export_val = st.text_input(
                "Export Value / On-State (/Opt or /AP):",
                value=str(selected_field.get("on_state", f"Option_{selected_field['button_idx']}")),
                help="The export value or token stored when this specific radio button is selected.",
            )
            is_radio_active = (
                bool(current_val)
                if isinstance(current_val, bool)
                else (str(current_val) == str(selected_field.get("on_state", "")))
            )
            make_active = st.checkbox("Mark this Radio Button as Selected / Active", value=is_radio_active)
            new_val = new_export_val if make_active else False

        elif w_type in (fitz.PDF_WIDGET_TYPE_COMBOBOX, fitz.PDF_WIDGET_TYPE_LISTBOX):
            st.markdown("**Dropdown / List Box Options:**")
            choices_str = ", ".join(selected_field["choice_values"]) if selected_field["choice_values"] else ""
            edited_choices_str = st.text_area(
                "Options (comma-separated):",
                value=choices_str,
                help="Enter choice values separated by commas.",
                height=90,
            )
            new_choices = [c.strip() for c in edited_choices_str.split(",") if c.strip()]

            default_choice_idx = 0
            if current_val in new_choices:
                default_choice_idx = new_choices.index(current_val)

            if new_choices:
                new_val = st.selectbox("Current Selected Option:", options=new_choices, index=default_choice_idx)
            else:
                new_val = st.text_input("Current Selected Option:", value=str(current_val or ""))

        else:
            # Regular text field
            new_val = st.text_area(
                "Field Value:",
                value=str(current_val or ""),
                help="The active entered text content for this field.",
                height=100,
            )

        # 3. Default Value
        new_default = st.text_input(
            "Default Value (/DV fallback):",
            value=str(selected_field["default_value"] or ""),
            help="Initial fallback value displayed when the form is cleared or opened.",
        )

        # Widget Geometry Information
        with st.expander("📍 Widget Geometry & Coordinates", expanded=False):
            r = selected_field["rect"]
            st.text(f"Bounding Box (Points): X0={r[0]}, Y0={r[1]}, X1={r[2]}, Y1={r[3]}")
            st.text(f"Dimensions: {round(r[2] - r[0], 1)} pt × {round(r[3] - r[1], 1)} pt")

        # 4. Save & Update Action Button
        submit_btn = st.form_submit_button("💾 Save Field Properties & Update PDF", use_container_width=True)

        if submit_btn:
            updated_pdf = update_field_in_pdf(
                pdf_bytes=pdf_bytes,
                page_idx=active_page_idx,
                widget_idx=selected_field["widget_idx"],
                original_field_name=selected_field["field_name"],
                new_field_name=new_name,
                new_value=new_val,
                new_export_value=new_export_val,
                new_default_val=new_default,
                new_choices=new_choices,
            )
            st.session_state["current_pdf_bytes"] = updated_pdf
            st.session_state["success_msg"] = f"Field '{new_name}' updated successfully in the PDF document!"
            st.rerun()

    # Dynamic Download Button
    st.divider()
    download_filename = f"modified_{st.session_state['filename']}"
    st.download_button(
        label="⬇️ Download Modified PDF Document",
        data=st.session_state["current_pdf_bytes"],
        file_name=download_filename,
        mime="application/pdf",
        use_container_width=True,
    )

with col_preview:
    st.subheader("👁️ Visual Page Preview")

    # Zoom controls & Page Navigation
    col_pnav, col_zoom = st.columns([3, 2])

    with col_pnav:
        # Page switcher
        page_options = list(range(total_doc_pages))
        current_page_idx = min(st.session_state.get("preview_page_idx", active_page_idx), total_doc_pages - 1)
        selected_preview_page = st.selectbox(
            "Preview Page:",
            options=page_options,
            format_func=lambda p: f"Page {p + 1} of {total_doc_pages}",
            index=current_page_idx,
            key="page_switcher_select",
        )
        st.session_state["preview_page_idx"] = selected_preview_page

    with col_zoom:
        # Safe Zoom Factor slider (guaranteed to match iterable options)
        current_zoom = st.session_state.get("zoom_level", 1.5)
        if current_zoom not in ZOOM_OPTIONS:
            current_zoom = 1.5
            st.session_state["zoom_level"] = 1.5

        zoom_val = st.select_slider(
            "Zoom Factor",
            options=ZOOM_OPTIONS,
            value=current_zoom,
            key="zoom_slider",
        )
        st.session_state["zoom_level"] = zoom_val

    # Dual Viewer Tabs: High-Res PyMuPDF Rendered Preview & Native Embedded PDF
    tab_rendered, tab_embed = st.tabs(["🖼️ PyMuPDF Rendered Preview", "📑 Native Interactive PDF Viewer"])

    with tab_rendered:
        try:
            # Highlight target rect if previewing the active field's page
            highlight_rect = selected_field["rect"] if selected_preview_page == active_page_idx else None

            preview_img = render_page_with_highlight(
                pdf_bytes=st.session_state["current_pdf_bytes"],
                page_idx=selected_preview_page,
                target_rect=highlight_rect,
                zoom_factor=zoom_val,
            )

            caption_txt = (
                f"Page {selected_preview_page + 1} Preview — Highlighting '{selected_field['field_name']}'"
                if highlight_rect
                else f"Page {selected_preview_page + 1} Preview"
            )

            # Version-compatible image rendering (supports Streamlit < 1.39 and >= 1.39)
            render_st_image_compat(preview_img, caption=caption_txt)
        except Exception as err:
            st.error(f"⚠️ Could not render visual image preview: {err}")
            st.info("You can still view the document via the 'Native Interactive PDF Viewer' tab.")

    with tab_embed:
        try:
            base64_pdf = base64.b64encode(st.session_state["current_pdf_bytes"]).decode("utf-8")
            pdf_embed_html = f"""
            <iframe
                src="data:application/pdf;base64,{base64_pdf}#page={selected_preview_page + 1}&toolbar=1&navpanes=1"
                width="100%"
                height="750px"
                type="application/pdf"
                style="border: 1px solid #334155; border-radius: 8px; background-color: #0f172a;"
            >
                <p>Your browser does not support embedded PDF viewing. Please download the PDF to view locally.</p>
            </iframe>
            """
            st.components.v1.html(pdf_embed_html, height=770)
        except Exception as err:
            st.warning(f"Could not load embedded PDF frame: {err}")
