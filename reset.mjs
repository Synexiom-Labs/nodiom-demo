/**
 * Resets wiki.md to its original state.
 * Run between demos: npm run reset
 */

import { writeFileSync } from 'fs';

const original = `# Project Atlas

An AI-powered research assistant for academic teams.

## Overview

Project Atlas automates literature reviews, synthesizes findings across papers,
and generates structured research summaries. Launched February 2026.

## Team

- Maya Patel — Tech Lead
- James Okonkwo — ML Engineer
- Sara Lindqvist — Research Lead
- Dev Sharma — Backend

## Tasks

### Active

- [ ] Train document embedding model on domain corpus
- [ ] Build citation graph extraction pipeline
- [ ] Design researcher feedback interface
- [x] Set up vector database infrastructure

### Completed

- [x] Project charter approved
- [x] Dataset acquisition finalized
- [x] Initial architecture review

### Blocked

- [ ] IRB ethics approval — waiting on university committee
- [ ] GPU cluster access — pending procurement sign-off

## Meeting Notes

### 2026-06-01

Reviewed embedding model benchmarks. Maya flagged that domain-specific fine-tuning
improved retrieval accuracy by 34% over base model. Decision: proceed with full
fine-tuning before the Q3 milestone.

## Risks

1. Ethics approval timeline may push launch past Q3
2. GPU availability is constrained — Ray cluster is at 90% utilization
3. Research lead Sara is splitting time with Project Beacon until July
`;

writeFileSync('./wiki.md', original);
console.log('✓ wiki.md reset to original state. Ready for next demo.\n');