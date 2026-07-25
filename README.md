# Financial Extractor & Research Compiler

A production-ready Next.js 15 application utilizing Gemini Flash and `pdf-lib` to parse raw financial statements (PDF, TXT, CSV) and compile standard, publication-grade 4-page equity research reports.

---

## 📸 Screenshots & Example Reports

### Dashboard & Processing States
Here is a preview of the premium, dark-themed dashboard, the animated step-by-step progress tracking, and the compilation success state:

![Dashboard Upload Interface](./screenshots/Screenshot%202026-07-25%20121946.png)
![Report Generation Completed](./screenshots/Screenshot%202026-07-25%20122306.png)
![Dynamic Progress Tracking](./screenshots/Screenshot%202026-07-25%20122153.png)

### 📄 Example Output PDFs
Below are sample publication-grade 4-page equity research reports compiled by the system:
*   [ICICI Research Report (PDF)](./examples/ICICI_Research_Report.pdf)
*   [JSW Energy Research Report (PDF)](./examples/JSW_Energy_Research_Report.pdf)
*   [LTTS Research Report (PDF)](./examples/LTTS_Research_Report.pdf)
*   [POCL Research Report (PDF)](./examples/POCL_Research_Report.pdf)

---

## ⚙️ Processing Pipeline

```text
Upload PDF
      ↓
Extract Text
      ↓
Gemini Structured Extraction
      ↓
Validate JSON
      ↓
Generate Narrative
      ↓
Generate PDF (with optional charts)
```

---

## 🌟 Key Features

1. **Multi-Format Document Parsing**:
   - Parses text automatically from PDFs (`pdf-parse`), raw TXT files (UTF-8), and CSV files (converting columns into structured JSON arrays).
2. **AI-Powered Structured Data Extraction**:
   - Uses Gemini Flash and strict JSON schemas to extract 20+ core corporate statistics (P&L, Balance Sheets, Ratios, Shareholdings).
3. **Professional Equity Research Generation**:
   - Synthesizes growth drivers, investment thesis, risk exposures, and recommendations factually without hallucinations or numerical edits.
4. **Static Server-Side Charts with Lazy Loading**:
   - Renders 3 clean, publication-style trend graphs (Revenue, EBITDA, PAT) to raw PNG buffers using `chartjs-node-canvas`. Falls back gracefully without crashing if native `canvas` modules are unavailable.
5. **Serverless Deployment Ready**:
   - Avoids environment initialization crashes on Vercel by polyfilling missing DOM globals (`DOMMatrix`, `ImageData`, `Path2D`) at the API entry point and packaging files explicitly.
6. **Detailed Step 4 Progress Sub-checklist**:
   - Enhances long-running PDF assembly operations with an interactive, animated sub-step checklist that updates every 3 seconds to keep users engaged.
7. **Premium Minimal Dashboard**:
   - Modern, dark-themed responsive UI built using TailwindCSS, React Hook Form, Zod, and shadcn/ui. Includes toast alerts and interactive checklists.

---

## 📁 Project Folder Structure

```text
financial-extractor/
├── app/
│   ├── api/
│   │   └── generate/
│   │       └── route.ts       # Route orchestrator (Sets up polyfills, parses file, calls Gemini, and builds PDF)
│   ├── layout.tsx             # Main HTML wrap and global Toast provider viewport
│   └── page.tsx               # Main dashboard orchestrator
├── components/
│   ├── ui/                    # Base shadcn primitives (card, input, label, button, toast)
│   ├── DropZone.tsx           # Reusable file drag-and-drop zone
│   ├── LoadingProgress.tsx    # Animated step-by-step processing loading checklist with Step 4 sub-steps
│   └── ReportSuccess.tsx      # Final success page containing download controls
├── hooks/
│   └── use-toast.ts           # Lightweight reactive state hook for notifications
├── lib/
│   ├── parser.ts              # File format auto-detection, content extractor, and worker tracing
│   ├── gemini.ts              # Google Gen AI integration functions (Factual JSON Schema outputs)
│   ├── mapper.ts              # Struct mapping (Financial JSON + Analysis JSON -> ReportData)
│   ├── charts.ts              # Lazily-loaded chart builder using chartjs-node-canvas
│   ├── pdf.ts                 # Canvas graphics-style 4-page PDF layout rendering engine using pdf-lib
│   ├── polyfills.ts           # Stub classes for DOMMatrix, ImageData, and Path2D in serverless runtimes
│   └── env.ts                 # Runtime environment variables validation using Zod
├── next.config.ts             # Server external package registrations (chartjs-node-canvas/canvas/pdf-parse)
├── tailwind.config.ts         # Tailwind CSS styling tokens
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20.x or 22.x
- npm / yarn / pnpm

### Installation

1. Clone the repository and install all dependencies:
   ```bash
   npm install
   ```

2. Duplicate the `.env.example` file to `.env.local` and add your Google Gemini API Key:
   ```bash
   cp .env.example .env.local
   ```

3. Populate your `.env.local` file:
   ```env
   GEMINI_API_KEY=AIzaSyYourOwnGeminiKeyFromAIStudio
   ```

### Running Locally

To launch the development server with hot-reloading:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. Running locally has **no file size constraints** and will fully render the trend charts.


## 🛠 Production Compilation

To compile and verify the optimized production bundle locally:
```bash
npm run build
```
This runs TypeScript compiling, lint checks, and Next.js compiler checks.