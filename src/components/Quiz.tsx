import { useEffect, useMemo, useState } from "react";
import type { OptionId, Question } from "../types";
import { sampleWithoutReplacement } from "../lib/shuffle";

type Props = {
  allQuestions: Question[];
  count: number;
  onExit: () => void;
  onNewRandom: () => void;
  durationSeconds: number;
};

type AnswerMap = Record<string, OptionId[]>;

function normalizeKey(q: Question) {
  // stable key for storing answers
  return String(q.questionNo ?? q.id);
}

function setsEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const sa = new Set(a);
  for (const x of b) if (!sa.has(x)) return false;
  return true;
}

export default function Quiz({ allQuestions, count, onExit, onNewRandom, durationSeconds }: Props) {
  const seed = useMemo(() => Date.now(), []);
  const quizQuestions = useMemo(() => sampleWithoutReplacement(allQuestions, count, seed), [allQuestions, count, seed]);

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [submitted, setSubmitted] = useState(false); // overall exam submitted
  const [questionSubmitted, setQuestionSubmitted] = useState(false); // per-question submit
  const [remainingSeconds, setRemainingSeconds] = useState<number>(durationSeconds);

  const current = quizQuestions[idx];

  const score = useMemo(() => {
    let correct = 0;
    for (const q of quizQuestions) {
      const key = normalizeKey(q);
      const user = answers[key] ?? [];
      const right = q.answer ?? [];
      if (setsEqual([...user].sort(), [...right].sort())) correct++;
    }
    return { correct, total: quizQuestions.length };
  }, [answers, quizQuestions]);

  const progress = Math.round(((idx + 1) / quizQuestions.length) * 100);

  // Reset timer when a new quiz instance is created
  useEffect(() => {
    setRemainingSeconds(durationSeconds);
  }, [durationSeconds]);

  // Countdown timer: auto-submit exam when time runs out
  useEffect(() => {
    if (submitted) return;

    const id = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          setSubmitted(true);
          setQuestionSubmitted(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [submitted]);

  function formatTime(total: number) {
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const hh = String(h).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    const ss = String(s).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }

  function setOption(letter: OptionId) {
    const key = normalizeKey(current);
    const prev = answers[key] ?? [];

    if (current.multi) {
      const exists = prev.includes(letter);
      const next = exists ? prev.filter((x) => x !== letter) : [...prev, letter];
      setAnswers({ ...answers, [key]: next });
    } else {
      setAnswers({ ...answers, [key]: [letter] });
    }
  }

  function selected(letter: OptionId) {
    const key = normalizeKey(current);
    return (answers[key] ?? []).includes(letter);
  }

  function go(n: number) {
    setIdx((v) => Math.min(Math.max(0, v + n), quizQuestions.length - 1));
    setQuestionSubmitted(false); // reset per-question submit on navigation
  }

  function handleSubmitQuestion() {
    setQuestionSubmitted(true);
  }

  function handleNext() {
    if (idx < quizQuestions.length - 1) {
      go(1);
    } else {
      setSubmitted(true);
    }
  }

  function handleRetry() {
    setSubmitted(false);
    setQuestionSubmitted(false);
    setAnswers({});
    setIdx(0);
    onNewRandom();
  }

  return (
    <section className="card">
      <div className="quizTop">
        <div>
          <div className="muted">Progress</div>
          <div className="progressWrap" aria-label="progress">
            <div className="progressBar" style={{ width: `${progress}%` }} />
          </div>
          <div className="muted small">
            Question {idx + 1} / {quizQuestions.length}
            {current?.questionNo ? ` • Q#${current.questionNo}` : ""}
            {current?.multi ? " • (Choose all that apply)" : ""}
          </div>
        </div>

        <div className="quizActions">
          <div className="muted small" style={{ marginRight: 8 }}>
            Time left: <b>{formatTime(remainingSeconds)}</b>
          </div>
          <button
            className="btn ghost"
            onClick={() => {
              if (!submitted) setSubmitted(true); // show score
              else onExit();                      // if already submitted, then exit
            }}
          >
            {submitted ? "Exit" : "End Exam"}
          </button>
          <button className="btn ghost" onClick={onNewRandom} disabled={submitted}>
            New Random Set
          </button>
        </div>
      </div>

      <h2 className="qText">{current.question}</h2>

      <div className="options">
        {current.options.map((o) => (
          <label key={o.id} className={"option" + (selected(o.id) ? " selected" : "")}>
            <input
              type={current.multi ? "checkbox" : "radio"}
              name={"q_" + normalizeKey(current)}
              checked={selected(o.id)}
              onChange={() => setOption(o.id)}
              disabled={submitted || questionSubmitted}
            />
            <span className="optLetter">{o.id}</span>
            <span className="optText">{o.text}</span>
          </label>
        ))}
      </div>

      <div className="nav">
        <button className="btn ghost" onClick={() => go(-1)} disabled={idx === 0 || submitted}>
          Previous
        </button>

        {!submitted ? (
          !questionSubmitted ? (
            <button className="btn" onClick={handleSubmitQuestion} disabled={(answers[normalizeKey(current)] ?? []).length === 0}>
              Submit
            </button>
          ) : (
            <button className="btn" onClick={handleNext}>
              {idx < quizQuestions.length - 1 ? "Next" : "Finish Exam"}
            </button>
          )
        ) : (
          <button className="btn" onClick={handleRetry}>
            Retry (new random)
          </button>
        )}
      </div>

      {/* Show feedback for current question only after submit */}
      {!submitted && questionSubmitted && (
        <div className="results">
          {(() => {
            const key = normalizeKey(current);
            const user = (answers[key] ?? []).sort();
            const right = (current.answer ?? []).sort();
            const isCorrect = setsEqual(user, right);

            return (
              <div className={"reviewItem " + (isCorrect ? "ok" : "bad")}>
                <div className="reviewHead">
                  <div className="muted small">
                    {idx + 1}. {current.questionNo ? `Q#${current.questionNo}` : ""}
                  </div>
                  <div className={"pill " + (isCorrect ? "ok" : "bad")}>
                    {isCorrect ? "Correct" : "Wrong"}
                  </div>
                </div>
                <div className="reviewQ">{current.question}</div>
                <div className="reviewA">
                  <div>
                    <span className="muted">Your answer:</span> <b>{user.length ? user.join(", ") : "—"}</b>
                  </div>
                  <div>
                    <span className="muted">Correct:</span> <b>{right.join(", ")}</b>
                  </div>
                </div>
                {!isCorrect && (
                  <div className="reviewOptions">
                    {current.options.map((o) => {
                      const userPicked = user.includes(o.id);
                      const correct = right.includes(o.id);
                      const cls =
                        "miniOpt " +
                        (correct ? "correct " : "") +
                        (userPicked && !correct ? "wrong " : "") +
                        (userPicked && correct ? "picked " : "");
                      return (
                        <div key={o.id} className={cls}>
                          <span className="optLetter">{o.id}</span> {o.text}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Show final review after exam is submitted */}
      {submitted && (
        <div className="results">
          <h3>
            Score: {score.correct} / {score.total} ({Math.round((score.correct / score.total) * 100)}%)
          </h3>

          <div className="review">
            {quizQuestions.map((q, i) => {
              const key = normalizeKey(q);
              const user = (answers[key] ?? []).sort();
              const right = (q.answer ?? []).sort();
              const isCorrect = setsEqual(user, right);

              return (
                <div key={key} className={"reviewItem " + (isCorrect ? "ok" : "bad")}>
                  <div className="reviewHead">
                    <div className="muted small">
                      {i + 1}. {q.questionNo ? `Q#${q.questionNo}` : ""}
                    </div>
                    <div className={"pill " + (isCorrect ? "ok" : "bad")}>
                      {isCorrect ? "Correct" : "Wrong"}
                    </div>
                  </div>
                  <div className="reviewQ">{q.question}</div>
                  <div className="reviewA">
                    <div>
                      <span className="muted">Your answer:</span> <b>{user.length ? user.join(", ") : "—"}</b>
                    </div>
                    <div>
                      <span className="muted">Correct:</span> <b>{right.join(", ")}</b>
                    </div>
                  </div>

                  {!isCorrect && (
                    <div className="reviewOptions">
                      {q.options.map((o) => {
                        const userPicked = user.includes(o.id);
                        const correct = right.includes(o.id);
                        const cls =
                          "miniOpt " +
                          (correct ? "correct " : "") +
                          (userPicked && !correct ? "wrong " : "") +
                          (userPicked && correct ? "picked " : "");
                        return (
                          <div key={o.id} className={cls}>
                            <span className="optLetter">{o.id}</span> {o.text}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
