#!/usr/bin/env python3
"""Extract multiple-choice questions from a PL-900 reviewer PDF into JSON.

This tries to parse blocks with:
- options like `A. ...`, `B. ...` ... up to `E. ...`
- an `Answer: X` line where X is one or more letters (e.g., `Answer: C` or `Answer: AD`)

Usage:
  python scripts/extract_from_pdf.py --pdf ./pl-900.pdf --out ./src/data/questions.json
"""

import argparse, json, re
from pathlib import Path

import pdfplumber

OPTION_RE = re.compile(r'^([A-E])\.\s*(.*)$')
ANSWER_RE = re.compile(r'^Answer:\s*([A-E]{1,5})\s*$')
QNO_RE = re.compile(r'^Question:\s*(\d+)\s+CertyIQ', re.IGNORECASE)

def parse(lines):
    questions=[]
    q_lines=[]
    options={}
    current_opt=None
    current_qno=None
    started=False

    def reset():
        nonlocal q_lines, options, current_opt
        q_lines=[]
        options={}
        current_opt=None

    def finalize(ans_letters):
        nonlocal q_lines, options, current_opt, current_qno, questions
        q_text = " ".join(q_lines).strip()
        q_text = re.sub(r'\s+', ' ', q_text).strip()
        q_text = re.sub(r'Question:\s*\d+\s+CertyIQ', '', q_text, flags=re.IGNORECASE).strip()

        opt_order=[k for k in "ABCDE" if k in options]
        if len(opt_order) < 2 or len(q_text) < 10:
            reset()
            current_qno=None
            return

        opts=[{"id":k, "text":re.sub(r'\s+', ' ', options[k]).strip()} for k in opt_order]
        questions.append({
            "id": int(current_qno) if current_qno else len(questions)+1,
            "questionNo": int(current_qno) if current_qno else None,
            "question": q_text,
            "options": opts,
            "answer": list(ans_letters),
            "multi": len(ans_letters) > 1
        })
        reset()
        current_qno=None

    for ln in lines:
        ln = ln.strip()
        if not ln:
            continue

        m_qno = QNO_RE.match(ln)
        if m_qno:
            started=True
            reset()
            current_qno = m_qno.group(1)
            continue
        if not started:
            continue

        m_ans = ANSWER_RE.match(ln)
        if m_ans:
            finalize(m_ans.group(1))
            continue

        m_opt = OPTION_RE.match(ln)
        if m_opt:
            current_opt=m_opt.group(1)
            options[current_opt]=m_opt.group(2).strip()
            continue

        if ln.startswith(("Explanation:", "Reference:", "https://")):
            continue

        if current_opt and options:
            options[current_opt] += " " + ln
        else:
            if ln.startswith(("HOTSPOT", "DRAG DROP", "Select and Place", "Answer:", "Hot Area:", "NOTE:")):
                continue
            q_lines.append(ln)

    return questions

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pdf", required=True, help="Path to the PDF reviewer")
    ap.add_argument("--out", required=True, help="Output JSON path")
    args = ap.parse_args()

    pdf_path = Path(args.pdf)
    with pdfplumber.open(str(pdf_path)) as pdf:
        pages_text = [p.extract_text() or "" for p in pdf.pages]

    lines = [ln.strip() for ln in "\n".join(pages_text).splitlines()]
    questions = parse(lines)

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps({"count": len(questions), "questions": questions}, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(questions)} questions to {out_path}")

if __name__ == "__main__":
    main()
