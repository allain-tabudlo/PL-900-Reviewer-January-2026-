import { useMemo, useState } from "react";
import Quiz from "./components/Quiz";
import questionsData from "./data/questions.json";

export default function App() {
  const total = (questionsData as any).count as number;
  const questions = (questionsData as any).questions as any[];

  const [quizCount, setQuizCount] = useState<number>(40);
  const [seed, setSeed] = useState<number>(() => Date.now());
  const [started, setStarted] = useState(false);

  const clampedCount = useMemo(() => {
    const n = Number.isFinite(quizCount) ? Math.floor(quizCount) : 40;
    return Math.max(1, Math.min(n, total));
  }, [quizCount, total]);

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>PL-900 Practice Exam</h1>
          <p className="muted">
            Randomized quiz from your reviewer. Total questions loaded: <b>{total}</b>
          </p>
        </div>
        <div className="right">
          <a className="link" href="https://learn.microsoft.com/credentials/certifications/exams/pl-900/" target="_blank" rel="noreferrer">
            Exam info
          </a>
        </div>
      </header>

      {!started ? (
        <section className="card">
          <h2>Start a new quiz</h2>
          <div className="row">
            <label className="label">
              Number of questions (default 40)
              <input
                className="input"
                type="number"
                min={1}
                max={total}
                value={quizCount}
                onChange={(e) => setQuizCount(parseInt(e.target.value || "40", 10))}
              />
            </label>
          </div>

          <div className="row">
            <button
              className="btn"
              onClick={() => {
                setSeed(Date.now());
                setStarted(true);
              }}
            >
              Start Quiz ({clampedCount} questions)
            </button>
          </div>

          <p className="muted">
            Tip: after finishing, you can review your answers and start a new randomized set.
          </p>
        </section>
      ) : (
        <Quiz
          key={seed}
          allQuestions={questions}
          count={clampedCount}
          onExit={() => setStarted(false)}
          onNewRandom={() => setSeed(Date.now())}
        />
      )}

      <footer className="footer muted">
        Built for personal practice (local app). Questions source: your uploaded reviewer PDF.
      </footer>
    </div>
  );
}
