# Financial Extractor & Research Compiler

A production-ready Next.js 15 application utilizing Gemini 2.5 Flash and `pdf-lib` to parse raw financial statements (PDF, TXT, CSV) and compile standard, publication-grade 4-page equity research reports.

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
Generate PDF
```

---

## 🌟 Key Features

1. **Multi-Format Document Parsing**:
   - Parses text automatically from PDFs (`pdf-parse`), raw TXT files (UTF-8), and CSV files (converting columns into structured JSON arrays).
2. **AI-Powered Structured Data Extraction**:
   - Uses Gemini 2.5 Flash and strict JSON schemas to extract 20+ core corporate statistics (P&L, Balance Sheets, Ratios, Shareholdings).
3. **Professional Equity Research Generation**:
   - Synthesizes growth drivers, investment thesis, risk exposures, and recommendations factually without hallucinations or numerical edits.
4. **Static Server-Side Charts**:
   - Renders 3 clean, publication-style trend graphs (Revenue, EBITDA, PAT) to raw PNG buffers using `chartjs-node-canvas`.
5. **Standard 4-Page PDF Layout Compiler**:
   - Compiles and styles a publication-ready PDF using `pdf-lib` featuring headers, footers, page numbers, grid tables, and embedded graphics.
6. **Premium Minimal Dashboard**:
   - Modern, dark-themed responsive UI built using TailwindCSS, React Hook Form, Zod, and shadcn/ui. Includes toast alerts and interactive checklists.

---

## 📁 Project Folder Structure

```text
financial-extractor/
├── app/
│   ├── api/
│   │   └── generate/
│   │       └── route.ts       # Sequential pipeline orchestrator (Parse -> extract -> analyze -> generate PDF)
│   ├── layout.tsx             # Main HTML wrap and global Toast provider viewport
│   └── page.tsx               # Simplified main dashboard orchestrator
├── components/
│   ├── ui/                    # Base shadcn primitives (card, input, label, button, toast)
│   ├── DropZone.tsx           # Reusable file drag-and-drop zone
│   ├── LoadingProgress.tsx    # Step-by-step processing loading checklist
│   └── ReportSuccess.tsx      # Final success page containing download controls
├── hooks/
│   └── use-toast.ts           # Lightweight reactive state hook for notifications
├── lib/
│   ├── parser.ts              # File format auto-detection and content extractor
│   ├── gemini.ts              # Google Gen AI integration functions (Factual JSON Schema outputs)
│   ├── mapper.ts              # Struct mapping (Financial JSON + Analysis JSON -> ReportData)
│   ├── charts.ts              # Renders Revenue, EBITDA, and PAT bar charts using chartjs-node-canvas
│   ├── pdf.ts                 # Canvas graphics-style 4-page PDF layout rendering engine using pdf-lib
│   └── env.ts                 # Runtime environment variables validation using Zod
├── templates/
│   ├── helpers.ts             # Shared styling constants and table rendering helpers for PDF layouts
│   ├── page1.ts               # Cover page: summary, key changes, company metrics, quarterly consolidated table
│   ├── page2.ts               # Key highlights, trend charts layout, and yearly estimates table
│   ├── page3.ts               # Consolidated financials: P&L projections, BS parameters, return ratios, guidance
│   └── page4.ts               # Compliance: recommendation summary history, criteria matrix, SEBI disclosures
├── types/
│   └── index.ts               # Types definitions (ReportData, AnalysisData, FinancialData)
├── next.config.ts             # Server external package registrations (chartjs-node-canvas/canvas)
├── tailwind.config.ts         # Tailwind CSS styling tokens
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or 20.x
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
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠 Production Compilation

To compile and verify the optimized production bundle:
```bash
npm run build
```
This runs TypeScript compiling, lint checks, and Next.js compiler checks.