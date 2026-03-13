export type ScriptItemType = 'audio' | 'pause';

export interface ScriptItem {
  id: string;
  type: ScriptItemType;
  fileName?: string;
  duration?: number; // in seconds, for pauses
}

export interface AudioFile {
  name: string;
  url: string;
  duration?: number;
}
