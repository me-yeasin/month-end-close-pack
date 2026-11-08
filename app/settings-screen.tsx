"use client";

import { useState } from "react";
import { IconSparkles } from "@tabler/icons-react";
import styles from "./home.module.css";
import { AiConfigTab } from "./ai-config-tab";

const TABS = [
  {
    id: "ai",
    label: "Configure AI Model",
    icon: <IconSparkles size={17} stroke={1.8} />,
  },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function SettingsScreen() {
  const [tab, setTab] = useState<TabId>("ai");

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
        </div>
      </div>
    </div>
  );
}
