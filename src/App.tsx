import { useMemo, useState, useEffect } from "react";
import Quiz from "./components/Quiz";
import questionsData from "./data/questions.json";

export default function App() {
  const total = (questionsData as any).count as number;
  const questions = (questionsData as any).questions as any[];

  const [quizCount, setQuizCount] = useState<number>(40);
  const [seed, setSeed] = useState<number>(() => Date.now());
  const [started, setStarted] = useState(false);
  const [hours, setHours] = useState<number>(1);
  const [minutes, setMinutes] = useState<number>(30);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : true; // default to dark
  });

  // Apply theme to <html> and persist preference
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDarkMode ? "dark" : "light");
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      const message = "Are you sure you want to reload the site?";
      event.preventDefault();
      event.returnValue = message; // Most browsers ignore custom text but still show a confirm dialog
      return message;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const clampedCount = useMemo(() => {
    const n = Number.isFinite(quizCount) ? Math.floor(quizCount) : 40;
    return Math.max(1, Math.min(n, total));
  }, [quizCount, total]);

  const durationSeconds = useMemo(() => {
    const safeHours = Number.isFinite(hours) ? Math.min(23, Math.max(0, Math.floor(hours))) : 0;
    const safeMinutes = Number.isFinite(minutes) ? Math.min(59, Math.max(0, Math.floor(minutes))) : 0;
    const totalSeconds = safeHours * 3600 + safeMinutes * 60;
    return Math.max(60, totalSeconds || 0);
  }, [hours, minutes]);

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
          <button
            className="theme-toggle"
            onClick={() => setIsDarkMode(!isDarkMode)}
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? "☀️" : "🌙"}
          </button>
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
            <label className="label">
              Exam timer (default 1 hour 30 minutes)
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className="input"
                  type="number"
                  min={0}
                  max={23}
                  value={hours.toString().slice(0, 2)}
                  onChange={(e) => {
                    const raw = e.target.value.slice(0, 2); // max 2 digits
                    const n = parseInt(raw || "0", 10);
                    const clamped = Math.min(23, Math.max(0, Number.isNaN(n) ? 0 : n));
                    setHours(clamped);
                  }}
                  placeholder="Hours"
                />
                <input
                  className="input"
                  type="number"
                  min={0}
                  max={59}
                  value={minutes.toString().slice(0, 2)}
                  onChange={(e) => {
                    const raw = e.target.value.slice(0, 2); // max 2 digits
                    const n = parseInt(raw || "0", 10);
                    const clamped = Math.min(59, Math.max(0, Number.isNaN(n) ? 0 : n));
                    setMinutes(clamped);
                  }}
                  placeholder="Minutes"
                />
              </div>
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
          durationSeconds={durationSeconds}
        />
      )}

      <footer className="footer muted">
        Built for personal practice (local app). Questions source: your uploaded reviewer PDF.
      </footer>
    </div>
  );
}
