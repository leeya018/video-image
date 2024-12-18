export interface TranscriptionSegment {
  text: string;
  start: number;
  end: number;
  image?: string;
}

export interface TranscriptionResult {
  segments: TranscriptionSegment[];
  text: string;
}
