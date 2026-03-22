export interface SpecimenRecord {
  id: string;
  filename: string;
  imageUrl: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  errorMsg?: string;
  data: EntomologicalData;
  rawText?: string; // The raw OCR text if available
  confidence?: string;
  reviewed: boolean;
}

export interface EntomologicalData {
  raw_ocr_text: string;
  collection_date: string;
  collection_date_end: string;
  collector: string;
  country: string;
  state: string;
  locality: string;
  verbatim_locality: string;
  decimal_latitude: string;
  decimal_longitude: string;
  geocode_method: string;
  altitude: string;
  habitat: string;
  method: string;
  determiner: string;
  notes: string;
}

export type ProcessingStats = {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  reviewed: number;
};