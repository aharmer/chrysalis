<div align="center">
<img width="1200" height="475" alt="Chrysalis Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# Chrysalis

**Transforming specimen labels to digital data**

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://vercel.com)
[![Built with Gemini](https://img.shields.io/badge/Powered%20by-Gemini%202.5%20Flash-4285F4?logo=google)](https://ai.google.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)

</div>

---

## Overview

Chrysalis is a browser-based tool for digitising entomological specimen labels using AI vision. Upload images of pinned insect specimens and Chrysalis will automatically read the labels, parse the locality, collector, date, and other curatorial fields, and export a clean CSV ready for import into your collection management system.

It is built for natural history collections professionals and researchers who need to move large batches of physical specimen data into digital form — quickly, accurately, and with human review built in.

---

## Features

- **AI-powered OCR & parsing** — Uses Google Gemini 2.5 Flash to transcribe handwritten and printed specimen labels and structure the data in one pass
- **Batch processing** — Upload multiple images at once and process them sequentially
- **Split-panel editor** — View the specimen image alongside the parsed fields and correct them in real time
- **Review workflow** — Mark records as reviewed to track progress through a digitisation batch
- **Darwin Core–aligned export** — One-click CSV export with fields compatible with standard biodiversity databases (GBIF, ABCD, EMu, etc.)
- **New Zealand Crosby codes** — Built-in support for the standard two-letter regional codes used by NZ collections
- **AI georeferencing** — Estimates decimal latitude/longitude from locality text when coordinates are absent, flagged with `geocode_method: AI-estimated`
- **Configurable prompt & temperature** — Adjust the system prompt and model temperature in-app to tune extraction behaviour for your label types
- **No backend required** — Runs entirely in the browser; your API key and data never leave your machine

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS |
| AI | Google Gemini 2.5 Flash (`@google/genai`) |
| Icons | Lucide React |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- A [Google AI Studio](https://ai.google.dev/) API key with Gemini access

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/chrysalis.git
   cd chrysalis
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. Open `http://localhost:5173` in your browser and enter your Gemini API key when prompted. The key is stored in `localStorage` and is never sent anywhere other than the Gemini API.

### Building for Production

```bash
npm run build
```

The output is in `dist/`. Deploy this directory to any static host (Vercel, Netlify, GitHub Pages, etc.).

---

## Project Structure

```
chrysalis/
├── src/
│   ├── App.tsx                  # Main application & state management
│   ├── index.tsx                # React entry point
│   ├── index.css                # Global styles
│   ├── types.ts                 # TypeScript interfaces
│   ├── constants.ts             # Default system prompt
│   ├── services/
│   │   └── geminiService.ts     # Gemini API client & response parsing
│   └── components/
│       ├── ApiKeyModal.tsx      # API key entry dialog
│       ├── DetailEditor.tsx     # Per-record field editor & image viewer
│       └── DisclaimerModal.tsx  # Accuracy disclaimer on first launch
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## Usage

### 1. Add Images
Click **Add** to upload one or more specimen label images (JPEG, PNG, WEBP, etc.). Images are displayed in the left panel as a queue.

### 2. Process
Click **Run** to send all pending images to Gemini for analysis. Each record is processed sequentially and the results appear in real time. You can process individual records by hovering over a record and clicking the refresh icon.

### 3. Review & Edit
Click any record to open it in the detail editor. The specimen image is shown alongside all parsed fields. Correct any errors, then click **Mark as Reviewed** to flag the record as complete.

Use the **← Prev / Next →** arrows to move through records without returning to the list.

### 4. Export
Click **Export** to download a CSV file of all records. The file includes metadata columns (`filename`, `status`, `reviewed`, `accession_number`) followed by all data fields. Accession numbers are auto-extracted from filenames using a `[Letters][Numbers]` pattern (e.g. `NZAC03028810`).

---

## Data Fields

The following fields are extracted from each label and included in the CSV export:

| Field | Description |
|---|---|
| `accession_number` | Derived from filename (e.g. `NZAC03028810`) |
| `raw_ocr_text` | Full verbatim transcription of all label text |
| `collection_date` | Earliest collection date in `DD-MM-YYYY` format |
| `collection_date_end` | End date for date ranges |
| `collector` | Collector name — surname followed by initials |
| `country` | Country of collection |
| `state` | NZ Crosby code or equivalent regional code |
| `locality` | Parsed and expanded locality name |
| `verbatim_locality` | Exact locality text as it appears on the label |
| `decimal_latitude` | WGS84 latitude (AI-estimated if not on label) |
| `decimal_longitude` | WGS84 longitude (AI-estimated if not on label) |
| `geocode_method` | `AI-estimated` or source of coordinates |
| `altitude` | Altitude/elevation if present |
| `habitat` | Habitat description |
| `method` | Collection method (e.g. Malaise trap, light trap) |
| `determiner` | Identifier (the person who determined the species) |
| `notes` | Any remaining label text not captured elsewhere |

---

## Configuration

### API Key
Your Gemini API key is entered through the in-app modal on first launch and stored in `localStorage`. You can update it at any time by clicking the **API Key** button in the top-right corner.

### System Prompt
The default prompt is tuned for New Zealand entomological collections. You can edit it live via the **Settings** (⚙) panel. Changes apply to all subsequent processing runs within the session.

### Temperature
The model temperature slider (0.0–1.0) controls how deterministic the output is. The default is `0.2` (low temperature = more precise, consistent extraction). Increase it only if you are finding the model too rigid for ambiguous labels.

---

## Accuracy & Disclaimer

Chrysalis uses AI vision to interpret handwritten, typewritten, and printed labels. Accuracy will vary with label quality, handwriting legibility, and image resolution. **All AI-extracted data should be reviewed by a qualified person before being committed to a collection database.** Chrysalis includes a disclaimer prompt on first launch as a reminder of this.

Georeferencing is performed by the AI model based on locality text and is inherently approximate. Always verify coordinates against authoritative gazetteers before publication.

---

## Contributing

Pull requests are welcome. For major changes please open an issue first to discuss the approach.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## Acknowledgements

Developed to support natural history collection digitisation workflows. Label parsing prompt informed by entomological curatorial best practices and the [Darwin Core standard](https://dwc.tdwg.org/).