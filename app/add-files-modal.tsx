"use client";

import { useEffect, useRef, useState } from "react";
import {
  IconUpload,
  IconFileText,
  IconReceipt,
  IconPhoto,
  IconX,
  IconLock,
  IconAlertTriangle,
} from "@tabler/icons-react";
import styles from "./home.module.css";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

/** Stable identity for a file, so the same file is never added twice. */
function fileKey(file: File): string {
  return `${file.name}::${file.size}::${file.lastModified}`;
}

interface UploadSectionProps {
  title: string;
  sub: string;
  acceptLabel: string;
  accept: string;
  chipClass?: string;
  chipIcon: React.ReactNode;
  files: File[];
  dragActive: boolean;
  setDragActive: (active: boolean) => void;
  /** Append already-filtered files (the parent de-duplicates). */
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
  /** Type guard applied to dropped/selected files (accept attr is picker-only). */
  isAllowed: (file: File) => boolean;
  artClass: (file: File) => string;
  artIcon: (file: File) => React.ReactNode;
}

/**
 * One upload area (bank statements or receipts): heading + dropzone + the
 * list of files the user has chosen so far. Presentational only — it never
 * reads or sends file contents.
 */
function UploadSection({
  title,
  sub,
  acceptLabel,
  accept,
  chipClass = "",
  chipIcon,
  files,
  dragActive,
  setDragActive,
  onAdd,
  onRemove,
  isAllowed,
  artClass,
  artIcon,
}: UploadSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  // Depth counter prevents the highlight flickering over child elements.
  const dragDepth = useRef(0);
  const [notice, setNotice] = useState<string | null>(null);

  const openPicker = () => inputRef.current?.click();

  const intake = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const incoming = Array.from(list);
    const allowed = incoming.filter(isAllowed);
    const skipped = incoming.length - allowed.length;
    setNotice(
      skipped > 0
        ? `${skipped} file${skipped === 1 ? "" : "s"} skipped — unsupported type`
        : null,
    );
    if (allowed.length > 0) onAdd(allowed);
  };

  return (
    <section className={styles.afSection}>
      <div className={styles.afSectionHead}>
        <span className={`${styles.afChip} ${chipClass}`}>{chipIcon}</span>
        <span className={styles.afTitles}>
          <span className={styles.afTitle}>{title}</span>
          <span className={styles.afSub}>{sub}</span>
        </span>
        {files.length > 0 && (
          <span className={styles.afCount}>
            {files.length} file{files.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <div
        className={`${styles.dropZone} ${dragActive ? styles.dragover : ""}`}
        role="button"
        tabIndex={0}
        aria-label={`${title}. Drag files here or browse.`}
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPicker();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          dragDepth.current += 1;
          if (dragDepth.current === 1) setDragActive(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          dragDepth.current = Math.max(0, dragDepth.current - 1);
          if (dragDepth.current === 0) setDragActive(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          dragDepth.current = 0;
          setDragActive(false);
          intake(e.dataTransfer.files);
        }}
      >
        <span className={styles.dropZoneIcon}>
          <IconUpload size={22} stroke={1.8} />
        </span>
        <span className={styles.dropZoneTitle}>Drag &amp; drop, or browse</span>
        <span className={styles.dropZoneDesc}>{sub}</span>
        <span className={styles.dropZoneActions}>
          <span className={styles.btnGhostSmall}>Choose files</span>
        </span>
        <span className={styles.dropZoneHint}>
          Accepted: <strong>{acceptLabel}</strong> · multiple allowed
        </span>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          hidden
          onChange={(e) => {
            intake(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {notice && (
        <span className={styles.afNotice}>
          <IconAlertTriangle size={13} stroke={1.8} />
          {notice}
        </span>
      )}

      {files.length > 0 && (
        <div className={`${styles.fileList} ${styles.thinScroll}`}>
          {files.map((file, i) => (
            <div key={fileKey(file)} className={styles.fileItem}>
              <span className={`${styles.fileArt} ${artClass(file)}`}>
                {artIcon(file)}
              </span>
              <span className={styles.fileInfo}>
                <span className={styles.fileName}>{file.name}</span>
                <span className={styles.fileMeta}>
                  {formatBytes(file.size)} <i className={styles.sep}>·</i> Ready
                </span>
              </span>
              <span className={styles.fileActions}>
                <button
                  type="button"
                  className={`${styles.fileActionBtn} ${styles.danger}`}
                  onClick={() => onRemove(i)}
                  aria-label={`Remove ${file.name}`}
                  title="Remove file"
                >
                  <IconX size={14} stroke={2} />
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function AddFilesModal({
  open,
  onClose,
  onAdd,
  mode = "all",
}: {
  open: boolean;
  onClose: () => void;
  /** Hand the chosen bank statement files to the app for processing. */
  onAdd?: (bankFiles: File[]) => void;
  /** Which sections to show: both (overview), bank only (transactions), or receipts only. */
  mode?: "all" | "bank" | "receipts";
}) {
  const [bankFiles, setBankFiles] = useState<File[]>([]);
  const [receiptFiles, setReceiptFiles] = useState<File[]>([]);
  const [bankDrag, setBankDrag] = useState(false);
  const [receiptDrag, setReceiptDrag] = useState(false);

  // Fresh state each time the modal opens.
  useEffect(() => {
    if (!open) {
      setBankFiles([]);
      setReceiptFiles([]);
      setBankDrag(false);
      setReceiptDrag(false);
    }
  }, [open]);

  // Escape closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  // Append while ignoring any file that is already in the list.
  const addFiles = (setter: React.Dispatch<React.SetStateAction<File[]>>) => (
    incoming: File[],
  ) => {
    if (incoming.length === 0) return;
    setter((prev) => {
      const seen = new Set(prev.map(fileKey));
      const next = [...prev];
      for (const file of incoming) {
        const key = fileKey(file);
        if (!seen.has(key)) {
          seen.add(key);
          next.push(file);
        }
      }
      return next;
    });
  };

  const removeAt = (setter: React.Dispatch<React.SetStateAction<File[]>>) => (
    index: number,
  ) => setter((prev) => prev.filter((_, i) => i !== index));

  const showBank = mode !== "receipts";
  const showReceipts = mode !== "bank";
  const singleSection = mode !== "all";

  const relevantCount =
    mode === "bank"
      ? bankFiles.length
      : mode === "receipts"
        ? receiptFiles.length
        : bankFiles.length + receiptFiles.length;

  const introText =
    mode === "bank"
      ? "Upload your bank statements for this month. We'll read them on this device and prepare the pack for your review."
      : mode === "receipts"
        ? "Upload your receipts for this month. We'll read them on this device and prepare the pack for your review."
        : "Upload your bank statements and receipts for this month. We'll read them on this device and prepare the pack for your review.";

  const isCsv = (file: File) =>
    file.name.toLowerCase().endsWith(".csv") ||
    file.type === "text/csv" ||
    file.type === "application/vnd.ms-excel";

  const isReceipt = (file: File) =>
    file.type === "application/pdf" ||
    file.type.startsWith("image/") ||
    file.name.toLowerCase().endsWith(".pdf");

  return (
    <div
      className={styles.modalBackdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`${styles.modal} ${styles.afModal}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-files-title"
      >
        <div className={`${styles.modalHeader} ${styles.afHeader}`}>
          <h2 className={styles.modalTitle} id="add-files-title">
            Add files
          </h2>
          <button
            type="button"
            className={styles.modalClose}
            onClick={onClose}
            aria-label="Close"
          >
            <IconX size={14} stroke={2} />
          </button>
        </div>

        <p className={styles.afIntro}>{introText}</p>

        <div
          className={`${styles.afBody} ${singleSection ? styles.afBodySingle : ""} ${styles.thinScroll}`}
        >
          {showBank && (
            <UploadSection
              title="Bank statements"
              sub="CSV exports from your bank"
              acceptLabel="CSV files"
              accept=".csv,text/csv"
              chipIcon={<IconFileText size={19} stroke={1.8} />}
              files={bankFiles}
              dragActive={bankDrag}
              setDragActive={setBankDrag}
              onAdd={addFiles(setBankFiles)}
              onRemove={removeAt(setBankFiles)}
              isAllowed={isCsv}
              artClass={() => styles.csv ?? ""}
              artIcon={() => <IconFileText size={17} stroke={1.8} />}
            />
          )}

          {showReceipts && (
            <UploadSection
              title="Receipts"
              sub="Images or PDFs — including multi-page PDFs"
              acceptLabel="Images and PDFs"
              accept="image/*,application/pdf"
              chipClass={styles.afChipReceipt}
              chipIcon={<IconReceipt size={19} stroke={1.8} />}
              files={receiptFiles}
              dragActive={receiptDrag}
              setDragActive={setReceiptDrag}
              onAdd={addFiles(setReceiptFiles)}
              onRemove={removeAt(setReceiptFiles)}
              isAllowed={isReceipt}
              artClass={(f) =>
                f.type === "application/pdf" ? styles.pdf ?? "" : styles.image ?? ""
              }
              artIcon={(f) =>
                f.type === "application/pdf" ? (
                  <IconFileText size={17} stroke={1.8} />
                ) : (
                  <IconPhoto size={17} stroke={1.8} />
                )
              }
            />
          )}
        </div>

        <div className={styles.afNote}>
          <IconLock size={15} stroke={1.8} />
          <span>
            Your files stay on this device. Nothing leaves it unless you turn on
            an optional AI provider in settings.
          </span>
        </div>

        <div className={styles.modalActions}>
          <button type="button" className={styles.btnSecondary} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => {
              if (bankFiles.length > 0) onAdd?.(bankFiles);
              onClose();
            }}
            disabled={relevantCount === 0}
          >
            {relevantCount === 0
              ? "Add files"
              : `Add ${relevantCount} file${relevantCount === 1 ? "" : "s"}`}
          </button>
        </div>
      </div>
    </div>
  );
}
