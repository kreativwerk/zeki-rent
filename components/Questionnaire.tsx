"use client";

import { useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { steps, type Field } from "@/lib/questions";

type Answers = Record<string, string | string[]>;

const OTHER_PREFIX = "Sonstiges: ";

// Critically damped default — no overshoot for UI that wasn't flicked
const spring = { type: "spring", bounce: 0, duration: 0.45 } as const;

function isAnswered(field: Field, answers: Answers): boolean {
  const value = answers[field.id];
  if (value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  return value.trim().length > 0;
}

function CheckIcon() {
  return (
    <motion.svg
      className="check"
      viewBox="0 0 22 22"
      fill="none"
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", bounce: 0.35, duration: 0.4 }}
      aria-hidden
    >
      <circle cx="11" cy="11" r="10" fill="currentColor" opacity="0.15" />
      <path
        d="M6.5 11.5l3 3 6-6.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </motion.svg>
  );
}

export default function Questionnaire() {
  const [stepIndex, setStepIndex] = useState(0);
  // +1 = forward, -1 = back; keeps enter/exit on the same spatial path
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState<Answers>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  function setValue(id: string, value: string | string[]) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => prev.filter((e) => e !== id));
  }

  function toggleCheckbox(id: string, option: string) {
    const current = (answers[id] as string[] | undefined) ?? [];
    const next = current.includes(option)
      ? current.filter((o) => o !== option)
      : [...current, option];
    setValue(id, next);
  }

  function validateStep(): boolean {
    const missing = step.fields
      .filter((f) => f.required && !isAnswered(f, answers))
      .map((f) => f.id);
    setErrors(missing);
    return missing.length === 0;
  }

  function next() {
    if (!validateStep()) return;
    setDirection(1);
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    setErrors([]);
    setDirection(-1);
    setStepIndex((i) => Math.max(i - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit() {
    if (!validateStep()) return;
    setSubmitting(true);
    setSubmitError(false);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, submittedAt: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error("submit failed");
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setSubmitError(true);
    } finally {
      setSubmitting(false);
    }
  }

  const progress = done ? 1 : (stepIndex + 1) / steps.length;

  return (
    <MotionConfig reducedMotion="user">
      <div className="topbar">
        <div className="topbar-inner">
          <div className="logo">
            ZEKI <span>RENT</span>
          </div>
          <div className="progress-bar">
            <motion.div
              className="progress-bar-fill"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: progress }}
              transition={spring}
            />
          </div>
          <div className="progress-label">
            {done ? "Fertig" : `${stepIndex + 1} / ${steps.length}`}
          </div>
        </div>
      </div>

      <div className="container">
        {done ? (
          // Materialize, don't just fade
          <motion.div
            className="card success"
            initial={{ opacity: 0, scale: 0.96, filter: "blur(8px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={spring}
          >
            <div className="check-badge">
              <motion.svg
                width="34"
                height="34"
                viewBox="0 0 34 34"
                fill="none"
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: "spring",
                  bounce: 0.35,
                  duration: 0.5,
                  delay: 0.15,
                }}
                aria-hidden
              >
                <path
                  d="M7 18l7 7L27 10"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </motion.svg>
            </div>
            <h2>Vielen Dank!</h2>
            <p>
              Ihr Fragebogen wurde erfolgreich übermittelt. Wir melden uns in
              Kürze bei Ihnen, um die nächsten Schritte zu besprechen.
            </p>
          </motion.div>
        ) : (
          <>
            <header className="header">
              <h1>Ihre neue Webapp für die Transporter&#8209;Vermietung</h1>
              <p>
                Damit wir Ihre Buchungs-Webapp optimal planen können, bitten
                wir Sie, die folgenden Fragen zu beantworten. Dauer: ca. 10
                Minuten.
              </p>
            </header>

            <AnimatePresence mode="popLayout" initial={false} custom={direction}>
              <motion.div
                key={stepIndex}
                className="card"
                custom={direction}
                variants={{
                  // Enter and exit share one path; direction just mirrors it
                  enter: (dir: number) => ({ x: dir * 48, opacity: 0 }),
                  center: { x: 0, opacity: 1 },
                  exit: (dir: number) => ({ x: dir * -48, opacity: 0 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={spring}
              >
                <h2>{step.title}</h2>
                {step.intro && <p className="step-intro">{step.intro}</p>}

                {step.fields.map((field) => (
                  <FieldInput
                    key={field.id}
                    field={field}
                    answers={answers}
                    hasError={errors.includes(field.id)}
                    setValue={setValue}
                    toggleCheckbox={toggleCheckbox}
                  />
                ))}

                {submitError && (
                  <p className="error-text">
                    Das Absenden hat leider nicht geklappt. Bitte versuchen Sie
                    es noch einmal.
                  </p>
                )}

                <div className="nav">
                  {stepIndex > 0 ? (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={back}
                    >
                      Zurück
                    </button>
                  ) : (
                    <span />
                  )}
                  {isLast ? (
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={submit}
                      disabled={submitting}
                    >
                      {submitting ? "Wird gesendet …" : "Fragebogen absenden"}
                    </button>
                  ) : (
                    <button type="button" className="btn-primary" onClick={next}>
                      Weiter
                    </button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </>
        )}

        <footer className="footer">
          Ihre Angaben werden vertraulich behandelt und ausschließlich zur
          Projektplanung verwendet.
        </footer>
      </div>
    </MotionConfig>
  );
}

function FieldInput({
  field,
  answers,
  hasError,
  setValue,
  toggleCheckbox,
}: {
  field: Field;
  answers: Answers;
  hasError: boolean;
  setValue: (id: string, value: string | string[]) => void;
  toggleCheckbox: (id: string, option: string) => void;
}) {
  const value = answers[field.id];
  const otherId = `${field.id}__other`;
  const otherValue = (answers[otherId] as string | undefined) ?? "";

  return (
    <div className="field">
      <label className="field-label" htmlFor={field.id}>
        {field.label}{" "}
        {field.required && <span className="required-star">*</span>}
        {field.hint && <span className="hint">{field.hint}</span>}
      </label>

      {(field.type === "text" ||
        field.type === "email" ||
        field.type === "tel") && (
        <input
          id={field.id}
          type={field.type}
          placeholder={field.placeholder}
          value={(value as string) ?? ""}
          onChange={(e) => setValue(field.id, e.target.value)}
        />
      )}

      {field.type === "textarea" && (
        <textarea
          id={field.id}
          placeholder={field.placeholder}
          value={(value as string) ?? ""}
          onChange={(e) => setValue(field.id, e.target.value)}
        />
      )}

      {field.type === "radio" && (
        <div className="options">
          {field.options?.map((option) => (
            <label
              key={option}
              className={`option ${value === option ? "selected" : ""}`}
            >
              <input
                type="radio"
                name={field.id}
                checked={value === option}
                onChange={() => setValue(field.id, option)}
              />
              <span className="option-text">{option}</span>
              {value === option && <CheckIcon />}
            </label>
          ))}
        </div>
      )}

      {field.type === "checkbox" && (
        <div className="options">
          {field.options?.map((option) => {
            const selected = Array.isArray(value) && value.includes(option);
            return (
              <label
                key={option}
                className={`option ${selected ? "selected" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggleCheckbox(field.id, option)}
                />
                <span className="option-text">{option}</span>
                {selected && <CheckIcon />}
              </label>
            );
          })}
        </div>
      )}

      {field.allowOther && (
        <input
          type="text"
          style={{ marginTop: "0.5rem" }}
          placeholder="Sonstiges / eigene Angabe …"
          value={
            otherValue.startsWith(OTHER_PREFIX)
              ? otherValue.slice(OTHER_PREFIX.length)
              : otherValue
          }
          onChange={(e) =>
            setValue(otherId, e.target.value ? OTHER_PREFIX + e.target.value : "")
          }
        />
      )}

      {hasError && (
        <p className="error-text">Bitte füllen Sie dieses Feld aus.</p>
      )}
    </div>
  );
}
