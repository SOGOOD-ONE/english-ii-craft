import { PassageNoteRecord, AnnotationStroke } from '@/types/notes';

const STORAGE_PREFIX = 'english_ii_reading_notes_';

export function getPassageNotesKey(year: number, passageId: string): string {
  return `${STORAGE_PREFIX}${year}_${passageId}`;
}

export function getAllPassageNotes(year: number, passageId: string): PassageNoteRecord[] {
  try {
    const raw = localStorage.getItem(getPassageNotesKey(year, passageId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to parse passage notes from storage', e);
    return [];
  }
}

export function savePassageNote(record: PassageNoteRecord): void {
  try {
    const list = getAllPassageNotes(record.year, record.passageId);
    const idx = list.findIndex(item => item.id === record.id);
    if (idx >= 0) {
      list[idx] = { ...record, updatedAt: Date.now() };
    } else {
      list.unshift({ ...record, updatedAt: Date.now() });
    }
    localStorage.setItem(getPassageNotesKey(record.year, record.passageId), JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save passage note', e);
  }
}

export function deletePassageNote(year: number, passageId: string, noteId: string): void {
  try {
    const list = getAllPassageNotes(year, passageId).filter(item => item.id !== noteId);
    localStorage.setItem(getPassageNotesKey(year, passageId), JSON.stringify(list));
  } catch (e) {
    console.error('Failed to delete passage note', e);
  }
}

export function createDefaultNoteRecord(year: number, passageId: string, passageTitle?: string, strokes: AnnotationStroke[] = []): PassageNoteRecord {
  const now = Date.now();
  const dateStr = new Date(now).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  return {
    id: `note_${year}_${passageId}_${now}_${Math.random().toString(36).slice(2, 6)}`,
    year,
    passageId,
    title: `做题批注 (${dateStr})`,
    strokes,
    createdAt: now,
    updatedAt: now,
  };
}
