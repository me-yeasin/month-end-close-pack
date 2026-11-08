"use client";

import { useState, useMemo } from "react";
import {
  IconFiles,
  IconFileTypePdf,
  IconFileZip,
  IconFileTypeCsv,
  IconJson,
  IconCloudDownload,
  IconCheck,
  IconAlertTriangle,
  IconLoader2,
  IconPackage,
  IconTrash,
  IconPlus,
} from "@tabler/icons-react";
import styles from "./home.module.css";

type Preset = "accountant" | "spreadsheet" | "review";
type ExportStatus = "idle" | "preparing" | "packaging" | "done" | "error";

interface ExportPresetDef {
  name: string;
  desc: string;
  files: { icon: string; label: string; sub: string; core: boolean }[];
  note: string;
}

const PRESETS: { key: Preset; def: ExportPresetDef }[] = [
  {
    key: "accountant",
    def: {
      name: "Accountant pack",
      desc: "Everything your accountant needs in one ZIP.",
      files: [
        { icon: styles.xlsx, label: "transactions.xlsx", sub: "clean ledger", core: true },
        { icon: styles.pdf, label: "summary.pdf", sub: "1 page", core: true },
        { icon: styles.folder, label: "receipts/", sub: "receipt files", core: true },
        { icon: styles.csv, label: "exceptions.csv", sub: "issue list", core: false },
        { icon: styles.json, label: "audit.json", sub: "full trail", core: false },
        { icon: "txt", label: "README.txt", sub: "what is included", core: true },
      ],
      note: "Best for sending to an accountant or bookkeeper.",
    },
  },
  {
    key: "spreadsheet",
    def: {
      name: "Spreadsheet only",
      desc: "Just the clean ledger, XLSX or CSV.",
      files: [
        { icon: styles.xlsx, label: "transactions.xlsx", sub: "clean ledger", core: true },
        { icon: styles.csv, label: "transactions.csv", sub: "alternative", core: false },
      ],
      note: "For further analysis or a second opinion.",
    },
  },
  {
    key: "review",
    def: {
      name: "Review only",
      desc: "The exceptions list, nothing else.",
      files: [
        { icon: styles.csv, label: "exceptions.csv", sub: "issue list", core: true },
        { icon: styles.json, label: "audit.json", sub: "full trail", core: false },
      ],
      note: "For a quick follow-up or re-import.",
    },
  },
];

interface ExportScreenProps {
  ready: boolean;
  transactionCount: number;
  receiptCount: number;
  blockerCount: number;
  onExport: (preset: Preset) => void;
}

export function ExportPackScreen({
  ready,
  transactionCount,
  receiptCount,
  blockerCount,
  onExport,
}: ExportScreenProps) {
  const [preset, setPreset] = useState<Preset>("accountant");
  const [status, setStatus] = useState<ExportStatus>("idle");

  const def = PRESETS.find((p) => p.key === preset)!.def;

  const coreCount = def.files.filter((f) => f.core).length;

  const startExport = () => {
    setStatus("preparing");
    setTimeout(() => setStatus("packaging"), 700);
    setTimeout(() => setStatus("done"), 1600);
  };

  return (
    <div className={styles.screen}>
      {/* header */}
      <div className={styles.sectionHead}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionEyebrow}>Export</span>
          <h2 className={styles.sectionH2}>Accountant pack</h2>
        </div>
        <div className={styles.sectionActions}>
          <span
            className={`${styles.statusPill} ${
              ready ? styles.success : styles.danger
            }`}
          >
            {ready ? "Ready to export" : "Not ready yet"}
          </span>
        </div>
      </div>

      {/* readiness gate */}
      {!ready && (
        <div className={styles.callout} style={{ margin: "-12px -12px 4px" }}>
          <span className={`${styles.calloutIcon} ${styles.exIcon} ${styles.red}`}>
            <IconAlertTriangle size={15} stroke={1.8} />
          </span>
          <div>
            <strong>
              {blockerCount > 0
                ? `${blockerCount} blocker${blockerCount !== 1 ? "s" : ""} stopping the export`
                : "Nothing to export yet"}
            </strong>
            <p style={{ margin: "5px 0 0", color: "inherit" }}>
              {blockerCount > 0
                ? "Review the missing receipts, duplicates, and uncategorised items before exporting. The app will not upload anything."
                : "Import a bank statement and complete the review to build your pack. The app will not upload anything."}
            </p>
          </div>
          {blockerCount > 0 && (
            <button
              type="button"
              className={`${styles.btnSecondary} ${styles.sm}`}
            >
              Review exceptions
            </button>
          )}
        </div>
      )}

      {/* preset picker */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionTitle}>
            <span className={styles.sectionEyebrow}>Choose what to include</span>
            <h2 className={styles.sectionH2}>Export preset</h2>
          </div>
        </div>

        <div className={styles.choiceGroup}>
          {PRESETS.map(({ key, def }) => (
            <label
              key={key}
              className={`${styles.choice} ${preset === key ? styles.selected : ""}`}
            >
              <input
                type="radio"
                name="export-preset"
                value={key}
                checked={preset === key}
                onChange={() => setPreset(key)}
              />
              <span className={styles.choiceMark} />
              <span className={styles.choiceText}>
                <span className={styles.choiceTitle}>{def.name}</span>
                <span className={styles.choiceDesc}>{def.desc}</span>
              </span>
            </label>
          ))}
        </div>

        <div
          className={styles.callout}
          style={{
            margin: "12px -12px 0",
            background: "var(--surface-2)",
            color: "var(--ink-2)",
            borderColor: "var(--line)",
          }}
        >
          <span className={styles.calloutIcon}>
            <IconCloudDownload size={15} stroke={1.8} />
          </span>
          <p style={{ margin: 0, color: "inherit" }}>
            The ZIP is built in your browser and saved to your device. Nothing is
            uploaded. The exact file names and layout are shown below.
          </p>
        </div>
      </div>

      {/* contents */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionTitle}>
            <span className={styles.sectionEyebrow}>What is inside</span>
            <h2 className={styles.sectionH2}>This ZIP will contain</h2>
          </div>
          <span className={styles.tag}>{coreCount} core file{coreCount !== 1 ? "s" : ""}</span>
        </div>

        <div className={styles.fileList}>
          {def.files.map((f) => {
            const isXlsx = f.icon === styles.xlsx;
            const isPdf = f.icon === styles.pdf;
            const isFolder = f.icon === styles.folder;
            const isCsv = f.icon === styles.csv;
            const isJson = f.icon === styles.json;

            return (
              <div key={f.label} className={styles.fileItem}>
                <div
                  className={isPdf ? styles.pdf : isCsv ? styles.csv : isFolder ? styles.folder : isJson ? styles.json : styles.xlsx}
                >
                  {isXlsx && <IconFiles size={17} stroke={1.8} />}
                  {isPdf && <IconFileTypePdf size={17} stroke={1.8} />}
                  {isFolder && <IconFileZip size={17} stroke={1.8} />}
                  {isCsv && <IconFileTypeCsv size={17} stroke={1.8} />}
                  {isJson && <IconJson size={17} stroke={1.8} />}
                  {!isXlsx && !isPdf && !isFolder && !isCsv && !isJson && (
                    <IconFiles size={17} stroke={1.8} />
                  )}
                </div>

                <div className={styles.fileInfo}>
                  <div className={styles.fileName}>{f.label}</div>
                  <div className={styles.fileMeta}>
                    {f.sub}
                    {f.core && (
                      <>
                        <span className={styles.sep}>·</span>
                        <span className={`${styles.tag} ${styles.strong}`}>
                          core
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {isFolder && (
                  <span className={styles.fileStatus}>
                    <span className={`${styles.statusPill} ${styles.muted}`}>
                      {receiptCount} files
                    </span>
                  </span>
                )}

                {isXlsx && (
                  <div className={styles.fileActions}>
                    <span
                      className={styles.tag}
                      style={{
                        background: "var(--surface-2)",
                        color: "var(--muted)",
                        borderColor: "var(--line)",
                      }}
                    >
                      {transactionCount} rows
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div
          className={styles.callout}
          style={{ margin: "12px -12px 0", background: "var(--sage)", color: "var(--forest)", borderColor: "#c3d6c0" }}
        >
          <span className={styles.calloutIcon}>
            <IconPackage size={15} stroke={1.8} />
          </span>
          <div>
            <strong>Receipts are renamed on export.</strong>
            <p style={{ margin: "5px 0 0", color: "inherit" }}>
              Files are renamed by date, vendor, and amount so they are easy to
              match back later.
            </p>
          </div>
        </div>
      </div>

      {/* build button */}
      {ready && (
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionTitle}>
              <span className={styles.sectionEyebrow}>Build and save</span>
              <h2 className={styles.sectionH2}>
                {status === "done" ? "Pack built" : "Ready to export"}
              </h2>
            </div>
          </div>

          {status === "done" && (
            <div
              className={styles.callout}
              style={{ margin: "-12px -12px 4px", background: "var(--sage)", color: "var(--forest)", borderColor: "#c3d6c0" }}
            >
              <span className={styles.calloutIcon}>
                <IconCheck size={15} stroke={2} />
              </span>
              <div>
                <strong>Pack saved to this device.</strong>
                <p style={{ margin: "5px 0 0", color: "inherit" }}>
                  Month-End-Pack.zip is ready to send to your accountant or keep
                  for your records.
                </p>
              </div>
              <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
                <button type="button" className={`${styles.btnSecondary} ${styles.sm}`}>
                  <IconCloudDownload size={13} stroke={1.8} />
                  Open folder
                </button>
                <button type="button" className={`${styles.btnPrimary} ${styles.sm}`}>
                  <IconCloudDownload size={13} stroke={1.8} />
                  Email to accountant
                </button>
              </div>
            </div>
          )}

          {status !== "done" && (
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                className={`${styles.btnPrimary} ${styles.full}`}
                disabled={status !== "idle"}
                onClick={startExport}
              >
                {status === "idle" && (
                  <>
                    <IconCloudDownload size={14} stroke={1.8} />
                    Export pack
                  </>
                )}
                {status === "preparing" && (
                  <>
                    <IconLoader2
                      size={14}
                      stroke={1.8}
                      className={styles.spin}
                    />
                    Preparing files…
                  </>
                )}
                {status === "packaging" && (
                  <>
                    <IconLoader2
                      size={14}
                      stroke={1.8}
                      className={styles.spin}
                    />
                    Packaging ZIP…
                  </>
                )}
              </button>

              {status === "idle" && (
                <button type="button" className={`${styles.btnGhostSmall} ${styles.sm}`}>
                  <IconTrash size={13} stroke={1.8} />
                  Clear last export
                </button>
              )}
            </div>
          )}

          {status === "preparing" || status === "packaging" ? (
            <div
              className={styles.metaRow}
              style={{ marginTop: 14 }}
            >
              <span
                className={styles.statusPill}
                style={{ background: "var(--sage)", color: "var(--forest)" }}
              >
                <IconLoader2 size={10} stroke={2} className={styles.spin} />
                {status === "preparing" ? "Reading files" : "Writing ZIP"}
              </span>
              <span className={styles.hintInline}>
                {status === "preparing"
                  ? `Reading ${receiptCount} receipts and ${transactionCount} transactions…`
                  : "Packaging 5 files into one archive…"}
              </span>
            </div>
          ) : null}
        </div>
      )}

      {/* when not ready, show a disabled build button */}
      {!ready && status === "idle" && (
        <div className={styles.section}>
          <button
            type="button"
            className={`${styles.btnPrimary} ${styles.full}`}
            disabled
          >
            <IconCloudDownload size={14} stroke={1.8} />
            Export pack
          </button>
          <div
            className={styles.callout}
            style={{ margin: "12px -12px 0", background: "var(--red-soft)", color: "var(--red-ink)", borderColor: "#e3bcb3" }}
          >
            <span className={styles.calloutIcon}>
              <IconAlertTriangle size={15} stroke={1.8} />
            </span>
            <p style={{ margin: 0, color: "inherit" }}>
              Resolve the blockers above before exporting.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// minimal spin utility class inline note: a spinner class can be added in
// home.module.css if desired; for now we use a simple opacity pulse.
