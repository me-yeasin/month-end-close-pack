"use client";

import { useState } from "react";
import {
  IconX,
  IconEdit,
  IconReceipt,
  IconCurrency,
  IconPhoto,
  IconCalendar,
  IconCash,
  IconUser,
  IconFile,
  IconPlus,
  IconLink,
  IconCheck,
} from "@tabler/icons-react";
import styles from "./home.module.css";

interface Field {
  label: string;
  value: string | number | null;
  confidence: number;
  kind: "text" | "date" | "amount" | "currency" | "select";
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface ReceiptReviewProps {
  id: string;
  name: string;
  status: "extracted" | "needs_review";
  fields: Field[];
  matchStatus: "unmatched" | "partial" | "matched";
  matchMeta?: string;
  suggestedCategory?: string;
  onSave?: (updates: Partial<Field>) => void;
  onMatch?: () => void;
}

function confidenceClass(p: number) {
  if (p >= 0.85) return styles.high;
  if (p >= 0.55) return styles.medium;
  return styles.low;
}

function confidenceLabel(p: number) {
  if (p >= 0.85) return "High";
  if (p >= 0.55) return "Medium";
  return "Low";
}

export function ReceiptReviewScreen({
  id,
  name,
  status,
  fields,
  matchStatus,
  matchMeta,
  suggestedCategory,
  onSave,
  onMatch,
}: ReceiptReviewProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const lowConfidenceCount = fields.filter(
    (f) => f.confidence < 0.55 && f.value !== null,
  ).length;

  const startEdit = (key: string) => setEditingId(key);
  const cancelEdit = () => setEditingId(null);

  const commit = (key: string, value: string | number | null) => {
    onSave?.({ [key]: value });
    setEditingId(null);
  };

  return (
    <div className={styles.screen}>
      <div className={styles.sectionHead}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionEyebrow}>Receipt</span>
          <h2 className={styles.sectionH2}>{name}</h2>
        </div>
        <div className={styles.sectionActions}>
          <span
            className={`${styles.statusPill} ${
              matchStatus === "matched"
                ? styles.success
                : matchStatus === "partial"
                ? styles.warning
                : styles.muted
            }`}
          >
            {matchStatus === "matched"
              ? "Matched"
              : matchStatus === "partial"
              ? "Partial"
              : "Unmatched"}
          </span>
          {matchMeta && (
            <span className={styles.tag}>{matchMeta}</span>
          )}
        </div>
      </div>

      {/* low confidence banner */}
      {lowConfidenceCount > 0 && status === "needs_review" && (
        <div className={styles.callout} style={{ margin: "-12px -12px 4px" }}>
          <span className={`${styles.calloutIcon} ${styles.exIcon} ${styles.amber}`}>
            <AlertIcon size={15} stroke={1.8} />
          </span>
          <div>
            <strong>{lowConfidenceCount} field{lowConfidenceCount !== 1 ? "s" : ""} need a look</strong>
            <p style={{ margin: "5px 0 0", color: "inherit" }}>
              Some values were read with low confidence. Check the highlighted
              fields before this receipt is matched to a transaction.
            </p>
          </div>
        </div>
      )}

      {/* receipt art + match link */}
      <div className={styles.section}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "2px 0",
          }}
        >
          <div
            className={`${styles.fileArt} ${styles.pdf}`}
            style={{ width: 48, height: 48 }}
          >
            <IconPhoto size={22} stroke={1.8} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              className={styles.fileName}
              style={{ fontSize: 13, fontWeight: 600 }}
            >
              {name}
            </div>
            <div className={styles.fileMeta}>
              <span>Receipt · {matchStatus === "matched" ? "linked to a transaction" : "not linked"}</span>
            </div>
          </div>
          {matchStatus !== "matched" && onMatch && (
            <button
              type="button"
              className={`${styles.btnSecondary} ${styles.sm}`}
              onClick={onMatch}
            >
              <IconLink size={13} stroke={1.8} />
              Link transaction
            </button>
          )}
        </div>
      </div>

      {/* extracted fields */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionTitle}>
            <span className={styles.sectionEyebrow}>Extracted fields</span>
            <h2 className={styles.sectionH2}>Read from receipt</h2>
          </div>
          <div className={styles.sectionActions}>
            <span className={styles.hintInline}>
              {lowConfidenceCount > 0
                ? `${lowConfidenceCount} low confidence`
                : "All high confidence"}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {fields.map((f) => {
            const editing = editingId === f.label;
            const isLow = f.confidence < 0.55 && f.value !== null;
            return (
              <div
                key={f.label}
                className={styles.detailField}
                style={{ borderColor: isLow ? "#ecd49a" : undefined }}
              >
                <span className={styles.detailFieldLabel}>{f.label}</span>

                <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  {editing ? (
                    <div className={styles.editField}>
                      <input
                        type={f.kind === "date" ? "date" : f.kind === "amount" ? "number" : "text"}
                        defaultValue={
                          f.value ?? ""
                        }
                        placeholder={f.placeholder}
                        autoFocus
                        onChange={(e) => {
                          const v =
                            f.kind === "amount"
                              ? e.target.value === "" ? null : Number(e.target.value)
                              : e.target.value;
                          commit(f.label, v);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const v =
                              f.kind === "amount"
                                ? e.currentTarget.value === ""
                                  ? null
                                  : Number(e.currentTarget.value)
                                : e.currentTarget.value;
                            commit(f.label, v);
                          }
                          if (e.key === "Escape") cancelEdit();
                        }}
                      />
                      <div className={styles.editFieldActions}>
                        <button
                          type="button"
                          className={styles.saveBtn}
                          onClick={() => {
                            const v =
                              f.kind === "amount"
                                ? (document.activeElement as HTMLInputElement).value === ""
                                  ? null
                                  : Number((document.activeElement as HTMLInputElement).value)
                                : (document.activeElement as HTMLInputElement).value;
                            commit(f.label, v);
                          }}
                          aria-label="Save"
                        >
                          <IconCheck size={13} stroke={2} />
                        </button>
                        <button
                          type="button"
                          className={styles.cancelBtn}
                          onClick={cancelEdit}
                          aria-label="Cancel"
                        >
                          <IconX size={13} stroke={2} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <span
                      className={`${styles.detailFieldValue} ${
                        f.value === null ? styles.muted : ""
                      }`}
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      {f.value === null ? (
                        <span className={styles.hintInline}>Not read</span>
                      ) : (
                        <>
                          {f.kind === "amount" && typeof f.value === "number" ? (
                            <span>£{Math.abs(f.value).toFixed(2)}</span>
                          ) : (
                            <span>{String(f.value)}</span>
                          )}
                        </>
                      )}
                      <span
                        className={`${styles.confidence} ${confidenceClass(f.confidence)}`}
                      >
                        <span className={styles.confidenceDot} />
                        {confidenceLabel(f.confidence)}
                      </span>
                    </span>
                  )}

                  {!editing && (
                    <button
                      type="button"
                      className={styles.detailFieldEdit}
                      onClick={() => startEdit(f.label)}
                      title="Edit"
                    >
                      <IconEdit size={13} stroke={1.8} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* category */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionTitle}>
            <span className={styles.sectionEyebrow}>Categorise</span>
            <h2 className={styles.sectionH2}>Suggested category</h2>
          </div>
        </div>

        <div className={styles.choiceGroup}>
          {suggestedCategory && (
            <label className={`${styles.choice} ${styles.selected}`}>
              <input type="radio" name="receipt-category" defaultChecked readOnly />
              <span className={styles.choiceMark} />
              <span className={styles.choiceText}>
                <span className={styles.choiceTitle}>{suggestedCategory}</span>
                <span className={styles.choiceDesc}>Suggested by OCR</span>
              </span>
            </label>
          )}
          <label className={styles.choice}>
            <input type="radio" name="receipt-category" value="travel" />
            <span className={styles.choiceMark} />
            <span className={styles.choiceText}>
              <span className={styles.choiceTitle}>Travel</span>
              <span className={styles.choiceDesc}>Flights, trains, taxis</span>
            </span>
          </label>
          <label className={styles.choice}>
            <input type="radio" name="receipt-category" value="software" />
            <span className={styles.choiceMark} />
            <span className={styles.choiceText}>
              <span className={styles.choiceTitle}>Software and subscriptions</span>
              <span className={styles.choiceDesc}>SaaS, tools, services</span>
            </span>
          </label>
          <label className={styles.choice}>
            <input type="radio" name="receipt-category" value="meals" />
            <span className={styles.choiceMark} />
            <span className={styles.choiceText}>
              <span className={styles.choiceTitle}>Meals and entertainment</span>
              <span className={styles.choiceDesc}>Client meals, events</span>
            </span>
          </label>
          <label className={styles.choice}>
            <input type="radio" name="receipt-category" value="personal" />
            <span className={styles.choiceMark} />
            <span className={styles.choiceText}>
              <span className={styles.choiceTitle}>Personal or excluded</span>
              <span className={styles.choiceDesc}>Not a business expense</span>
            </span>
          </label>
        </div>
      </div>

      {/* VAT */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionTitle}>
            <span className={styles.sectionEyebrow}>VAT treatment</span>
            <h2 className={styles.sectionH2}>How to treat this amount</h2>
          </div>
        </div>
        <div className={styles.choiceGroup}>
          <label className={`${styles.choice} ${styles.selected}`}>
            <input type="radio" name="vat" value="included" defaultChecked readOnly />
            <span className={styles.choiceMark} />
            <span className={styles.choiceText}>
              <span className={styles.choiceTitle}>VAT included</span>
              <span className={styles.choiceDesc}>Amount already contains VAT</span>
            </span>
          </label>
          <label className={styles.choice}>
            <input type="radio" name="vat" value="excluded" />
            <span className={styles.choiceMark} />
            <span className={styles.choiceText}>
              <span className={styles.choiceTitle}>VAT excluded</span>
              <span className={styles.choiceDesc}>Amount is net of VAT</span>
            </span>
          </label>
          <label className={styles.choice}>
            <input type="radio" name="vat" value="not_applicable" />
            <span className={styles.choiceMark} />
            <span className={styles.choiceText}>
              <span className={styles.choiceTitle}>Not applicable</span>
              <span className={styles.choiceDesc}>No VAT, or outside scope</span>
            </span>
          </label>
        </div>
      </div>

      {/* actions */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionTitle}>
            <span className={styles.sectionEyebrow}>Actions</span>
            <h2 className={styles.sectionH2}>Save and continue</h2>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" className={`${styles.btnPrimary} ${styles.full}`}>
            <IconCheck size={14} stroke={1.8} />
            Accept and close
          </button>
          <button type="button" className={`${styles.btnSecondary} ${styles.full}`}>
            <IconCash size={14} stroke={1.8} />
            Mark as personal
          </button>
          <button type="button" className={`${styles.btnDanger} ${styles.full}`}>
            <IconX size={14} stroke={1.8} />
            Remove receipt
          </button>
        </div>
        <div className={styles.callout} style={{ margin: "-12px -12px 0" }}>
          <span className={`${styles.calloutIcon} ${styles.exIcon} ${styles.blue}`}>
            <IconFile size={15} stroke={1.8} />
          </span>
          <p style={{ margin: 0, color: "inherit" }}>
            Raw OCR text is kept for audit, even after you correct fields.
          </p>
        </div>
      </div>
    </div>
  );
}

// minimal icon shim for the alert icon used above
// alert icon shim for the low-confidence banner above
function AlertIcon({ size, stroke }: { size?: number; stroke?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke ?? 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ width: size ?? 15, height: size ?? 15, display: "block" }}
    >
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}
