# Chrysalis

**Transforming specimen labels to digital data**

**Chrysalis** is a web-based, full-stack application designed to transform entomological specimen labels into digital data using Google Gemini-powered OCR and intelligent entity parsing. Developed to streamline digitizing historical and modern insect labels, Chrysalis reads and classifies locality information, collector metadata, dates, taxonomic determinations, and accession numbers.

---

## 🚀 Key features

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

## 🛠 Recent updates & fixes (v1.1.0)

### 1. Broadened Gemini API Key Validation (Support for Authorization Keys)
*   **The Issue**: Google is transitioning its standard API keys (which traditionally started with `AIzaSy...`) to newer, secure authorization keys (starting with `AQ...`). The previous in-app key validator rejected these newer keys as "invalid format".
*   **The Fix**: Upgraded the API key syntax validator inside the **Set Gemini API Key** modal to allow both traditional `AIza` and newer `AQ` prefixes, enabling seamless usage of the newest Google Developer keys.

### 2. Smart Accession Number Auto-Extraction from Filenames
*   **Feature**: Implemented an automated regex pattern-matching parser that extracts accession numbers directly from specimen image filenames (e.g., extracting `NZAC12345678` from `NZAC12345678_specimen.jpg`). 
*   **Detail**: If no matching code/digit pattern is found, it automatically falls back to checking the extracted OCR text as a candidate accession identifier, and lastly allowing manual typing to fill in the accession number.

### 3. Advanced Taxonomic Fields & Bulk Taxonomy Assignment
*   **Feature**: Introduced a comprehensive taxonomic tracking with dedicated data schema fields for **Order**, **Family**, **Genus**, and **Species**.
*   **Bulk Classifier**: Created a top-level bulk taxonomic applicator pane. Curators can input taxonomic identifiers once (e.g. Order: *Hymenoptera*, Family: *Apidae*) and apply them globally across all imported specimens in the batch with a single click, vastly streamlining series-level processing.
*   **Gemini Extraction**: Augmented the Gemini parser prompt to intelligently extract any verbatim or implied taxonomic designations directly from the label OCR.

---

## 👤 Usage

### 1. Add Images
*   Click **Add** to upload one or more specimen label images (JPEG, PNG, WEBP, etc.). Images are displayed in the left panel as a queue.

### 2. Process
*   Click **Run** to send all pending images to Gemini for analysis. Each record is processed sequentially and the results appear in real time. You can process individual records by hovering over a record and clicking the refresh icon.

### 3. Review & Edit
*   Click any record to open it in the detail editor. The specimen image is shown alongside all parsed fields. Correct any errors, then click **Mark as Reviewed** to flag the record as complete.

Use the **← Prev / Next →** arrows to move through records without returning to the list.

### 4. Export
*   Click **Export** to download a CSV file of all records. The file includes metadata columns (`filename`, `status`, `reviewed`, `accession_number`) followed by all data fields. Accession numbers are auto-extracted from filenames using a `[Letters][Numbers]` pattern (e.g. `NZAC03028810`).

## ⚙️ Configuration

### API Key
Your Gemini API key is entered through the in-app modal on first launch and stored in `localStorage`. You can update it at any time by clicking the **API Key** button in the top-right corner.

### System Prompt
The default prompt is tuned for New Zealand entomological collections. You can edit it live via the **Settings** (⚙) panel. Changes apply to all subsequent processing runs within the session.

### Temperature
The model temperature slider (0.0–1.0) controls how deterministic the output is. The default is `0.2` (low temperature = more precise, consistent extraction). Increase it only if you are finding the model too rigid for ambiguous labels.

---

## 📦 Getting started for devs

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


###    Contributing

Pull requests are welcome. For major changes please open an issue first to discuss the approach.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## Accuracy & Disclaimer

Chrysalis uses AI vision to interpret handwritten, typewritten, and printed labels. Accuracy will vary with label quality, handwriting legibility, and image resolution. **All AI-extracted data should be reviewed by a qualified person before being committed to a collection database.** Chrysalis includes a disclaimer prompt on first launch as a reminder of this.

Georeferencing is performed by the AI model based on locality text and is inherently approximate. Always verify coordinates against authoritative gazetteers before publication.

---

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE).