# PDF AcroForm Inspector & Editor (PyMuPDF + Streamlit)

A clean, responsive local Python application to inspect, modify, and export interactive PDF AcroForm field properties with visual page previews.

## Features
- **File Upload & Sampling**: Upload any PDF with AcroForms or click **"Load Sample Fillable PDF"** to test immediately.
- **Automated Field Detection**: Scans all pages using PyMuPDF (`page.widgets()`) and classifies fields (Text, Checkbox, RadioButton, ComboBox, ListBox).
- **Sidebar Field Navigator**: Real-time search filter and instant selection across multi-page forms.
- **Interactive Field Property Editor**: Modify Field Name Identifier, Field Values/States, Dropdown Options (comma-separated), and Default Values.
- **Visual High-Resolution Page Preview**: Renders the exact PDF page with a bounding box highlighting the selected field.
- **In-Memory Save & Download**: Commits changes directly with `widget.update()` and provides instant 1-click download of the updated PDF.

---

## Getting Started Locally

### 1. Prerequisites
Ensure you have **Python 3.10+** and `pip` installed on your machine.

Verify with:
```bash
python --version
pip --version
```

### 2. Clone or Navigate to the Directory
```bash
cd /path/to/project
```

### 3. Create and Activate a Virtual Environment (Recommended)

**On macOS / Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

**On Windows (PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**On Windows (Command Prompt):**
```cmd
python -m venv venv
venv\Scripts\activate.bat
```

### 4. Install Dependencies
Install the required packages using `requirements.txt`:
```bash
pip install -r requirements.txt
```

*(Direct package installation if preferred: `pip install streamlit==1.38.0 pymupdf==1.24.9 Pillow>=10.0.0`)*

### 5. Run the Streamlit Application
Launch the web interface locally:
```bash
streamlit run app.py
```

Streamlit will automatically open your default browser at:
`http://localhost:8501`

---

## How It Works Under the Hood

1. **`doc = fitz.open(stream=pdf_bytes, filetype="pdf")`**: Loads the document in memory without needing temporary files.
2. **`page.widgets()`**: Iterates through AcroForm field annotations on every page.
3. **`widget.field_name` / `widget.field_value` / `widget.choice_values`**: Reads and writes field attributes.
4. **`widget.update()`**: Serializes changes back into the internal PDF Cos/DOM tree.
5. **`page.get_pixmap(matrix=fitz.Matrix(2.0, 2.0))`**: Produces high-resolution raster images of the PDF page, paired with PIL for bounding box indicator highlighting.
6. **`doc.tobytes(garbage=3, deflate=True)`**: Compresses and serializes the modified PDF for instant browser download.
