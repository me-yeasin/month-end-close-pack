"use client";

import { useState } from "react";
import styles from "./onboarding.module.css";

type Currency = "GBP" | "EUR";
type VatStatus = "registered" | "unregistered";

export interface WorkspaceSetup {
  name: string;
  currency: Currency;
  vatStatus: VatStatus;
}

const CURRENCY_OPTIONS: { value: Currency; title: string; desc: string }[] = [
  { value: "GBP", title: "£ GBP", desc: "British Pound" },
  { value: "EUR", title: "€ EUR", desc: "Euro" },
];

const VAT_OPTIONS: { value: VatStatus; title: string; desc: string }[] = [
  { value: "registered", title: "VAT registered", desc: "I charge and reclaim VAT" },
  { value: "unregistered", title: "Not registered", desc: "VAT does not apply to me" },
];

export function OnboardingScreen({
  onComplete,
}: {
  onComplete: (setup: WorkspaceSetup) => void;
}) {
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState<Currency>("GBP");
  const [vatStatus, setVatStatus] = useState<VatStatus>("unregistered");
  const [touched, setTouched] = useState(false);

  const nameError = touched && name.trim().length === 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (name.trim().length === 0) return;
    onComplete({ name: name.trim(), currency, vatStatus });
  };

  return (
    <div className={styles.root}>
      {/* top bar */}
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>M</span>
          <span className={styles.brandText}>
            <strong>Month-End</strong>
            <em>pack</em>
          </span>
        </div>
        <span className={styles.localPill}>
          <span className={styles.pulse} />
          On this device
        </span>
      </header>

      {/* main */}
      <main className={styles.main}>
        <div className={styles.layout}>

          {/* left — pitch */}
          <div className={styles.pitch}>
            <span className={styles.eyebrow}>
              <i />
              Welcome
            </span>
            <h1 className={styles.headline}>
              Your monthly<br />
              books, <em>sorted.</em>
            </h1>
            <p className={styles.sub}>
              Upload your bank statements and receipts. We match them, flag the
              problems, and hand you a clean pack your accountant can use
              straight away.
            </p>
            <div className={styles.steps}>
              {[
                { n: "1", title: "Upload bank CSV files", desc: "Drop in your monthly bank exports — we handle the rest." },
                { n: "2", title: "Add your receipts", desc: "Images and PDFs — we read them with local OCR." },
                { n: "3", title: "Review flagged items", desc: "We match everything automatically and only ask about the exceptions." },
                { n: "4", title: "Export the pack", desc: "One ZIP file, ready to send to your accountant." },
              ].map((s) => (
                <div key={s.n} className={styles.step}>
                  <span className={styles.stepNum}>{s.n}</span>
                  <span className={styles.stepText}>
                    <strong>{s.title}</strong> — {s.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* right — form card */}
          <div className={styles.card}>
            <p className={styles.cardEyebrow}>Step 1 of 1</p>
            <h2 className={styles.cardTitle}>Create your workspace</h2>

            <form className={styles.form} onSubmit={handleSubmit} noValidate>

              {/* workspace name */}
              <div className={styles.field}>
                <label className={styles.label} htmlFor="ws-name">
                  Workspace name
                  <span className={styles.req}>Required</span>
                </label>
                <input
                  id="ws-name"
                  type="text"
                  className={`${styles.input} ${nameError ? styles.error : ""}`}
                  placeholder="e.g. Personal books, My Ltd Co."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setTouched(true)}
                  autoComplete="off"
                  autoFocus
                  maxLength={60}
                />
                {nameError && (
                  <span className={styles.errorMsg}>Please give your workspace a name.</span>
                )}
              </div>

              <div className={styles.divider} />

              {/* currency */}
              <div className={styles.field}>
                <span className={styles.label}>Default currency</span>
                <div className={styles.choiceRow}>
                  {CURRENCY_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`${styles.choice} ${currency === opt.value ? styles.selected : ""}`}
                    >
                      <input
                        type="radio"
                        name="currency"
                        value={opt.value}
                        checked={currency === opt.value}
                        onChange={() => setCurrency(opt.value)}
                      />
                      <span className={styles.choiceDot} />
                      <span className={styles.choiceLabel}>
                        <span className={styles.choiceTitle}>{opt.title}</span>
                        <span className={styles.choiceDesc}>{opt.desc}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* vat status */}
              <div className={styles.field}>
                <span className={styles.label}>VAT status</span>
                <div className={styles.choiceGroup}>
                  {VAT_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`${styles.choice} ${vatStatus === opt.value ? styles.selected : ""}`}
                    >
                      <input
                        type="radio"
                        name="vat"
                        value={opt.value}
                        checked={vatStatus === opt.value}
                        onChange={() => setVatStatus(opt.value)}
                      />
                      <span className={styles.choiceDot} />
                      <span className={styles.choiceLabel}>
                        <span className={styles.choiceTitle}>{opt.title}</span>
                        <span className={styles.choiceDesc}>{opt.desc}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.divider} />

              {/* submit */}
              <button type="submit" className={styles.submitBtn}>
                Create workspace
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14" />
                  <path d="m13 6 6 6-6 6" />
                </svg>
              </button>

            </form>

            {/* trust note */}
            <p className={styles.trustNote}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="4" y="10" width="16" height="11" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
              Your data stays on this device. No account, no cloud, no tracking.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
