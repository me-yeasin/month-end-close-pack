"use client";

import { useCallback, useRef, useState } from "react";
import {
  IconUpload,
  IconPhoto,
  IconFileTypePdf,
  IconFileX,
  IconRefresh,
  IconPlus,
  IconCloudOff,
} from "@tabler/icons-react";
import styles from "./home.module.css";
import { useUiStore } from "./ui-store";

export interface ReceiptFile {
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
  { label: string; cls: string; desc: string; busy?: boolean }
> = {
  queued: {
    label: "Queued",
    cls: styles.muted,
    desc: "Waiting to be read",
  },
  processing: {
    label: "Reading",
    cls: styles.info,
    desc: "OCR in progress — runs locally",
    busy: true,
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
  const bankOnly = useUiStore((s) => s.bankOnly);
  const setBankOnly = useUiStore((s) => s.setBankOnly);
  const inputRef = useRef<HTMLInputElement>(null);

  const accepted = ALLOWED.join(",");
  const hasFiles = receipts.length > 0;
  const isProcessing = receipts.some((r) => r.status === "processing");

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      const files = Array.from(fileList).filter((f) => ALLOWED.includes(f.type));
      onUpload?.(files);
    },
    [onUpload],
  );

  const onDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else {
      setDragActive(false);
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      handleFiles(e.dataTransfer.files);
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
  const readPct =
    counts.total === 0
      ? 0
      : Math.round(((counts.extracted + counts.review) / counts.total) * 100);

  // hero copy — same tone as overview / summary / export
  let heroTitle: React.ReactNode;
  let heroText: string;
  if (isProcessing) {
    heroTitle = (
      <>
        Reading your <em>receipts…</em>
      </>
    );
    heroText = `${counts.total - counts.queued} of ${counts.total} processed. OCR runs locally on this device — nothing is uploaded.`;
  } else if (counts.review > 0) {
    heroTitle = (
      <>
        {counts.review} receipt{counts.review === 1 ? "" : "s"} need a{" "}
        <em>quick look.</em>
      </>
    );
    heroText = `Some fields came back with low confidence. Check them against the file before the pack is built.`;
  } else if (counts.failed > 0) {
    heroTitle = (
      <>
        {counts.failed} receipt{counts.failed === 1 ? "" : "s"}{" "}
        <em>failed to read.</em>
      </>
    );
    heroText = `Retake the photo or try a clearer scan, then retry those files.`;
  } else if (hasFiles) {
    heroTitle = (
      <>
        Receipts are <em>ready.</em>
      </>
    );
    heroText = `All ${counts.total} receipt${counts.total === 1 ? "" : "s"} read. Extracted fields will match back to your bank transactions.`;
  } else {
    heroTitle = (
      <>
        Start with your <em>receipts.</em>
      </>
    );
    heroText =
      "Drop in this month's receipts — we read them locally, extract vendor, date and total, then match them to your bank transactions.";
  }

  return (
    <div className={styles.screen}>
      {/* ------------------------------ header ------------------------------ */}
      <div className={styles.sectionHead}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionEyebrow}>Receipts</span>
          <h2 className={styles.sectionH2}>Receipt queue</h2>
        </div>
        <div className={styles.sectionActions}>
          <button
            type="button"
            className={`${styles.toggle} ${bankOnly ? styles.toggleOn : ""}`}
            onClick={() => setBankOnly(!bankOnly)}
            role="switch"
            aria-checked={bankOnly}
            aria-label="Bank-only mode — skip receipts this month"
          >
            <span className={styles.toggleTrack}>
              <span className={styles.toggleKnob} />
            </span>
            <IconCloudOff size={13} stroke={1.8} />
            <span>Bank-only mode</span>
          </button>
        </div>
      </div>

      {/* ------------------------------ hero ------------------------------ */}
      <section className={styles.hero} aria-labelledby="receipts-title">
        <div className={styles.heroCopy}>
          <div className={styles.heroEyebrow}>
            <i aria-hidden="true" />
            Receipt queue
          </div>
          <h1 id="receipts-title">{heroTitle}</h1>
          <p>{heroText}</p>
          <div className={styles.heroActions}>
            {!hasFiles ? (
              <>
                <button
                  type="button"
                  className={`${styles.btnPrimary} ${styles.btnAmber}`}
                  onClick={() => inputRef.current?.click()}
                >
                  <IconUpload size={15} stroke={2} />
                  Browse files
                </button>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setBankOnly(true)}
                >
                  <IconCloudOff size={15} stroke={1.8} />
                  Skip receipts
                </button>
              </>
            ) : null}
          </div>
        </div>

        {hasFiles ? (
          <div
            className={styles.heroRing}
            role="img"
            aria-label={`${readPct}% of receipts read`}
          >
            <svg className={styles.ring} viewBox="0 0 140 140" aria-hidden="true">
              <defs>
                <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#F5EFDD" />
                  <stop offset="0.55" stopColor="#F0C877" />
                  <stop offset="1" stopColor="#E7B24A" />
                </linearGradient>
              </defs>
              <circle className={styles.ringTrack} cx="70" cy="70" r="56" />
              <circle
                className={styles.ringValue}
                cx="70"
                cy="70"
                r="56"
                style={{ strokeDasharray: `${(readPct / 100) * 351.9} 351.9` }}
              />
            </svg>
            <div className={styles.ringLabel}>
              <strong>
                {readPct}
                <span>%</span>
              </strong>
              <span>read</span>
            </div>
          </div>
        ) : (
          <div className={styles.heroEmpty} aria-hidden="true">
            <span className={styles.heroEmptyRing}>
              <IconPhoto size={30} stroke={1.5} />
            </span>
            <span className={styles.heroEmptyLabel}>No receipts yet</span>
          </div>
        )}
      </section>

      {/* ------------------------------ drop zone (zero state) ------------------------------ */}
      {!hasFiles && (
        <>
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
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
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
                JPG, PNG or PDF — including multi-page PDFs. One or many at a
                time.
              </div>
            </div>
            <div className={styles.dropZoneActions}>
              <button
                type="button"
                className={`${styles.btnSecondary} ${styles.sm}`}
                tabIndex={-1}
              >
                Browse files
              </button>
            </div>
          </div>
          <p className={styles.sumNote}>
            Receipts are read locally by on-device OCR. Nothing is uploaded —
            extracted fields stay on this device until you export the pack.
          </p>
        </>
      )}

      {/* ------------------------------ stats strip ------------------------------ */}
      {hasFiles && (
        <section className={styles.sumTotals} aria-label="Queue at a glance">
          <div className={styles.sumTotal}>
            <span className={styles.sumTotalLabel}>Files</span>
            <strong className={styles.sumTotalValue}>{counts.total}</strong>
          </div>
          <div className={styles.sumTotal}>
            <span className={styles.sumTotalLabel}>Read</span>
            <strong className={`${styles.sumTotalValue} ${styles.sumTotalIn}`}>
              {counts.extracted}
            </strong>
          </div>
          <div className={styles.sumTotal}>
            <span className={styles.sumTotalLabel}>Needs review</span>
            <strong
              className={`${styles.sumTotalValue} ${
                counts.review > 0 ? styles.sumTotalWarn : styles.sumTotalNet
              }`}
            >
              {counts.review}
            </strong>
          </div>
        </section>
      )}

      {/* ------------------------------ queue ------------------------------ */}
      {hasFiles && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionTitle}>
              <span className={styles.sectionEyebrow}>
                {counts.queued + counts.processing > 0
                  ? "In progress"
                  : "Completed"}
              </span>
              <h2 className={styles.sectionH2}>
                {counts.total} file{counts.total !== 1 ? "s" : ""}
                {counts.failed > 0 && ` · ${counts.failed} failed`}
                {counts.dupes > 0 && ` · ${counts.dupes} duplicate${counts.dupes !== 1 ? "s" : ""}`}
              </h2>
            </div>
            <div className={styles.sectionActions}>
              <button
                type="button"
                className={styles.btnGhostSmall}
                onClick={() => onUpload?.([])}
              >
                Clear queue
              </button>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => inputRef.current?.click()}
                disabled={receipts.length >= MAX_FILES}
                title={
                  receipts.length >= MAX_FILES
                    ? `Limit reached: ${MAX_FILES} files`
                    : "Add more receipts"
                }
              >
                <IconPlus size={14} stroke={1.8} />
                Add more
              </button>
            </div>
          </div>

          {/* hidden input also available in the data state */}
          <input
            ref={inputRef}
            type="file"
            accept={accepted}
            multiple
            className="sr-only"
            onChange={(e) => handleFiles(e.target.files)}
          />

          <div className={styles.fileList}>
            {receipts.map((r) => (
              <ReceiptRow key={r.id} receipt={r} />
            ))}
          </div>

          <p className={styles.sumNote}>
            Read receipts are matched to your bank transactions automatically —
            unmatched ones surface in Review.
          </p>
        </section>
      )}
    </div>
  );
}

function ReceiptRow({ receipt }: { receipt: ReceiptFile }) {
  const m = STATUS_META[receipt.status];
  const iconCls = receipt.type === "pdf" ? styles.pdf : styles.image;

  return (
    <div
      className={`${styles.fileItem} ${receipt.status === "failed" ? styles.failed : ""}`}
    >
      <div className={iconCls}>
        {receipt.type === "pdf" ? (
          <IconFileTypePdf size={17} stroke={1.8} />
        ) : (
          <IconPhoto size={17} stroke={1.8} />
        )}
      </div>

      <div className={styles.fileInfo}>
        <div className={styles.fileName}>{receipt.name}</div>
        <div className={styles.fileMeta}>
          <span>{formatSize(receipt.size)}</span>
          {receipt.pages && (
            <>
              <span className={styles.sep}>·</span>
              <span>
                {receipt.pages} page{receipt.pages !== 1 ? "s" : ""}
              </span>
            </>
          )}
          {receipt.duplicate && (
            <>
              <span className={styles.sep}>·</span>
              <span className={`${styles.tag} ${styles.amber}`}>Duplicate</span>
            </>
          )}
        </div>
        {receipt.status === "failed" && receipt.error && (
          <div className={styles.rxError}>{receipt.error}</div>
        )}
      </div>

      {receipt.status === "processing" && receipt.progress !== undefined && (
        <div className={styles.rxProgress}>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${receipt.progress}%` }}
            />
          </div>
          <span className={styles.progressLabel}>
            {Math.round(receipt.progress)}%
          </span>
        </div>
      )}

      <div className={styles.fileStatus}>
        <span
          className={`${styles.statusPill} ${m.cls} ${m.busy ? styles.rxBusy : ""}`}
          title={m.desc}
        >
          {m.busy && (
            <svg
              className={styles.spin}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.4}
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M21 12a9 9 0 1 1-6.2-8.5" />
            </svg>
          )}
          {m.label}
        </span>
      </div>

      <div className={styles.fileActions}>
        {(receipt.status === "needs_review" || receipt.status === "failed") && (
          <button
            type="button"
            className={styles.fileActionBtn}
            title={receipt.status === "failed" ? "Retry" : "Review fields"}
          >
            <IconRefresh size={13} stroke={1.8} />
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
