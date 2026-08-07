"use client";

import { useState } from "react";
import { steps, type Field } from "@/lib/questions";

type Answers = Record<string, string | string[]>;

const OTHER_PREFIX = "Sonstiges: ";

function isAnswered(field: Field, answers: Answers): boolean {
  const value = answers[field.id];
  if (value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  return value.trim().length > 0;
}

export default function Questionnaire() {
  const [stepIndex, setStepIndex] = useState(0);
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
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    setErrors([]);
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

  if (done) {
    return (
      <div className="card success">
        <div className="check">✓</div>
        <h2>Vielen Dank!</h2>
        <p>
          Ihr Fragebogen wurde erfolgreich übermittelt. Wir melden uns in Kürze
          bei Ihnen, um die nächsten Schritte zu besprechen.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="progress">
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
        <div className="progress-label">
          Schritt {stepIndex + 1} von {steps.length}
        </div>
      </div>

      <div className="card">
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
            Das Absenden hat leider nicht geklappt. Bitte versuchen Sie es noch
            einmal.
          </p>
        )}

        <div className="nav">
          {stepIndex > 0 ? (
            <button type="button" className="btn-secondary" onClick={back}>
              ← Zurück
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
              Weiter →
            </button>
          )}
        </div>
      </div>
    </>
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
              {option}
            </label>
          ))}
        </div>
      )}

      {field.type === "checkbox" && (
        <div className="options">
          {field.options?.map((option) => {
            const selected =
              Array.isArray(value) && value.includes(option);
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
                {option}
              </label>
            );
          })}
        </div>
      )}

      {field.allowOther && (
        <input
          type="text"
          style={{ marginTop: 8 }}
          placeholder="Sonstiges / eigene Angabe …"
          value={otherValue.startsWith(OTHER_PREFIX) ? otherValue.slice(OTHER_PREFIX.length) : otherValue}
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
