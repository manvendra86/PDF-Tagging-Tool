"""
PyMuPDF & Streamlit PDF AcroForm Studio
=======================================
A complete local Python application for inspecting and editing interactive PDF AcroForms,
matching the exact 3-panel studio interface (Field Navigator, Property Editor, and
Visual Page Preview) with PyMuPDF rendering, visible field bounding boxes, one-click
interactive field selection in the preview, and cross-version Streamlit resilience.
"""

import base64
import io
import fitz  # PyMuPDF
from PIL import Image, ImageDraw
import streamlit as st

# Configure Streamlit page layout and metadata matching the Studio Preview
st.set_page_config(
    page_title="PyMuPDF AcroForm Studio",
    page_icon="📄",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# Custom CSS styling to provide the exact sleek dark studio appearance of the preview
st.markdown(
    """
<style>
    /* Global Background and Typography */
    .stApp {
        background-color: #020617;
        color: #f8fafc;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    
    /* Top Header Bar */
    .studio-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 18px;
        background-color: #0f172a;
        border: 1px solid #1e293b;
        border-radius: 10px;
        margin-bottom: 16px;
    }
    .studio-title-box {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    .studio-logo-icon {
        width: 34px;
        height: 34px;
        background: #4f46e5;
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        font-weight: 700;
        font-size: 15px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    .studio-titles h1 {
        margin: 0;
        font-size: 17px;
        font-weight: 700;
        color: #ffffff;
        letter-spacing: -0.01em;
    }
    .studio-titles p {
        margin: 2px 0 0 0;
        font-size: 11px;
        color: #94a3b8;
    }

    /* Badges */
    .badge-text {
        background: rgba(79, 70, 229, 0.25);
        color: #a5b4fc;
        border: 1px solid rgba(79, 70, 229, 0.45);
        padding: 2px 7px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
    }
    .badge-check {
        background: rgba(16, 185, 129, 0.25);
        color: #6ee7b7;
        border: 1px solid rgba(16, 185, 129, 0.45);
        padding: 2px 7px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
    }
    .badge-radio {
        background: rgba(245, 158, 11, 0.25);
        color: #fde68a;
        border: 1px solid rgba(245, 158, 11, 0.45);
        padding: 2px 7px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
    }
    .badge-combo {
        background: rgba(14, 165, 233, 0.25);
        color: #7dd3fc;
        border: 1px solid rgba(14, 165, 233, 0.45);
        padding: 2px 7px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
    }
    .badge-page {
        background: rgba(51, 65, 85, 0.8);
        color: #cbd5e1;
        border: 1px solid #475569;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
    }

    /* Input controls styling */
    div[data-baseweb="input"] {
        background-color: #020617 !important;
        border-color: #334155 !important;
        border-radius: 6px !important;
    }
    div[data-baseweb="textarea"] {
        background-color: #020617 !important;
        border-color: #334155 !important;
        border-radius: 6px !important;
    }
    div[data-baseweb="select"] {
        background-color: #020617 !important;
        border-color: #334155 !important;
        border-radius: 6px !important;
    }

    /* Compact buttons */
    .stButton button {
        border-radius: 6px !important;
        font-size: 11px !important;
        font-weight: 500 !important;
    }
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


def create_sample_fillable_pdf(template: str = "general") -> tuple[bytes, str]:
    """Generate interactive fillable PDFs with visible styled field borders and appearance streams."""
    doc = fitz.open()

    if template == "inspection":
        page = doc.new_page(width=595, height=842)
        page.insert_text(fitz.Point(50, 60), "Equipment Safety & Facility Compliance Audit", fontsize=16, fontname="helv")
        page.insert_text(fitz.Point(50, 85), "Facility Environmental & Machinery Verification Form", fontsize=10, fontname="helv")

        # 1. Text Field: facility_id
        page.insert_text(fitz.Point(50, 130), "Facility Identifier:", fontsize=10)
        rect_loc = fitz.Rect(180, 115, 480, 138)
        page.draw_rect(rect_loc, color=(0.4, 0.45, 0.75), width=1, fill=(0.96, 0.97, 1.0))
        w_loc = fitz.Widget()
        w_loc.rect = rect_loc
        w_loc.field_type = fitz.PDF_WIDGET_TYPE_TEXT
        w_loc.field_name = "facility_id"
        w_loc.field_value = "Building-4B / Cleanroom 2"
        w_loc.border_color = (0.4, 0.45, 0.75)
        w_loc.border_width = 1
        w_loc.fill_color = (0.96, 0.97, 1.0)
        page.add_widget(w_loc)

        # 2. Dropdown: safety_level
        page.insert_text(fitz.Point(50, 175), "Safety Classification:", fontsize=10)
        rect_lvl = fitz.Rect(180, 160, 420, 183)
        page.draw_rect(rect_lvl, color=(0.2, 0.5, 0.8), width=1, fill=(0.95, 0.98, 1.0))
        w_lvl = fitz.Widget()
        w_lvl.rect = rect_lvl
        w_lvl.field_type = fitz.PDF_WIDGET_TYPE_COMBOBOX
        w_lvl.field_name = "safety_level"
        w_lvl.choice_values = ["Level 1 - Low Risk", "Level 2 - Moderate Risk", "Level 3 - High Risk Critical"]
        w_lvl.field_value = "Level 1 - Low Risk"
        w_lvl.border_color = (0.2, 0.5, 0.8)
        w_lvl.border_width = 1
        page.add_widget(w_lvl)

        # 3. Radio Group: inspection_verdict (3 options)
        page.insert_text(fitz.Point(50, 220), "Inspection Verdict:", fontsize=10)
        
        # Option 1: Passed
        r1_rect = fitz.Rect(185, 208, 201, 224)
        c1 = fitz.Point((r1_rect.x0 + r1_rect.x1) / 2, (r1_rect.y0 + r1_rect.y1) / 2)
        page.draw_circle(c1, 7, color=(0.8, 0.5, 0.1), width=1.5, fill=(1.0, 0.98, 0.9))
        page.draw_circle(c1, 3.5, color=(0.8, 0.5, 0.1), fill=(0.8, 0.5, 0.1))
        page.insert_text(fitz.Point(206, 220), "Passed", fontsize=9)
        w_r1 = fitz.Widget()
        w_r1.rect = r1_rect
        w_r1.field_type = fitz.PDF_WIDGET_TYPE_RADIOBUTTON
        w_r1.field_name = "inspection_verdict"
        w_r1.button_caption = "Passed"
        w_r1.field_value = "Passed"
        w_r1.border_color = (0.8, 0.5, 0.1)
        w_r1.border_width = 1.5
        page.add_widget(w_r1)

        # Option 2: Requires Follow-up
        r2_rect = fitz.Rect(260, 208, 276, 224)
        c2 = fitz.Point((r2_rect.x0 + r2_rect.x1) / 2, (r2_rect.y0 + r2_rect.y1) / 2)
        page.draw_circle(c2, 7, color=(0.8, 0.5, 0.1), width=1.5, fill=(1.0, 0.98, 0.9))
        page.insert_text(fitz.Point(281, 220), "Requires Follow-up", fontsize=9)
        w_r2 = fitz.Widget()
        w_r2.rect = r2_rect
        w_r2.field_type = fitz.PDF_WIDGET_TYPE_RADIOBUTTON
        w_r2.field_name = "inspection_verdict"
        w_r2.button_caption = "Requires Follow-up"
        w_r2.field_value = False
        w_r2.border_color = (0.8, 0.5, 0.1)
        w_r2.border_width = 1.5
        page.add_widget(w_r2)

        # Option 3: Critical Fail
        r3_rect = fitz.Rect(400, 208, 416, 224)
        c3 = fitz.Point((r3_rect.x0 + r3_rect.x1) / 2, (r3_rect.y0 + r3_rect.y1) / 2)
        page.draw_circle(c3, 7, color=(0.8, 0.5, 0.1), width=1.5, fill=(1.0, 0.98, 0.9))
        page.insert_text(fitz.Point(421, 220), "Critical Fail", fontsize=9)
        w_r3 = fitz.Widget()
        w_r3.rect = r3_rect
        w_r3.field_type = fitz.PDF_WIDGET_TYPE_RADIOBUTTON
        w_r3.field_name = "inspection_verdict"
        w_r3.button_caption = "Critical Fail"
        w_r3.field_value = False
        w_r3.border_color = (0.8, 0.5, 0.1)
        w_r3.border_width = 1.5
        page.add_widget(w_r3)

        # 4. Checkbox: E-Stops
        page.insert_text(fitz.Point(50, 265), "Emergency Stops Operational:", fontsize=10)
        chk1_rect = fitz.Rect(230, 252, 248, 270)
        page.draw_rect(chk1_rect, color=(0.1, 0.6, 0.3), width=1.5, fill=(0.95, 1.0, 0.95))
        page.insert_text(fitz.Point(233, 266), "✓", fontsize=11, color=(0.1, 0.6, 0.3))
        w_chk1 = fitz.Widget()
        w_chk1.rect = chk1_rect
        w_chk1.field_type = fitz.PDF_WIDGET_TYPE_CHECKBOX
        w_chk1.field_name = "emergency_stops_verified"
        w_chk1.field_value = True
        w_chk1.border_color = (0.1, 0.6, 0.3)
        w_chk1.border_width = 1.5
        page.add_widget(w_chk1)

        # 5. Multiline text: corrective_actions
        page.insert_text(fitz.Point(50, 310), "Corrective Actions Required:", fontsize=10)
        act_rect = fitz.Rect(50, 325, 520, 420)
        page.draw_rect(act_rect, color=(0.4, 0.45, 0.75), width=1, fill=(0.98, 0.98, 1.0))
        w_act = fitz.Widget()
        w_act.rect = act_rect
        w_act.field_type = fitz.PDF_WIDGET_TYPE_TEXT
        w_act.field_name = "corrective_actions"
        w_act.field_value = "Calibrate primary differential pressure sensor before Friday inspection."
        w_act.field_flags = fitz.PDF_TX_FIELD_IS_MULTILINE
        w_act.border_color = (0.4, 0.45, 0.75)
        w_act.border_width = 1
        page.add_widget(w_act)

        res = doc.tobytes(garbage=3, deflate=True)
        doc.close()
        return res, "facility_inspection_audit.pdf"

    elif template == "w4":
        page = doc.new_page(width=595, height=842)
        page.insert_text(fitz.Point(50, 60), "Employee Withholding Allowance Certificate (Form W-4)", fontsize=15, fontname="helv")
        page.insert_text(fitz.Point(50, 85), "Federal Internal Revenue Tax Withholding Document", fontsize=10, fontname="helv")

        # 1. Text Field: first_name
        page.insert_text(fitz.Point(50, 130), "First Name & Initial:", fontsize=10)
        fn_rect = fitz.Rect(180, 115, 480, 138)
        page.draw_rect(fn_rect, color=(0.4, 0.45, 0.75), width=1, fill=(0.96, 0.97, 1.0))
        w_fn = fitz.Widget()
        w_fn.rect = fn_rect
        w_fn.field_type = fitz.PDF_WIDGET_TYPE_TEXT
        w_fn.field_name = "first_name"
        w_fn.field_value = "Alex M."
        w_fn.border_color = (0.4, 0.45, 0.75)
        w_fn.border_width = 1
        page.add_widget(w_fn)

        # 2. Text Field: last_name
        page.insert_text(fitz.Point(50, 175), "Last Name:", fontsize=10)
        ln_rect = fitz.Rect(180, 160, 480, 183)
        page.draw_rect(ln_rect, color=(0.4, 0.45, 0.75), width=1, fill=(0.96, 0.97, 1.0))
        w_ln = fitz.Widget()
        w_ln.rect = ln_rect
        w_ln.field_type = fitz.PDF_WIDGET_TYPE_TEXT
        w_ln.field_name = "last_name"
        w_ln.field_value = "Vanderbilt"
        w_ln.border_color = (0.4, 0.45, 0.75)
        w_ln.border_width = 1
        page.add_widget(w_ln)

        # 3. Radio Group: marital_status (3 options: Single, Married, Head of Household)
        page.insert_text(fitz.Point(50, 220), "Marital Status (Radio):", fontsize=10)

        # Single
        m1_rect = fitz.Rect(185, 208, 201, 224)
        c1 = fitz.Point((m1_rect.x0 + m1_rect.x1)/2, (m1_rect.y0 + m1_rect.y1)/2)
        page.draw_circle(c1, 7, color=(0.8, 0.5, 0.1), width=1.5, fill=(1.0, 0.98, 0.9))
        page.draw_circle(c1, 3.5, color=(0.8, 0.5, 0.1), fill=(0.8, 0.5, 0.1))
        page.insert_text(fitz.Point(206, 220), "Single", fontsize=9)
        w_m1 = fitz.Widget()
        w_m1.rect = m1_rect
        w_m1.field_type = fitz.PDF_WIDGET_TYPE_RADIOBUTTON
        w_m1.field_name = "marital_status"
        w_m1.button_caption = "Single"
        w_m1.field_value = "Single"
        w_m1.border_color = (0.8, 0.5, 0.1)
        w_m1.border_width = 1.5
        page.add_widget(w_m1)

        # Married
        m2_rect = fitz.Rect(255, 208, 271, 224)
        c2 = fitz.Point((m2_rect.x0 + m2_rect.x1)/2, (m2_rect.y0 + m2_rect.y1)/2)
        page.draw_circle(c2, 7, color=(0.8, 0.5, 0.1), width=1.5, fill=(1.0, 0.98, 0.9))
        page.insert_text(fitz.Point(276, 220), "Married", fontsize=9)
        w_m2 = fitz.Widget()
        w_m2.rect = m2_rect
        w_m2.field_type = fitz.PDF_WIDGET_TYPE_RADIOBUTTON
        w_m2.field_name = "marital_status"
        w_m2.button_caption = "Married"
        w_m2.field_value = False
        w_m2.border_color = (0.8, 0.5, 0.1)
        w_m2.border_width = 1.5
        page.add_widget(w_m2)

        # Head of Household
        m3_rect = fitz.Rect(345, 208, 361, 224)
        c3 = fitz.Point((m3_rect.x0 + m3_rect.x1)/2, (m3_rect.y0 + m3_rect.y1)/2)
        page.draw_circle(c3, 7, color=(0.8, 0.5, 0.1), width=1.5, fill=(1.0, 0.98, 0.9))
        page.insert_text(fitz.Point(366, 220), "Head of Household", fontsize=9)
        w_m3 = fitz.Widget()
        w_m3.rect = m3_rect
        w_m3.field_type = fitz.PDF_WIDGET_TYPE_RADIOBUTTON
        w_m3.field_name = "marital_status"
        w_m3.button_caption = "Head of Household"
        w_m3.field_value = False
        w_m3.border_color = (0.8, 0.5, 0.1)
        w_m3.border_width = 1.5
        page.add_widget(w_m3)

        # 4. Dropdown: filing_bracket
        page.insert_text(fitz.Point(50, 265), "Tax Filing Bracket:", fontsize=10)
        brk_rect = fitz.Rect(180, 250, 480, 273)
        page.draw_rect(brk_rect, color=(0.2, 0.5, 0.8), width=1, fill=(0.95, 0.98, 1.0))
        w_brk = fitz.Widget()
        w_brk.rect = brk_rect
        w_brk.field_type = fitz.PDF_WIDGET_TYPE_COMBOBOX
        w_brk.field_name = "filing_bracket"
        w_brk.choice_values = ["Standard Allowance", "Itemized Deduction Bracket", "Exempt Bracket"]
        w_brk.field_value = "Standard Allowance"
        w_brk.border_color = (0.2, 0.5, 0.8)
        w_brk.border_width = 1
        page.add_widget(w_brk)

        # 5. Checkbox: exempt_status
        page.insert_text(fitz.Point(50, 310), "Claim Exemption:", fontsize=10)
        ex_rect = fitz.Rect(180, 298, 198, 316)
        page.draw_rect(ex_rect, color=(0.1, 0.6, 0.3), width=1.5, fill=(0.95, 1.0, 0.95))
        w_ex = fitz.Widget()
        w_ex.rect = ex_rect
        w_ex.field_type = fitz.PDF_WIDGET_TYPE_CHECKBOX
        w_ex.field_name = "exempt_status"
        w_ex.field_value = False
        w_ex.border_color = (0.1, 0.6, 0.3)
        w_ex.border_width = 1.5
        page.add_widget(w_ex)

        res = doc.tobytes(garbage=3, deflate=True)
        doc.close()
        return res, "w4_allowance_form.pdf"

    else:
        # Default General Multi-Page Form
        page1 = doc.new_page(width=595, height=842)
        page1.insert_text(fitz.Point(50, 60), "Sample Fillable PDF Form - Inspection & Testing", fontsize=16, fontname="helv")
        page1.insert_text(fitz.Point(50, 80), "Page 1: User Profile & Contact Information", fontsize=10, fontname="helv")

        # Full Name
        page1.insert_text(fitz.Point(50, 130), "Full Name:", fontsize=10)
        name_rect = fitz.Rect(160, 115, 450, 138)
        page1.draw_rect(name_rect, color=(0.4, 0.45, 0.75), width=1, fill=(0.96, 0.97, 1.0))
        w_name = fitz.Widget()
        w_name.rect = name_rect
        w_name.field_type = fitz.PDF_WIDGET_TYPE_TEXT
        w_name.field_name = "full_name"
        w_name.field_value = "Jane Doe"
        w_name.default_value = "Enter your full legal name"
        w_name.border_color = (0.4, 0.45, 0.75)
        w_name.border_width = 1
        page1.add_widget(w_name)

        # Work Email
        page1.insert_text(fitz.Point(50, 175), "Work Email:", fontsize=10)
        email_rect = fitz.Rect(160, 160, 450, 183)
        page1.draw_rect(email_rect, color=(0.4, 0.45, 0.75), width=1, fill=(0.96, 0.97, 1.0))
        w_email = fitz.Widget()
        w_email.rect = email_rect
        w_email.field_type = fitz.PDF_WIDGET_TYPE_TEXT
        w_email.field_name = "email_address"
        w_email.field_value = "jane.doe@example.org"
        w_email.default_value = "name@company.com"
        w_email.border_color = (0.4, 0.45, 0.75)
        w_email.border_width = 1
        page1.add_widget(w_email)

        # Department ComboBox
        page1.insert_text(fitz.Point(50, 220), "Department:", fontsize=10)
        dept_rect = fitz.Rect(160, 205, 350, 228)
        page1.draw_rect(dept_rect, color=(0.2, 0.5, 0.8), width=1, fill=(0.95, 0.98, 1.0))
        w_dept = fitz.Widget()
        w_dept.rect = dept_rect
        w_dept.field_type = fitz.PDF_WIDGET_TYPE_COMBOBOX
        w_dept.field_name = "department_select"
        w_dept.choice_values = ["Engineering", "Product Design", "Security & Compliance", "Operations"]
        w_dept.field_value = "Engineering"
        w_dept.border_color = (0.2, 0.5, 0.8)
        w_dept.border_width = 1
        page1.add_widget(w_dept)

        # Checkbox: bulletin_opt_in
        page1.insert_text(fitz.Point(50, 265), "Receive Security Bulletins:", fontsize=10)
        chk_rect = fitz.Rect(230, 252, 248, 270)
        page1.draw_rect(chk_rect, color=(0.1, 0.6, 0.3), width=1.5, fill=(0.95, 1.0, 0.95))
        page1.insert_text(fitz.Point(233, 266), "✓", fontsize=11, color=(0.1, 0.6, 0.3))
        w_chk = fitz.Widget()
        w_chk.rect = chk_rect
        w_chk.field_type = fitz.PDF_WIDGET_TYPE_CHECKBOX
        w_chk.field_name = "bulletin_opt_in"
        w_chk.field_value = True
        w_chk.border_color = (0.1, 0.6, 0.3)
        w_chk.border_width = 1.5
        page1.add_widget(w_chk)

        # Radio Buttons: preferred_contact (3 buttons for the same group!)
        page1.insert_text(fitz.Point(50, 310), "Preferred Contact (Radio Group):", fontsize=10)

        # Email radio
        r1_rect = fitz.Rect(210, 298, 226, 314)
        c1 = fitz.Point((r1_rect.x0 + r1_rect.x1)/2, (r1_rect.y0 + r1_rect.y1)/2)
        page1.draw_circle(c1, 7, color=(0.8, 0.5, 0.1), width=1.5, fill=(1.0, 0.98, 0.9))
        page1.draw_circle(c1, 3.5, color=(0.8, 0.5, 0.1), fill=(0.8, 0.5, 0.1))
        page1.insert_text(fitz.Point(230, 310), "Email", fontsize=9)
        w_radio1 = fitz.Widget()
        w_radio1.rect = r1_rect
        w_radio1.field_type = fitz.PDF_WIDGET_TYPE_RADIOBUTTON
        w_radio1.field_name = "preferred_contact"
        w_radio1.button_caption = "Email"
        w_radio1.field_value = "Email"
        w_radio1.border_color = (0.8, 0.5, 0.1)
        w_radio1.border_width = 1.5
        page1.add_widget(w_radio1)

        # Phone radio
        r2_rect = fitz.Rect(290, 298, 306, 314)
        c2 = fitz.Point((r2_rect.x0 + r2_rect.x1)/2, (r2_rect.y0 + r2_rect.y1)/2)
        page1.draw_circle(c2, 7, color=(0.8, 0.5, 0.1), width=1.5, fill=(1.0, 0.98, 0.9))
        page1.insert_text(fitz.Point(310, 310), "Phone", fontsize=9)
        w_radio2 = fitz.Widget()
        w_radio2.rect = r2_rect
        w_radio2.field_type = fitz.PDF_WIDGET_TYPE_RADIOBUTTON
        w_radio2.field_name = "preferred_contact"
        w_radio2.button_caption = "Phone"
        w_radio2.field_value = False
        w_radio2.border_color = (0.8, 0.5, 0.1)
        w_radio2.border_width = 1.5
        page1.add_widget(w_radio2)

        # Postal radio
        r3_rect = fitz.Rect(370, 298, 386, 314)
        c3 = fitz.Point((r3_rect.x0 + r3_rect.x1)/2, (r3_rect.y0 + r3_rect.y1)/2)
        page1.draw_circle(c3, 7, color=(0.8, 0.5, 0.1), width=1.5, fill=(1.0, 0.98, 0.9))
        page1.insert_text(fitz.Point(390, 310), "Postal", fontsize=9)
        w_radio3 = fitz.Widget()
        w_radio3.rect = r3_rect
        w_radio3.field_type = fitz.PDF_WIDGET_TYPE_RADIOBUTTON
        w_radio3.field_name = "preferred_contact"
        w_radio3.button_caption = "Postal"
        w_radio3.field_value = False
        w_radio3.border_color = (0.8, 0.5, 0.1)
        w_radio3.border_width = 1.5
        page1.add_widget(w_radio3)

        # Page 2: Permissions & Multi-select
        page2 = doc.new_page(width=595, height=842)
        page2.insert_text(fitz.Point(50, 60), "Page 2: Role Access & Selections", fontsize=16, fontname="helv")

        # ListBox: Permitted Roles
        page2.insert_text(fitz.Point(50, 120), "Assigned Roles (ListBox):", fontsize=10)
        list_rect = fitz.Rect(50, 135, 300, 220)
        page2.draw_rect(list_rect, color=(0.5, 0.3, 0.8), width=1, fill=(0.97, 0.95, 1.0))
        w_list = fitz.Widget()
        w_list.rect = list_rect
        w_list.field_type = fitz.PDF_WIDGET_TYPE_LISTBOX
        w_list.field_name = "assigned_roles"
        w_list.choice_values = ["Auditor", "Administrator", "Contributor", "Viewer", "Operator"]
        w_list.field_value = "Administrator"
        w_list.border_color = (0.5, 0.3, 0.8)
        w_list.border_width = 1
        page2.add_widget(w_list)

        # Multiline Text: Notes
        page2.insert_text(fitz.Point(50, 270), "Audit Remarks / Notes:", fontsize=10)
        notes_rect = fitz.Rect(50, 285, 520, 390)
        page2.draw_rect(notes_rect, color=(0.4, 0.45, 0.75), width=1, fill=(0.98, 0.98, 1.0))
        w_notes = fitz.Widget()
        w_notes.rect = notes_rect
        w_notes.field_type = fitz.PDF_WIDGET_TYPE_TEXT
        w_notes.field_name = "audit_notes"
        w_notes.field_value = "Initial verification completed. No compliance violations found."
        w_notes.field_flags = fitz.PDF_TX_FIELD_IS_MULTILINE
        w_notes.border_color = (0.4, 0.45, 0.75)
        w_notes.border_width = 1
        page2.add_widget(w_notes)

        # Checkbox: Agreement
        page2.insert_text(fitz.Point(50, 440), "I certify all above inputs are valid:", fontsize=10)
        agree_rect = fitz.Rect(260, 428, 278, 446)
        page2.draw_rect(agree_rect, color=(0.1, 0.6, 0.3), width=1.5, fill=(0.95, 1.0, 0.95))
        w_agree = fitz.Widget()
        w_agree.rect = agree_rect
        w_agree.field_type = fitz.PDF_WIDGET_TYPE_CHECKBOX
        w_agree.field_name = "terms_certified"
        w_agree.field_value = False
        w_agree.border_color = (0.1, 0.6, 0.3)
        w_agree.border_width = 1.5
        page2.add_widget(w_agree)

        output = doc.tobytes(garbage=3, deflate=True)
        doc.close()
        return output, "sample_fillable_form.pdf"


def extract_all_fields(pdf_bytes: bytes) -> list[dict]:
    """Parse all interactive AcroForm widgets across all pages of the document."""
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


def render_page_with_all_fields(
    pdf_bytes: bytes,
    page_idx: int,
    all_fields: list[dict],
    selected_idx: int | None = None,
    zoom_factor: float = 1.5,
) -> Image.Image:
    """
    Render visual PNG preview of the page with ALL editable fields clearly outlined
    and color-coded, plus a prominent glowing highlight & banner over the currently selected field.
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    if page_idx >= len(doc):
        doc.close()
        return Image.new("RGB", (500, 300), color=(15, 23, 42))

    page = doc[page_idx]
    zoom = max(0.5, float(zoom_factor))
    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat, alpha=False, annots=True)

    img = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGBA")
    doc.close()

    draw = ImageDraw.Draw(img)
    page_fields = [f for f in all_fields if f["page_idx"] == page_idx]

    # 1. First Pass: Draw distinct colored outlines and labels for ALL form fields on this page
    for f in page_fields:
        is_active = (f["global_idx"] == selected_idx)
        if is_active:
            continue  # Drawn in high-contrast second pass

        r = f["rect"]
        sx0, sy0, sx1, sy1 = r[0] * zoom, r[1] * zoom, r[2] * zoom, r[3] * zoom
        w_type = f["field_type"]

        if w_type == fitz.PDF_WIDGET_TYPE_RADIOBUTTON:
            outline_col = (245, 158, 11, 220)  # amber
            draw.rectangle([sx0, sy0, sx1, sy1], outline=outline_col, width=max(1, int(1.5 * zoom)))
        elif w_type == fitz.PDF_WIDGET_TYPE_CHECKBOX:
            outline_col = (16, 185, 129, 220)  # emerald
            draw.rectangle([sx0, sy0, sx1, sy1], outline=outline_col, width=max(1, int(1.5 * zoom)))
        elif w_type in (fitz.PDF_WIDGET_TYPE_COMBOBOX, fitz.PDF_WIDGET_TYPE_LISTBOX):
            outline_col = (14, 165, 233, 220)  # sky blue
            draw.rectangle([sx0, sy0, sx1, sy1], outline=outline_col, width=max(1, int(1.5 * zoom)))
        else:
            outline_col = (99, 102, 241, 200)  # indigo
            draw.rectangle([sx0, sy0, sx1, sy1], outline=outline_col, width=max(1, int(1.5 * zoom)))

    # 2. Second Pass: Draw the SELECTED field with glowing thick border and badge
    if selected_idx is not None and 0 <= selected_idx < len(all_fields):
        sel = all_fields[selected_idx]
        if sel["page_idx"] == page_idx:
            r = sel["rect"]
            sx0, sy0, sx1, sy1 = r[0] * zoom, r[1] * zoom, r[2] * zoom, r[3] * zoom
            padding = max(2, int(3 * zoom))
            outer_box = [sx0 - padding, sy0 - padding, sx1 + padding, sy1 + padding]

            # Bold triple-line glowing indigo border
            border_layers = max(2, int(3 * zoom))
            for i in range(border_layers):
                draw.rectangle(
                    [outer_box[0] - i, outer_box[1] - i, outer_box[2] + i, outer_box[3] + i],
                    outline=(79, 70, 229, 255),
                )

            # Top indicator banner pill
            badge_text = f"★ {sel['field_name']} [{sel['field_type_str'].split()[0]}]"
            pill_h = max(14, int(16 * zoom))
            pill_y0 = max(2, outer_box[1] - pill_h - 2)
            pill_y1 = outer_box[1] - 2
            pill_w = max(60, int(len(badge_text) * 7.5 * zoom))
            pill_x1 = min(img.width - 4, outer_box[0] + pill_w)
            
            draw.rectangle([outer_box[0], pill_y0, pill_x1, pill_y1], fill=(79, 70, 229, 250))
            draw.text((outer_box[0] + 5, pill_y0 + 2), badge_text, fill=(255, 255, 255, 255))

    return img.convert("RGB")


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
            # If this is a radio button or grouped widget, update all sibling widgets in the group across document
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
# App State Initialization (Auto-load Default Sample on First Visit)
# ---------------------------------------------------------
if "current_pdf_bytes" not in st.session_state or st.session_state["current_pdf_bytes"] is None:
    init_bytes, init_name = create_sample_fillable_pdf("general")
    st.session_state["current_pdf_bytes"] = init_bytes
    st.session_state["filename"] = init_name

if "filename" not in st.session_state:
    st.session_state["filename"] = "sample_fillable_form.pdf"

if "success_msg" not in st.session_state:
    st.session_state["success_msg"] = None

if "zoom_level" not in st.session_state or st.session_state["zoom_level"] not in ZOOM_OPTIONS:
    st.session_state["zoom_level"] = 1.5

if "selected_field_idx" not in st.session_state:
    st.session_state["selected_field_idx"] = 0

if "preview_page_idx" not in st.session_state:
    st.session_state["preview_page_idx"] = 0


# ---------------------------------------------------------
# Top Studio Header Bar (Matching the Web Studio Header)
# ---------------------------------------------------------
pdf_bytes = st.session_state["current_pdf_bytes"]
fields = extract_all_fields(pdf_bytes) if pdf_bytes else []
total_doc_pages = fitz.open(stream=pdf_bytes, filetype="pdf").page_count if pdf_bytes else 1

header_col_brand, header_col_actions = st.columns([3, 2])

with header_col_brand:
    st.markdown(
        """
        <div class="studio-title-box">
            <div class="studio-logo-icon">Py</div>
            <div class="studio-titles">
                <h1>PyMuPDF AcroForm Studio</h1>
                <p>Interactive PDF Field Inspector & Streamlit Engine</p>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

with header_col_actions:
    btn_col1, btn_col2 = st.columns([1, 1])
    with btn_col2:
        download_filename = f"modified_{st.session_state.get('filename', 'form.pdf')}"
        st.download_button(
            label="⬇️ Export PDF",
            data=st.session_state["current_pdf_bytes"],
            file_name=download_filename,
            mime="application/pdf",
        )

# Transient alerts
if st.session_state.get("success_msg"):
    st.success(st.session_state["success_msg"])
    st.session_state["success_msg"] = None

# If no fields detected
if not fields:
    st.warning("⚠️ No interactive AcroForm fields were detected in this document. Please upload a fillable PDF or choose a sample.")
    st.stop()

# Validate selected field index
if st.session_state["selected_field_idx"] >= len(fields):
    st.session_state["selected_field_idx"] = 0

selected_field = fields[st.session_state["selected_field_idx"]]
active_page_idx = selected_field["page_idx"]

# ---------------------------------------------------------
# Exact 3-Panel Studio Layout:
# 1. Left: Field Sidebar & Sample Forms
# 2. Middle: Property Editor Panel
# 3. Right: Visual Page Preview with Bounding Box & Clickable Selection
# ---------------------------------------------------------
col_sidebar, col_editor, col_preview = st.columns([1.1, 1.4, 2.0], gap="medium")

# =========================================================
# PANEL 1: Field Sidebar (Left)
# =========================================================
with col_sidebar:
    st.markdown(f"### 📋 Detected Fields ({len(fields)})")

    # 1. Upload Section
    uploaded_file = st.file_uploader(
        "Upload Fillable PDF",
        type=["pdf"],
        help="Upload any PDF containing interactive AcroForm fields.",
        label_visibility="collapsed",
    )
    if uploaded_file is not None and st.session_state.get("last_uploaded_name") != uploaded_file.name:
        file_bytes = uploaded_file.read()
        st.session_state["current_pdf_bytes"] = file_bytes
        st.session_state["filename"] = uploaded_file.name
        st.session_state["last_uploaded_name"] = uploaded_file.name
        st.session_state["selected_field_idx"] = 0
        st.session_state["preview_page_idx"] = 0
        st.session_state["success_msg"] = f"Uploaded '{uploaded_file.name}'."
        st.rerun()

    # 2. Quick Sample Forms
    st.markdown("**✨ Quick Sample Forms:**")
    s_col1, s_col2, s_col3 = st.columns(3)
    with s_col1:
        if st.button("Profile Form", key="btn_sample_general", help="2-Page Form with Radio Group, Dropdown, Text & ListBox"):
            b, fn = create_sample_fillable_pdf("general")
            st.session_state["current_pdf_bytes"] = b
            st.session_state["filename"] = fn
            st.session_state["selected_field_idx"] = 0
            st.session_state["preview_page_idx"] = 0
            st.session_state["success_msg"] = "Loaded Profile Form sample."
            st.rerun()
    with s_col2:
        if st.button("Audit Form", key="btn_sample_audit", help="Safety Audit Form with Radio Verdict & Checklist"):
            b, fn = create_sample_fillable_pdf("inspection")
            st.session_state["current_pdf_bytes"] = b
            st.session_state["filename"] = fn
            st.session_state["selected_field_idx"] = 0
            st.session_state["preview_page_idx"] = 0
            st.session_state["success_msg"] = "Loaded Audit Form sample."
            st.rerun()
    with s_col3:
        if st.button("W-4 Form", key="btn_sample_w4", help="Form W-4 with Radio Marital Status & Allowances"):
            b, fn = create_sample_fillable_pdf("w4")
            st.session_state["current_pdf_bytes"] = b
            st.session_state["filename"] = fn
            st.session_state["selected_field_idx"] = 0
            st.session_state["preview_page_idx"] = 0
            st.session_state["success_msg"] = "Loaded W-4 Form sample."
            st.rerun()

    st.markdown("---")

    # 3. Search and Type Filter
    search_q = st.text_input("🔍 Search fields by name, option, or value:", "", placeholder="Filter fields...")
    type_options = ["ALL", "Text Field", "Checkbox", "Radio Button", "ComboBox (Dropdown)", "ListBox (Multi-option)"]
    selected_type_filter = st.selectbox("Type Filter:", type_options, index=0)

    # Filter fields
    filtered_indices = []
    for i, f in enumerate(fields):
        matches_search = (
            search_q.lower() in f["field_name"].lower()
            or search_q.lower() in f["field_type_str"].lower()
            or search_q.lower() in str(f.get("on_state", "")).lower()
            or search_q.lower() in str(f.get("field_value", "")).lower()
        )
        matches_type = (selected_type_filter == "ALL") or (f["field_type_str"] == selected_type_filter)
        if matches_search and matches_type:
            filtered_indices.append(i)

    if not filtered_indices:
        st.info("No fields match your filter.")
        filtered_indices = list(range(len(fields)))

    # Format label for field item
    def format_item_label(idx: int) -> str:
        f = fields[idx]
        val = f.get("field_value")
        w_type = f["field_type"]
        p_str = f"P{f['page_idx'] + 1}"
        nm = f["field_name"]

        if w_type == fitz.PDF_WIDGET_TYPE_RADIOBUTTON:
            opt = f.get("on_state", f"Option_{f['button_idx']}")
            is_sel = (
                val if isinstance(val, bool)
                else (str(val) == str(opt) if val is not None and str(val).strip() else False)
            )
            marker = "●" if is_sel else "○"
            return f"[{p_str} Radio] {nm} ({marker} '{opt}') #{f['button_idx']}/{f.get('total_in_group', 1)}"

        elif w_type == fitz.PDF_WIDGET_TYPE_CHECKBOX:
            chk = "✓" if bool(val) else "✗"
            return f"[{p_str} Check] {nm} ({chk})"

        elif w_type in (fitz.PDF_WIDGET_TYPE_COMBOBOX, fitz.PDF_WIDGET_TYPE_LISTBOX):
            v_disp = str(val)[:15] if val else "(none)"
            return f"[{p_str} Choice] {nm} ('{v_disp}')"

        else:
            v_disp = str(val)[:15] if val else "(empty)"
            return f"[{p_str} Text] {nm} ('{v_disp}')"

    # Default radio index
    default_radio_idx = 0
    if st.session_state.get("selected_field_idx") in filtered_indices:
        default_radio_idx = filtered_indices.index(st.session_state["selected_field_idx"])

    new_selected_idx = st.radio(
        "Select Field:",
        options=filtered_indices,
        format_func=format_item_label,
        index=default_radio_idx,
        label_visibility="collapsed",
    )

    if new_selected_idx != st.session_state["selected_field_idx"]:
        st.session_state["selected_field_idx"] = new_selected_idx
        st.session_state["preview_page_idx"] = fields[new_selected_idx]["page_idx"]
        st.rerun()

    st.caption(f"📁 Document: `{st.session_state['filename']}` | Total Pages: {total_doc_pages}")


# =========================================================
# PANEL 2: Property Editor (Center)
# =========================================================
with col_editor:
    st.markdown("### 🛠️ Field Properties")

    # Header Badges
    badge_type_class = (
        "badge-radio" if selected_field["field_type"] == fitz.PDF_WIDGET_TYPE_RADIOBUTTON
        else "badge-check" if selected_field["field_type"] == fitz.PDF_WIDGET_TYPE_CHECKBOX
        else "badge-combo" if selected_field["field_type"] in (fitz.PDF_WIDGET_TYPE_COMBOBOX, fitz.PDF_WIDGET_TYPE_LISTBOX)
        else "badge-text"
    )

    st.markdown(
        f"""
        <div style="margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
            <span class="badge-page">Page {active_page_idx + 1}</span>
            <span class="{badge_type_class}">{selected_field['field_type_str']}</span>
            <span style="font-family: monospace; font-size: 13px; font-weight: 600; color: #f1f5f9;">
                {selected_field['field_name']}
            </span>
        </div>
        """,
        unsafe_allow_html=True,
    )

    # Sibling Radio Buttons Bar
    if selected_field["field_type"] == fitz.PDF_WIDGET_TYPE_RADIOBUTTON:
        siblings = [
            f for f in fields
            if f["field_type"] == fitz.PDF_WIDGET_TYPE_RADIOBUTTON
            and f["field_name"] == selected_field["field_name"]
        ]
        if len(siblings) > 1:
            st.markdown(f"**Radio Buttons in Group (`{selected_field['field_name']}`):**")
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
                    label = f"{marker}{sib['on_state']}"
                    if is_current:
                        st.button(f"👉 {label}", key=f"sib_btn_{sib['global_idx']}", disabled=True)
                    else:
                        if st.button(label, key=f"sib_btn_{sib['global_idx']}"):
                            st.session_state["selected_field_idx"] = sib["global_idx"]
                            st.session_state["preview_page_idx"] = sib["page_idx"]
                            st.rerun()

    # Form Editor
    with st.form(key=f"editor_form_{selected_field['global_idx']}"):
        # 1. Field Name Identifier
        new_name = st.text_input(
            "Field Name Identifier (/T):",
            value=selected_field["field_name"],
            help="Name identifier of this field in the PDF document.",
        )

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
                help="The token recorded when this checkbox is checked.",
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
            make_active = st.checkbox("Mark this Radio Button as Selected", value=is_radio_active)
            new_val = new_export_val if make_active else False

        elif w_type in (fitz.PDF_WIDGET_TYPE_COMBOBOX, fitz.PDF_WIDGET_TYPE_LISTBOX):
            st.markdown("**Dropdown / List Box Options:**")
            choices_str = ", ".join(selected_field["choice_values"]) if selected_field["choice_values"] else ""
            edited_choices_str = st.text_area(
                "Options (comma-separated):",
                value=choices_str,
                height=80,
            )
            new_choices = [c.strip() for c in edited_choices_str.split(",") if c.strip()]
            default_choice_idx = 0
            if current_val in new_choices:
                default_choice_idx = new_choices.index(current_val)

            if new_choices:
                new_val = st.selectbox("Selected Option:", options=new_choices, index=default_choice_idx)
            else:
                new_val = st.text_input("Selected Option:", value=str(current_val or ""))

        else:
            # Text Field
            new_val = st.text_area(
                "Field Value Content:",
                value=str(current_val or ""),
                height=90,
            )

        # Default Value
        new_default = st.text_input(
            "Default Value (/DV fallback):",
            value=str(selected_field["default_value"] or ""),
        )

        # Coordinates Expander
        with st.expander("📍 Widget Geometry & Coordinates", expanded=False):
            r = selected_field["rect"]
            st.text(f"Bounding Box: [{r[0]}, {r[1]}, {r[2]}, {r[3]}]")
            st.text(f"Dimensions: {round(r[2] - r[0], 1)} pt × {round(r[3] - r[1], 1)} pt")

        # Save Button
        submit_btn = st.form_submit_button("💾 Save Field Properties & Update PDF")

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

    st.markdown("---")
    st.download_button(
        label="⬇️ Download Modified PDF Document",
        data=st.session_state["current_pdf_bytes"],
        file_name=f"modified_{st.session_state['filename']}",
        mime="application/pdf",
    )


# =========================================================
# PANEL 3: Visual Page Preview (Right)
# =========================================================
with col_preview:
    st.markdown("### 👁️ Visual Page Preview")

    # Navigation Controls: Page Switcher & Safe Zoom Slider
    nav_c1, nav_c2 = st.columns([3, 2])

    with nav_c1:
        current_preview_page = min(
            st.session_state.get("preview_page_idx", active_page_idx),
            total_doc_pages - 1,
        )
        selected_preview_page = st.selectbox(
            "Page Navigation:",
            options=list(range(total_doc_pages)),
            format_func=lambda p: f"Page {p + 1} of {total_doc_pages}",
            index=current_preview_page,
            key="page_nav_selector",
        )
        st.session_state["preview_page_idx"] = selected_preview_page

    with nav_c2:
        current_zoom = st.session_state.get("zoom_level", 1.5)
        if current_zoom not in ZOOM_OPTIONS:
            current_zoom = 1.5
            st.session_state["zoom_level"] = 1.5

        zoom_val = st.select_slider(
            "Zoom Factor:",
            options=ZOOM_OPTIONS,
            value=current_zoom,
            key="zoom_factor_slider",
        )
        st.session_state["zoom_level"] = zoom_val

    # =====================================================
    # Quick Interactive Field Selector for the Current Page
    # (Makes every field on this page immediately clickable & selectable!)
    # =====================================================
    page_fields = [f for f in fields if f["page_idx"] == selected_preview_page]

    st.markdown(f"**🎯 Fields on Page {selected_preview_page + 1} ({len(page_fields)} fields) — Click to Select:**")
    if page_fields:
        cols_per_row = 3
        for chunk_i in range(0, len(page_fields), cols_per_row):
            chunk = page_fields[chunk_i : chunk_i + cols_per_row]
            row_cols = st.columns(cols_per_row)
            for c_idx, pf in enumerate(chunk):
                is_this_selected = (pf["global_idx"] == st.session_state["selected_field_idx"])
                type_prefix = (
                    "🔘" if pf["field_type"] == fitz.PDF_WIDGET_TYPE_RADIOBUTTON
                    else "☑️" if pf["field_type"] == fitz.PDF_WIDGET_TYPE_CHECKBOX
                    else "🔽" if pf["field_type"] in (fitz.PDF_WIDGET_TYPE_COMBOBOX, fitz.PDF_WIDGET_TYPE_LISTBOX)
                    else "✍️"
                )
                extra = f" [{pf['on_state']}]" if pf["field_type"] == fitz.PDF_WIDGET_TYPE_RADIOBUTTON else ""
                btn_txt = f"{'👉 ' if is_this_selected else ''}{type_prefix} {pf['field_name']}{extra}"
                
                if row_cols[c_idx].button(
                    btn_txt,
                    key=f"page_field_btn_{pf['global_idx']}",
                    disabled=is_this_selected,
                    help=f"Select {pf['field_name']} ({pf['field_type_str']}) to inspect & edit",
                ):
                    st.session_state["selected_field_idx"] = pf["global_idx"]
                    st.session_state["preview_page_idx"] = pf["page_idx"]
                    st.rerun()

    # Visual Preview Tab & Native PDF Viewer Tab
    tab_rendered, tab_embed = st.tabs(["🖼️ PyMuPDF Rendered Preview", "📑 Native Interactive PDF Viewer"])

    with tab_rendered:
        try:
            # Render page with ALL fields visibly outlined and the selected field highlighted
            preview_img = render_page_with_all_fields(
                pdf_bytes=st.session_state["current_pdf_bytes"],
                page_idx=selected_preview_page,
                all_fields=fields,
                selected_idx=st.session_state["selected_field_idx"],
                zoom_factor=zoom_val,
            )

            caption_txt = (
                f"Page {selected_preview_page + 1} Preview — Editing '{selected_field['field_name']}'"
                if selected_field["page_idx"] == selected_preview_page
                else f"Page {selected_preview_page + 1} Preview"
            )

            # Safely render image with cross-version compatibility
            render_st_image_compat(preview_img, caption=caption_txt)

        except Exception as err:
            st.error(f"⚠️ Could not render visual image preview: {err}")
            st.info("You can also view the document via the 'Native Interactive PDF Viewer' tab.")

    with tab_embed:
        try:
            base64_pdf = base64.b64encode(st.session_state["current_pdf_bytes"]).decode("utf-8")
            pdf_embed_html = f"""
            <iframe
                src="data:application/pdf;base64,{base64_pdf}#page={selected_preview_page + 1}&toolbar=1&navpanes=1"
                width="100%"
                height="720px"
                type="application/pdf"
                style="border: 1px solid #334155; border-radius: 8px; background-color: #0f172a;"
            >
                <p>Your browser does not support embedded PDF viewing. Please use the PyMuPDF Rendered Preview tab or download the PDF.</p>
            </iframe>
            """
            st.components.v1.html(pdf_embed_html, height=740)
        except Exception as err:
            st.warning(f"Could not load embedded PDF frame: {err}")
