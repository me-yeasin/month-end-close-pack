"use client";

import { useEffect, useState } from "react";
import styles from "./home.module.css";
import { MONTHS, SHORT_MONTHS, currentPeriod } from "./period";

interface MonthPickerProps {
  /** Currently-selected period (from the active workspace). */
  month: number;
  year: number;
  /** Commit a month within the currently-viewed year. */
  onSelect: (month: number, year: number) => void;
  /** Request close (Escape key). Outside-click is handled by the parent. */
  onClose: () => void;
}

/**
 * Custom month + year picker.
 *
 *  - A year stepper at the top to move between years (‹ year ›).
 *  - A 3×4 grid of months; clicking one commits the period and closes.
 *  - The current real month is marked with a dot; the selected month is
 *    highlighted in the brand forest colour.
 *  - Escape closes it. Outside-click closing is owned by the parent so the
 *    trigger button can toggle without a double-fire race.
 */
export function MonthPicker({ month, year, onSelect, onClose }: MonthPickerProps) {
  // Local view year lets the user browse other years without committing.
  const [viewYear, setViewYear] = useState(year);
  const today = currentPeriod();
  const selectedInViewYear = year === viewYear;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className={styles.monthPopover} role="dialog" aria-label="Select month and year">
      <div className={styles.monthPopHead}>
        <button
          type="button"
          className={styles.yearNav}
          aria-label="Previous year"
          onClick={() => setViewYear((y) => y - 1)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <span className={styles.yearLabel}>{viewYear}</span>
        <button
          type="button"
          className={styles.yearNav}
          aria-label="Next year"
          onClick={() => setViewYear((y) => y + 1)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>

      <div className={styles.monthGrid}>
        {MONTHS.map((name, i) => {
          const isSelected = selectedInViewYear && i === month;
          const isCurrent = today.year === viewYear && i === today.month;
          return (
            <button
              key={name}
              type="button"
              className={`${styles.monthCell} ${isSelected ? styles.monthCellSelected : ""}`}
              aria-pressed={isSelected}
              title={name}
              onClick={() => onSelect(i, viewYear)}
            >
              {SHORT_MONTHS[i]}
              {isCurrent && (
                <span
                  className={`${styles.monthTodayDot} ${isSelected ? styles.monthTodayDotOnSel : ""}`}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>

      <div className={styles.monthPopFoot}>
        <button
          type="button"
          className={styles.monthTodayBtn}
          onClick={() => onSelect(today.month, today.year)}
        >
          Today · {SHORT_MONTHS[today.month]} {today.year}
        </button>
        <button type="button" className={styles.monthDoneBtn} onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
