export type AnnotationTool = 'pen' | 'highlighter' | 'underline' | 'rect' | 'eraser';

export interface StrokePoint {
  x: number;
  y: number;
}

export interface AnnotationStroke {
  id: string;
  tool: AnnotationTool;
  color: string;
  size: number;
  opacity: number;
  points: StrokePoint[];
  timestamp: number;
}

export interface PassageNoteRecord {
  id: string;
  year: number;
  passageId: string; // 'p1', 'p2', etc.
  title: string;
  strokes: AnnotationStroke[];
  createdAt: number;
  updatedAt: number;
}
