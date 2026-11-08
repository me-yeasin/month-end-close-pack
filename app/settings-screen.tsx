"use client";

import { useState } from "react";
import { IconSparkles, IconBriefcase } from "@tabler/icons-react";
import styles from "./home.module.css";
import { AiConfigTab } from "./ai-config-tab";
import { useUiStore } from "./ui-store";

const TABS = [
  {
    id: "ai",
    label: "Configure AI Model",
    icon: <IconSparkles size={17} stroke={1.8} />,
  },
  {
    id: "workspace",
    label: "Workspace",
    icon: <IconBriefcase size={17} stroke={1.8} />,
  },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function SettingsScreen() {
  const [tab, setTab] = useState<TabId>("ai");
  const bankOnly = useUiStore((s) => s.bankOnly);
  const setBankOnly = useUiStore((s) => s.setBankOnly);

  return (
    <div className={styles.settings}>
      <div className={styles.settingsLayout}>
        <aside className={styles.settingsNav} aria-label="Settings sections">
          <span className={styles.settingsNavLabel}>Settings</span>
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`${styles.settingsTab} ${tab === t.id ? styles.settingsTabActive : ""}`}
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </aside>

        <div className={styles.settingsContent}>
          {tab === "ai" && <AiConfigTab />}

          {tab === "workspace" && (
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div>
                  <span className={styles.eyebrowSm}>Workspace</span>
                  <h2>Bank-only mode</h2>
                </div>
              </div>
              <p
                style={{
                  margin: "0 0 16px",
                  color: "var(--muted)",
                  fontSize: 13,
                  lineHeight: 1.55,
                }}
              >
                Build the pack from your bank transactions only. When on, the
                Receipts tab, the Add-files receipts section, and the Receipts
                step in the overview are hidden across the app.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  type="button"
                  className={`${styles.toggle} ${bankOnly ? styles.toggleOn : ""}`}
                  onClick={() => setBankOnly(!bankOnly)}
                  role="switch"
                  aria-checked={bankOnly}
                  aria-label="Bank-only mode"
                >
                  <span className={styles.toggleTrack}>
                    <span className={styles.toggleKnob} />
                  </span>
                </button>
                <span style={{ fontSize: 13, fontWeight: 500 }}>
                  Bank-only mode
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
