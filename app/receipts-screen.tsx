"use client";

import { useCallback, useRef, useState } from "react";
import {
  IconUpload,
  IconPhoto,
  IconFileTypePdf,
  IconFileX,
  IconCheck,
  IconAlertTriangle,
  IconRefresh,
  IconPlus,
  IconCloudOff,
} from "@tabler/icons-react";
import styles from "./home.module.css";

interface ReceiptFile {
  id: string;
  name: string;
  type: "image" | "pdf";
  size: number;
  status: "queued" | "processing" | "extracted" | "needs_review" | "failed";
  pages?: number;
  duplicate?: boolean;
  error?: string;
  progress?: number;
}

const STATUS_META: Record<
  ReceiptFile["status"],
  { label: string; cls: string; desc: string }
> = {
  queued: {
    label: "Queued",
    cls: styles.muted,
    desc: "Waiting to be read",
  },
  processing: {
    label: "Reading",
    cls: styles.neutral,
    desc: "OCR in progress",
  },
  extracted: {
    label: "Extracted",
    cls: styles.success,
    desc: "Fields ready",
  },
  needs_review: {
    label: "Needs review",
    cls: styles.warning,
    desc: "Low confidence fields",
  },
  failed: {
    label: "Failed",
    cls: styles.danger,
    desc: "Could not read",
  },
};

const MAX_FILES = 40;
const ALLOWED = ["image/jpeg", "image/png", "application/pdf"];

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ReceiptImportScreen({
  receipts,
  onUpload,
}: {
  receipts: ReceiptFile[];
  onUpload?: (files: File[]) => void;
}) {
  const [dragActive, setDragActive] = useState(false);
  const [bankOnly, setBankOnly] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const accepted = ALLOWED.join(",");

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      const files = Array.from(fileList).filter((f) => ALLOWED.includes(f.type));
      onUpload?.(files);
    },
    [onUpload],
  );

  const onDrag = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true);
      } else {
        setDragActive(false);
      }
    },
    [],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      const files = e.dataTransfer.files;
      handleFiles(files);
    },
    [handleFiles],
  );

  const counts = {
    total: receipts.length,
    queued: receipts.filter((r) => r.status === "queued").length,
    processing: receipts.filter((r) => r.status === "processing").length,
    extracted: receipts.filter((r) => r.status === "extracted").length,
    review: receipts.filter((r) => r.status === "needs_review").length,
    failed: receipts.filter((r) => r.status === "failed").length,
    dupes: receipts.filter((r) => r.duplicate).length,
  };

  const doneCount = counts.extracted + counts.review;
  const progressPct =
    counts.total === 0 ? 0 : Math.round(((counts.extracted + counts.review + counts.processing) / counts.total) * 100);

  return (
    <div className={styles.screen}>
      {/* header */}
      <div className={styles.sectionHead}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionEyebrow}>Receipts</span>
          <h2 className={styles.sectionH2}>Upload receipts</h2>
        </div>
        <div className={styles.sectionActions}>
          <button
            type="button"
            className={`${styles.toggle} ${bankOnly ? "is-on" : ""}`}
            onClick={() => setBankOnly((v) => !v)}
          >
            <input
              type="checkbox"
              className={styles.toggleTrack}
              checked={bankOnly}
              onChange={() => setBankOnly((v) => !v)}
              aria-label="Bank-only mode"
            />
            <span className={styles.toggleTrack} />
            <span className={styles.toggleKnob} />
            <span style={{ marginRight: 6 }}>
              <IconCloudOff size={13} stroke={1.8} />
            </span>
            <span>Bank-only mode</span>
          </button>
        </div>
      </div>

      {/* bank-only callout */}
      {bankOnly && (
        <div className={styles.callout} style={{ margin: "-12px -12px 4px" }}>
          <span className={`${styles.calloutIcon} ${styles.exIcon} ${styles.blue}`}>
            <IconCloudOff size={15} stroke={1.8} />
          </span>
          <div>
            <strong>No receipts this month</strong>
            <p style={{ margin: "5px 0 0", color: "inherit" }}>
              You can still build the pack from your bank files. Receipts can be
              added later and matched back to these transactions.
            </p>
          </div>
          <button
            type="button"
            className={`${styles.btnGhostSmall} ${styles.sm}`}
            style={{ marginLeft: "auto", flexShrink: 0 }}
            onClick={() => setBankOnly(false)}
          >
            Add receipts
          </button>
        </div>
      )}

      {/* drop zone */}
      {!bankOnly && (
        <div
          className={`${styles.dropZone} ${dragActive ? styles.dragover : ""} ${
            receipts.length >= MAX_FILES ? styles.disabled : ""
          }`}
          onDragEnter={onDrag}
          onDragLeave={onDrag}
          onDragOver={onDrag}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Upload receipt images or PDFs"
        >
          <input
            ref={inputRef}
            type="file"
            accept={accepted}
            multiple
            className="sr-only"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <div className={styles.dropZoneIcon}>
            <IconUpload size={22} stroke={1.8} />
          </div>
          <div>
            <div className={styles.dropZoneTitle}>
              Drag receipts here, or choose files
            </div>
            <div className={styles.dropZoneDesc}>
              JPG, PNG, or PDF — including multi-page PDFs. One or many at a
              time.
            </div>
          </div>
          <div className={styles.dropZoneActions}>
            <button
              type="button"
              className={`${styles.btnSecondary} ${styles.sm}`}
            >
              Browse files
            </button>
            <span className={styles.dropZoneHint}>
              or <strong>select a folder</strong>
            </span>
          </div>
          {receipts.length >= MAX_FILES && (
            <div className={styles.dropZoneHint} style={{ color: "var(--red-ink)" }}>
              Limit reached: {MAX_FILES} files
            </div>
          )}
        </div>
      )}

      {/* empty state */}
      {receipts.length === 0 && !bankOnly && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <IconPhoto size={22} stroke={1.8} />
          </div>
          <div className={styles.emptyTitle}>No receipts yet</div>
          <div className={styles.emptyDesc}>
            Upload your receipts next. If you do not have any, switch on bank-only
            mode and the app will continue with your bank transactions only.
          </div>
          <div className={styles.emptyActions}>
            <button
              type="button"
              className={`${styles.btnSecondary} ${styles.sm}`}
              onClick={() => inputRef.current?.click()}
            >
              <IconUpload size={14} stroke={1.8} />
              Choose files
            </button>
            <button
              type="button"
              className={`${styles.btnPrimary} ${styles.sm}`}
            >
              <IconCloudOff size={14} stroke={1.8} />
              Skip receipts this month
            </button>
          </div>
        </div>
      )}

      {/* stats bar */}
      {receipts.length > 0 && (
        <div className={styles.queueProgress}>
          <div className={styles.progress}>
            <div className={styles.progressTrack}>
              <div
                className={`${styles.progressFill} ${
                  progressPct === 100 ? "" : progressPct < 40 ? styles.amber : ""
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className={styles.progressLabel}>{progressPct}% read</span>
          </div>
          <div className={styles.queueStats}>
            <span>
              <strong>{counts.extracted}</strong> read
            </span>
            <span className={styles.sep}>·</span>
            <span>
              <strong>{counts.review}</strong> review
            </span>
            <span className={styles.sep}>·</span>
            <span>
              <strong>{counts.failed}</strong> failed
            </span>
            {counts.dupes > 0 && (
              <>
                <span className={styles.sep}>·</span>
                <span>
                  <strong>{counts.dupes}</strong> dupes skipped
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* file list */}
      {receipts.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionTitle}>
              <span className={styles.sectionEyebrow}>Queue</span>
              <h2 className={styles.sectionH2}>
                {receipts.length} file{receipts.length !== 1 ? "s" : ""}
              </h2>
            </div>
            <div className={styles.sectionActions}>
              <button
                type="button"
                className={`${styles.btnGhostSmall} ${styles.sm}`}
                onClick={() => onUpload?.([])}
              >
                Clear queue
              </button>
              <button
                type="button"
                className={`${styles.btnPrimary} ${styles.sm}`}
              >
                <IconPlus size={14} stroke={1.8} />
                Add more
              </button>
            </div>
          </div>

          <div className={styles.fileList}>
            {receipts.map((r) => (
              <ReceiptRow key={r.id} receipt={r} />
            ))}
          </div>
        </div>
      )}

      {/* processing skeleton */}
      {receipts.some((r) => r.status === "processing") && (
        <div
          className={`${styles.skeleton} ${styles.skeletonCard}`}
          style={{ margin: "16px -20px" }}
          aria-hidden="true"
        >
          <div
            className={`${styles.skeleton} ${styles.skeletonLine}`}
            style={{ width: "35%", height: 11, marginBottom: 12 }}
          />
          <div
            className={`${styles.skeleton} ${styles.skeletonLine}`}
            style={{ width: "60%", height: 12 }}
          />
        </div>
      )}
    </div>
  );
}

function ReceiptRow({ receipt }: { receipt: ReceiptFile }) {
  const m = STATUS_META[receipt.status];
  const [editing, setEditing] = useState(false);

  return (
    <div
      className={`${styles.fileItem} ${receipt.status === "failed" ? styles.failed : ""}`}
    >          <div className={receipt.type === "pdf" ? styles.pdf : styles.image}>
        {receipt.type === "pdf" ? (
          <IconFileTypePdf size={17} stroke={1.8} />
        ) : (
          <IconPhoto size={17} stroke={1.8} />
        )}</div>

      <div className={styles.fileInfo}>
        <div className={styles.fileName}>{receipt.name}</div>
        <div className={styles.fileMeta}>
          <span>{formatSize(receipt.size)}</span>
          {receipt.pages && (
            <>
              <span className={styles.sep}>·</span>
              <span>{receipt.pages} page{receipt.pages !== 1 ? "s" : ""}</span>
            </>
          )}
          {receipt.duplicate && (
            <>
              <span className={styles.sep}>·</span>
              <span className={`${styles.tag} ${styles.amber}`}>Duplicate</span>
            </>
          )}
        </div>
      </div>

      {receipt.status === "processing" && receipt.progress !== undefined && (
        <div style={{ flex: 0, width: 80 }}>
          <div
            className={styles.progress}
            style={{ gap: 6 }}
          >
            <div className={styles.progressTrack} style={{ height: 4 }}>
              <div
                className={styles.progressFill}
                style={{
                  width: `${receipt.progress}%`,
                }}
              />
            </div>
            <span className={styles.progressLabel} style={{ fontSize: 10 }}>
              {Math.round(receipt.progress)}%
            </span>
          </div>
        </div>
      )}

      <div className={styles.fileStatus}>
        <span
          className={`${styles.statusPill} ${m.cls}`}
          title={m.desc}
        >
          {m.label}
        </span>
      </div>

      <div className={styles.fileActions}>
        {receipt.status === "needs_review" && (
          <button
            type="button"
            className={`${styles.fileActionBtn} ${styles.sm}`}
            title="Review fields"
          >
            <IconRefresh size={13} stroke={1.8} />
          </button>
        )}
        {receipt.status === "failed" && (
          <button
            type="button"
            className={`${styles.fileActionBtn} ${styles.sm}`}
            title="Retry"
          >
            <IconRefresh size={13} stroke={1.8} />
          </button>
        )}
        {receipt.status === "extracted" && (
          <button
            type="button"
            className={`${styles.fileActionBtn} ${styles.sm}`}
            title="Review fields"
          >
            <IconCheck size={13} stroke={1.8} />
          </button>
        )}
        <button
          type="button"
          className={`${styles.fileActionBtn} ${styles.danger}`}
          title="Remove"
          onClick={() => {}}
        >
          <IconFileX size={13} stroke={1.8} />
        </button>
      </div>
    </div>
  );
}
