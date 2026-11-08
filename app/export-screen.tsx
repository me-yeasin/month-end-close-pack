"use client";

import { useState } from "react";
import {
  IconFiles,
  IconFileTypePdf,
  IconFileZip,
  IconFileTypeCsv,
  IconJson,
  IconAlertTriangle,
  IconCheck,
  IconArrowRight,
  IconDownload,
  IconLoader2,
} from "@tabler/icons-react";
import styles from "./home.module.css";

type Preset = "accountant" | "spreadsheet" | "review";
type BuildStatus = "idle" | "building" | "done" | "error";

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
        { icon: "xlsx", label: "transactions.xlsx", sub: "clean ledger", core: true },
        { icon: "pdf", label: "summary.pdf", sub: "1 page", core: true },
        { icon: "folder", label: "receipts/", sub: "receipt files", core: true },
        { icon: "csv", label: "exceptions.csv", sub: "issue list", core: false },
        { icon: "json", label: "audit.json", sub: "full trail", core: false },
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
        { icon: "xlsx", label: "transactions.xlsx", sub: "clean ledger", core: true },
        { icon: "csv", label: "transactions.csv", sub: "alternative", core: false },
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
        { icon: "csv", label: "exceptions.csv", sub: "issue list", core: true },
        { icon: "json", label: "audit.json", sub: "full trail", core: false },
      ],
      note: "For a quick follow-up or re-import.",
    },
  },
];

const FILE_ICONS: Record<string, React.ComponentType<{ size: number; stroke: number }>> = {
  xlsx: IconFiles,
  pdf: IconFileTypePdf,
  csv: IconFileTypeCsv,
  json: IconJson,
  folder: IconFileZip,
  txt: IconFiles,
};

export function ExportPackScreen({
  ready,
  hasData = false,
  transactionCount = 0,
  receiptCount = 0,
  blockerCount = 0,
  onReview,
  onExport,
}: {
  /** True when the month is reviewed and the pack can be built. */
  ready: boolean;
  /** False when nothing has been imported yet. */
  hasData?: boolean;
  transactionCount?: number;
  receiptCount?: number;
  blockerCount?: number;
  /** Jump to the review screen (shown while blockers remain). */
  onReview?: () => void;
  /** Build the pack — resolves (optionally with the file name) when the ZIP is saved. */
  onExport?: (preset: Preset) => Promise<string | void> | string | void;
}) {
  const [preset, setPreset] = useState<Preset>("accountant");
  const [status, setStatus] = useState<BuildStatus>("idle");
  const [errorText, setErrorText] = useState<string | null>(null);
  const [doneName, setDoneName] = useState<string | null>(null);

  const def = PRESETS.find((p) => p.key === preset)!.def;
  const coreCount = def.files.filter((f) => f.core).length;

  const build = async () => {
    setStatus("building");
    setErrorText(null);
    setDoneName(null);
    try {
      const name = await onExport?.(preset);
      setDoneName(typeof name === "string" ? name : null);
      setStatus("done");
    } catch (err) {
      setErrorText(
        err instanceof Error ? err.message : "The pack could not be built.",
      );
      setStatus("error");
    }
  };

  // hero copy — mirrors the overview / summary tone
  let heroTitle: React.ReactNode;
  let heroText: string;
  if (!hasData) {
    heroTitle = (
      <>
        Nothing to <em>pack yet.</em>
      </>
    );
    heroText =
      "Import a bank statement and complete the review — your pack assembles itself from the month's data.";
  } else if (ready) {
    heroTitle = (
      <>
        Ready to <em>ship.</em>
      </>
    );
    heroText = `All ${transactionCount} transactions reviewed. Pick a preset and build the ZIP — it is assembled in your browser and saved straight to this device.`;
  } else {
    heroTitle = (
      <>
        Almost <em>there.</em>
      </>
    );
    heroText = `${blockerCount} item${
      blockerCount === 1 ? "" : "s"
    } still need a decision before the pack can be built. Review them, then come back — building takes one click.`;
  }

  return (
    <div className={styles.screen}>
      {/* ------------------------------ header ------------------------------ */}
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
            {ready ? "Ready to export" : hasData ? "Not ready yet" : "No data yet"}
          </span>
        </div>
      </div>

      {/* ------------------------------ hero ------------------------------ */}
      <section className={styles.hero} aria-labelledby="export-title">
        <div className={styles.heroCopy}>
          <div className={styles.heroEyebrow}>
            <i aria-hidden="true" />
            Accountant pack
          </div>
          <h1 id="export-title">{heroTitle}</h1>
          <p>{heroText}</p>
          <div className={styles.heroActions}>
            {!hasData ? null : ready ? (
              <button
                type="button"
                className={`${styles.btnPrimary} ${styles.btnAmber}`}
                onClick={() => onExport?.(preset)}
              >
                <IconDownload size={15} stroke={2} />
                Build pack
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={onReview}
                >
                  Review blockers
                  <IconArrowRight size={15} stroke={2} />
                </button>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  disabled
                  title="Resolve the blockers to unlock the export"
                >
                  <IconDownload size={15} stroke={1.8} />
                  Export locked
                </button>
              </>
            )}
          </div>
        </div>

        <div className={styles.heroEmpty} aria-hidden="true">
          <span className={styles.heroEmptyRing}>
            <IconFileZip size={30} stroke={1.5} />
          </span>
          <span className={styles.heroEmptyLabel}>
            {hasData ? `${transactionCount + receiptCount + def.files.length} files` : "No files"}
          </span>
        </div>
      </section>

      {/* ------------------------------ stats strip ------------------------------ */}
      <section className={styles.sumTotals} aria-label="Pack contents at a glance">
        <div className={styles.sumTotal}>
          <span className={styles.sumTotalLabel}>Transactions</span>
          <strong className={styles.sumTotalValue}>{transactionCount}</strong>
        </div>
        <div className={styles.sumTotal}>
          <span className={styles.sumTotalLabel}>Receipts</span>
          <strong className={styles.sumTotalValue}>{receiptCount}</strong>
        </div>
        <div className={styles.sumTotal}>
          <span className={styles.sumTotalLabel}>Blockers</span>
          <strong
            className={`${styles.sumTotalValue} ${
              blockerCount > 0 ? styles.sumTotalWarn : styles.sumTotalNet
            }`}
          >
            {blockerCount}
          </strong>
        </div>
      </section>

      {/* ------------------------------ preset picker ------------------------------ */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionTitle}>
            <span className={styles.sectionEyebrow}>Choose what to include</span>
            <h2 className={styles.sectionH2}>Export preset</h2>
          </div>
        </div>

        <div className={styles.choiceGroup} role="radiogroup" aria-label="Export preset">
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
      </section>

      {/* ------------------------------ contents ------------------------------ */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionTitle}>
            <span className={styles.sectionEyebrow}>What is inside</span>
            <h2 className={styles.sectionH2}>This ZIP will contain</h2>
          </div>
          <span className={styles.tag}>
            {coreCount} core file{coreCount !== 1 ? "s" : ""}
          </span>
        </div>

        <div className={styles.fileList}>
          {def.files.map((f) => {
            const IconComp = FILE_ICONS[f.icon] ?? IconFiles;
            return (
              <div key={f.label} className={styles.fileItem}>
                <div className={styles[f.icon] ?? styles.xlsx}>
                  <IconComp size={17} stroke={1.8} />
                </div>

                <div className={styles.fileInfo}>
                  <div className={styles.fileName}>{f.label}</div>
                  <div className={styles.fileMeta}>
                    {f.sub}
                    {f.core && (
                      <>
                        <span className={styles.sep}>·</span>
                        <span className={`${styles.tag} ${styles.strong}`}>core</span>
                      </>
                    )}
                  </div>
                </div>

                {f.icon === "folder" && (
                  <span className={styles.fileStatus}>
                    <span className={`${styles.statusPill} ${styles.muted}`}>
                      {receiptCount} files
                    </span>
                  </span>
                )}

                {f.icon === "xlsx" && (
                  <span className={styles.fileActions}>
                    <span className={styles.tag}>{transactionCount} rows</span>
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <p className={styles.sumNote}>
          Receipt files are renamed by date, vendor, and amount so they match
          back easily. The ZIP is assembled entirely in your browser — nothing
          is uploaded.
        </p>
      </section>

      {/* ------------------------------ build ------------------------------ */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionTitle}>
            <span className={styles.sectionEyebrow}>Build and save</span>
            <h2 className={styles.sectionH2}>
              {status === "done"
                ? "Pack built"
                : status === "building"
                  ? "Building…"
                  : ready
                    ? `${def.name} · ${def.files.length} files`
                    : "Export locked"}
            </h2>
          </div>
          <span className={`${styles.statusPill} ${ready ? styles.success : styles.muted}`}>
            {ready ? (
              <>
                <IconCheck size={10} stroke={2} />
                Ready
              </>
            ) : (
              <>
                <IconAlertTriangle size={10} stroke={2} />
                {hasData ? `${blockerCount} blocker${blockerCount === 1 ? "" : "s"}` : "Import first"}
              </>
            )}
          </span>
        </div>

        {status === "done" && (
          <div className={`${styles.callout} ${styles.success}`}>
            <span className={styles.calloutIcon}>
              <IconCheck size={15} stroke={2} />
            </span>
            <div>
              <strong>Pack saved to this device.</strong>
              <p>{doneName ?? "Your pack"} is in your downloads, ready to send.</p>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className={`${styles.callout} ${styles.danger}`}>
            <span className={styles.calloutIcon}>
              <IconAlertTriangle size={15} stroke={1.8} />
            </span>
            <div>
              <strong>The pack could not be built.</strong>
              <p>{errorText}</p>
            </div>
          </div>
        )}

        <button
          type="button"
          className={`${styles.btnPrimary} ${styles.full}`}
          disabled={!ready || status === "building"}
          onClick={build}
        >
          {status === "building" ? (
            <>
              <IconLoader2 size={14} stroke={2} className={styles.spin} />
              Building pack…
            </>
          ) : (
            <>
              <IconDownload size={14} stroke={2} />
              {status === "done" ? "Build again" : ready ? `Build ${def.name}` : "Export pack"}
            </>
          )}
        </button>
        <p className={styles.sumNote}>
          {status === "building"
            ? "Assembling the archive in your browser — large months can take a moment."
            : ready
              ? "One click builds the archive and saves it to your device."
              : hasData
                ? "Resolve the remaining blockers — the export unlocks automatically."
                : "Import a bank statement and review the month to unlock the export."}
        </p>
      </section>
    </div>
  );
}
