import fs from 'fs';
import path from 'path';

const storagePath = path.resolve('data', 'storage.json');
if (fs.existsSync(storagePath)) {
  const data = JSON.parse(fs.readFileSync(storagePath, 'utf-8'));
  let cleanedCount = 0;
  if (data.words) {
    for (const [key, word] of Object.entries(data.words)) {
      const senses = word.senses || [];
      const isPlaceholder = senses.some(s =>
        (s.definition && s.definition.includes('语境研读中')) ||
        (s.definition && s.definition.includes('考研高频考点词汇 ['))
      );
      if (isPlaceholder) {
        delete data.words[key];
        cleanedCount++;
      }
    }
  }
  fs.writeFileSync(storagePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`Cleaned ${cleanedCount} placeholder words from storage.json`);
} else {
  console.log('storage.json not found');
}
