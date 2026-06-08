/**
 * DEMO 1 — The Problem
 *
 * How every AI agent edits Markdown today.
 * Run it once: works fine.
 * Run it twice: watch what happens.
 */

import { readFileSync, writeFileSync } from 'fs';

const newTask = '- [ ] Integrate agent feedback loop';

console.log('\n── DEMO 1: The usual approach ────────────────────────────\n');
console.log('Adding a new task to ## Active using regex...\n');

// Load the entire file as a raw string
const content = readFileSync('./wiki.md', 'utf-8');

// Try to find the Active section and splice in the new task
const updated = content.replace(
  /(### Active\n)([\s\S]*?)(\n###)/,
  `$1$2${newTask}\n$3`
);

if (updated === content) {
  console.log('❌ Regex found nothing. Document structure may have shifted.\n');
  process.exit(1);
}

writeFileSync('./wiki.md', updated);

// Read back and show just the Tasks section
const result = readFileSync('./wiki.md', 'utf-8');
const taskSection = result.match(/## Tasks[\s\S]*?(?=\n## )/)?.[0] ?? '';
console.log('Tasks section after edit:\n');
console.log(taskSection);
console.log('\n⚠️  Run this script a second time and watch what happens.\n');
console.log('────────────────────────────────────────────────────────\n');