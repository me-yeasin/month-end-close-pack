"use client";

import { useEffect, useRef, useState } from "react";
import {
  IconUpload,
  IconFileText,
  IconReceipt,
  IconPhoto,
  IconX,
  IconLock,
} from "@tabler/icons-react";
import styles from "./home.module.css";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
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
  onPick: (files: FileList | null) => void;
  onRemove: (index: number) => void;
  artClass: (file: File) => string;
  artIcon: (file: File) => React.ReactNode;
}

/**
 * One upload area (bank statements or receipts): heading + dropzone + the
 * list of files the user has chosen so far. Purely presentational — it does
 * not read or send file contents.
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
  onPick,
  onRemove,
  artClass,
  artIcon,
}: UploadSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => inputRef.current?.click();

  return (
    <section className={styles.afSection}>
      <div className={styles.afSectionHead}>
        <span className={`${styles.afChip} ${chipClass}`}>{chipIcon}</span>
        <span className={styles.afTitles}>
          <span className={styles.afTitle}>{title}</span>
          <span className={styles.afSub}>{sub}</span>
        </span>
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
          setDragActive(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragActive(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          onPick(e.dataTransfer.files);
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
          Accepted: <strong>{acceptLabel}</strong>
        </span>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          hidden
          onChange={(e) => {
            onPick(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {files.length > 0 && (
        <div className={styles.fileList}>
          {files.map((file, i) => (
            <div key={`${file.name}-${i}`} className={styles.fileItem}>
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
}: {
  open: boolean;
  onClose: () => void;
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

  const add = (setter: React.Dispatch<React.SetStateAction<File[]>>) => (
    list: FileList | null,
  ) => {
    if (!list || list.length === 0) return;
    setter((prev) => [...prev, ...Array.from(list)]);
  };
  const remove = (setter: React.Dispatch<React.SetStateAction<File[]>>) => (
    index: number,
  ) => setter((prev) => prev.filter((_, i) => i !== index));

  const hasFiles = bankFiles.length > 0 || receiptFiles.length > 0;

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

        <p className={styles.afIntro}>
          Upload your bank statements and receipts for this month. We&rsquo;ll
          read them on this device and prepare the pack for your review.
        </p>

        <div className={styles.afBody}>
          <UploadSection
            title="Bank statements"
            sub="CSV exports from your bank"
            acceptLabel="CSV files"
            accept=".csv,text/csv"
            chipIcon={<IconFileText size={19} stroke={1.8} />}
            files={bankFiles}
            dragActive={bankDrag}
            setDragActive={setBankDrag}
            onPick={add(setBankFiles)}
            onRemove={remove(setBankFiles)}
            artClass={() => styles.csv ?? ""}
            artIcon={() => <IconFileText size={17} stroke={1.8} />}
          />

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
            onPick={add(setReceiptFiles)}
            onRemove={remove(setReceiptFiles)}
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
            onClick={onClose}
            disabled={!hasFiles}
          >
            Add files
          </button>
        </div>
      </div>
    </div>
  );
}
