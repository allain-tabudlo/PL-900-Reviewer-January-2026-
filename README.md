# PL-900 Practice Exam (React)

This is a **local** practice exam web app (React + Vite). It loads questions from your reviewer PDF (already extracted into JSON).

## Features
- Randomly picks **40 questions** (configurable) from the question bank
- Supports **single-answer** and **multi-select** questions
- Checks the answer when you click **Next** (shows correct/wrong)
- Exit anytime to show results based on **answered questions only**
- Shows your **score** on submit
- Shows **correct answers** + your answers (review mode)

## Getting started

1. Install deps:
```bash
npm install
```

2. Run locally:
```bash
npm run dev
```

3. Build:
```bash
npm run build
npm run preview
```

## Question bank

`src/data/questions.json` was generated from your uploaded `pl-900.pdf`.

Loaded questions: **154**

> Note: The PDF contains more than 154 questions, but only questions that match a consistent
multiple-choice pattern (A–E options + `Answer:`) are extracted automatically by the parser.

## (Optional) Re-generate questions.json from a PDF

See `scripts/extract_from_pdf.py`:
```bash
python scripts/extract_from_pdf.py --pdf ./pl-900.pdf --out ./src/data/questions.json
```

