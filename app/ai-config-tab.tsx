"use client";

import { useEffect, useMemo, useState } from "react";
import {
  IconPlus,
  IconX,
  IconSearch,
  IconRefresh,
  IconCheck,
  IconSparkles,
  IconAlertTriangle,
  IconTrash,
} from "@tabler/icons-react";
import styles from "./home.module.css";
import {
  useAiStore,
  loadAiConfig,
  createAiProvider,
  type AiModel,
} from "./ai-store";

/** Fetch the provider's available model IDs through our same-origin proxy. */
async function fetchModelIds(baseUrl: string, apiKey: string): Promise<string[]> {
  const res = await fetch("/api/ai/models", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ baseUrl, apiKey }),
  });

  const json: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      json &&
      typeof json === "object" &&
      typeof (json as { error?: unknown }).error === "string"
        ? (json as { error: string }).error
        : `Request failed (${res.status}).`;
    throw new Error(message);
  }

  let raw: unknown[] = [];
  if (Array.isArray(json)) raw = json;
  else if (json && typeof json === "object") {
    const obj = json as Record<string, unknown>;
    if (Array.isArray(obj.data)) raw = obj.data;
    else if (Array.isArray(obj.models)) raw = obj.models;
  }

  return Array.from(
    new Set(
      raw
        .map((m) => {
          if (typeof m === "string") return m;
          if (m && typeof m === "object") {
            const id = (m as { id?: unknown }).id;
            if (typeof id === "string") return id;
          }
          return null;
        })
        .filter((v): v is string => typeof v === "string" && v.length > 0),
    ),
  );
}

export function AiConfigTab() {
  const providers = useAiStore((s) => s.providers);
  const activeProviderId = useAiStore((s) => s.activeProviderId);
  const activeModelId = useAiStore((s) => s.activeModelId);
  const hydrated = useAiStore((s) => s.hydrated);
  const hydrate = useAiStore((s) => s.hydrate);
  const addProvider = useAiStore((s) => s.addProvider);
  const setActiveModel = useAiStore((s) => s.setActiveModel);
  const removeProvider = useAiStore((s) => s.removeProvider);

  // Which saved provider is pending removal confirmation.
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  // Provider form
  const [providerName, setProviderName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [models, setModels] = useState<AiModel[]>([]);
  const [manualId, setManualId] = useState("");
  const [manualName, setManualName] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Manual model availability test — only two outcomes: valid or invalid.
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"valid" | "invalid" | null>(null);

  // Fetch models
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetched, setFetched] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Load persisted config once.
  useEffect(() => {
    if (hydrated) return;
    loadAiConfig()
      .then((cfg) => {
        if (cfg) hydrate(cfg.providers, cfg.activeProviderId, cfg.activeModelId);
        else hydrate([], null, null);
      })
      .catch(() => hydrate([], null, null));
  }, [hydrated, hydrate]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? fetched.filter((id) => id.toLowerCase().includes(q)) : fetched;
  }, [fetched, search]);

  const activeProvider = providers.find((p) => p.id === activeProviderId) ?? null;
  const activeModel =
    activeProvider?.models.find((m) => m.id === activeModelId) ?? null;

  const addManualModel = () => {
    const id = manualId.trim();
    if (!id) return;
    setModels((prev) =>
      prev.some((m) => m.id === id)
        ? prev
        : [...prev, { id, name: manualName.trim() || id }],
    );
    setManualId("");
    setManualName("");
    setTestResult(null);
  };

  const updateModel = (index: number, patch: Partial<AiModel>) =>
    setModels((prev) =>
      prev.map((m, i) => (i === index ? { ...m, ...patch } : m)),
    );

  const removeModel = (index: number) =>
    setModels((prev) => prev.filter((_, i) => i !== index));

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectAllVisible = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      filtered.forEach((id) => next.add(id));
      return next;
    });

  const deselectAll = () => setSelected(new Set());

  const addSelected = () => {
    if (selected.size === 0) return;
    setModels((prev) => {
      const existing = new Set(prev.map((m) => m.id));
      const additions = Array.from(selected)
        .filter((id) => !existing.has(id))
        .map((id) => ({ id, name: id }));
      return [...prev, ...additions];
    });
    setSelected(new Set());
  };

  const fetchModels = async () => {
    const url = baseUrl.trim().replace(/\/+$/, "");
    if (!url) {
      setFetchError("Enter the base URL first.");
      return;
    }
    setFetching(true);
    setFetchError(null);
    try {
      const ids = await fetchModelIds(url, apiKey.trim());
      setFetched(ids);
      setSelected(new Set());
      if (ids.length === 0) setFetchError("No models were returned by the provider.");
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "Could not fetch models.");
    } finally {
      setFetching(false);
    }
  };

  const testModel = async () => {
    const id = manualId.trim();
    const url = baseUrl.trim().replace(/\/+$/, "");
    if (!id || !url) return;
    setTesting(true);
    setTestResult(null);
    try {
      const ids = await fetchModelIds(url, apiKey.trim());
      setTestResult(ids.includes(id) ? "valid" : "invalid");
    } catch {
      setTestResult("invalid");
    } finally {
      setTesting(false);
    }
  };

  const resetForm = () => {
    setProviderName("");
    setBaseUrl("");
    setApiKey("");
    setModels([]);
    setManualId("");
    setManualName("");
    setFetched([]);
    setSearch("");
    setSelected(new Set());
    setFetchError(null);
    setSubmitted(false);
  };

  const submit = () => {
    setSubmitted(true);
    if (
      !providerName.trim() ||
      !baseUrl.trim() ||
      !apiKey.trim() ||
      models.length === 0
    ) {
      return;
    }
    addProvider(
      createAiProvider({ name: providerName, baseUrl, apiKey, models }),
    );
    resetForm();
  };

  const nameInvalid = submitted && !providerName.trim();
  const urlInvalid = submitted && !baseUrl.trim();
  const keyInvalid = submitted && !apiKey.trim();

  return (
    <>
      <div className={styles.settingsHeader}>
        <div className={styles.settingsTitleRow}>
          <h1 className={styles.settingsTitle}>Configure AI model</h1>
          <span className={styles.settingsGlobalPill}>All workspaces</span>
        </div>
        <p className={styles.settingsSub}>
          Connect an OpenAI-compatible provider to analyze your bank statements.
          Your data is only sent to the provider you choose, and your key stays on
          this device. This configuration is shared across all workspaces.
        </p>
      </div>

      <div className={styles.aiStatus}>
        <span
          className={`${styles.aiStatusDot} ${activeModel ? styles.aiStatusDotOn : ""}`}
        />
        {activeModel ? (
          <span>
            Active model: <strong>{activeModel.name}</strong>
            {activeProvider ? ` · ${activeProvider.name}` : ""}
          </span>
        ) : (
          <span>No active model selected yet.</span>
        )}
      </div>

      <div className={styles.aiGrid}>
        {/* ---------------- Add provider ---------------- */}
        <section className={styles.settingsCard}>
          <div className={styles.settingsCardHead}>
            <h2 className={styles.settingsCardTitle}>Add a provider</h2>
            <p className={styles.settingsCardSub}>
              Use an OpenAI-compatible endpoint (OpenAI, OpenRouter, Ollama, …).
            </p>
          </div>

          <div className={styles.aiFieldGrid}>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="ai-provider-name">
                Provider name
              </label>
              <input
                id="ai-provider-name"
                className={`${styles.fieldInput} ${nameInvalid ? styles.error : ""}`}
                placeholder="e.g. OpenAI, OpenRouter"
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                autoComplete="off"
              />
              {nameInvalid && (
                <span className={styles.aiErrorText}>Required</span>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="ai-base-url">
                Base URL
              </label>
              <input
                id="ai-base-url"
                className={`${styles.fieldInput} ${urlInvalid ? styles.error : ""}`}
                placeholder="https://api.openai.com/v1"
                value={baseUrl}
                onChange={(e) => {
                  setBaseUrl(e.target.value);
                  setTestResult(null);
                }}
                autoComplete="off"
                spellCheck={false}
              />
              {urlInvalid && (
                <span className={styles.aiErrorText}>Required</span>
              )}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="ai-api-key">
              API key
            </label>
            <input
              id="ai-api-key"
              type="password"
              className={`${styles.fieldInput} ${keyInvalid ? styles.error : ""}`}
              placeholder="sk-…"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setTestResult(null);
              }}
              autoComplete="off"
            />
            {keyInvalid && <span className={styles.aiErrorText}>Required</span>}
          </div>

          <div className={styles.aiDivider} />

          <div className={styles.aiModelsHead}>
            <h3 className={styles.aiSubTitle}>Models</h3>
            <span className={styles.aiCount}>{models.length} added</span>
          </div>

          {/* manual add */}
          <div className={styles.aiModelAddRow}>
            <input
              className={styles.fieldInput}
              placeholder="Model ID (e.g. gpt-4o-mini)"
              value={manualId}
              onChange={(e) => {
                setManualId(e.target.value);
                setTestResult(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addManualModel();
                }
              }}
              autoComplete="off"
            />
            <input
              className={styles.fieldInput}
              placeholder="Display name (optional)"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addManualModel();
                }
              }}
              autoComplete="off"
            />
            <div className={styles.aiTestGroup}>
              <button
                type="button"
                className={styles.btnGhostSmall}
                onClick={testModel}
                disabled={testing || !manualId.trim() || !baseUrl.trim()}
              >
                {testing ? "Testing…" : "Test"}
              </button>
              {testResult === "valid" && (
                <span
                  className={styles.aiTestValid}
                  role="img"
                  aria-label="Valid"
                  title="Model is available"
                >
                  <IconCheck size={13} stroke={3} />
                </span>
              )}
              {testResult === "invalid" && (
                <span
                  className={styles.aiTestInvalid}
                  role="img"
                  aria-label="Invalid"
                  title="Model is not available"
                >
                  <IconX size={13} stroke={3} />
                </span>
              )}
            </div>
            <button
              type="button"
              className={`${styles.btnSecondary} ${styles.btnSm}`}
              onClick={addManualModel}
              disabled={!manualId.trim()}
            >
              <IconPlus size={14} stroke={2} />
              Add
            </button>
          </div>

          {/* fetch models */}
          <div className={styles.aiFetchBar}>
            <button
              type="button"
              className={`${styles.btnSecondary} ${styles.btnSm}`}
              onClick={fetchModels}
              disabled={fetching || !baseUrl.trim()}
            >
              <IconRefresh size={14} stroke={2} />
              {fetching ? "Fetching…" : "Fetch models"}
            </button>
            {fetchError && (
              <span className={styles.aiErrorText}>
                <IconAlertTriangle size={13} stroke={1.8} />
                {fetchError}
              </span>
            )}
          </div>

          {fetched.length > 0 && (
            <div className={styles.aiFetched}>
              <div className={styles.aiFetchedTools}>
                <div className={styles.aiSearchWrap}>
                  <IconSearch size={14} stroke={1.8} />
                  <input
                    className={styles.aiSearch}
                    placeholder="Search models…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <button
                  type="button"
                  className={styles.btnGhostSmall}
                  onClick={selectAllVisible}
                >
                  Select all
                </button>
                <button
                  type="button"
                  className={styles.btnGhostSmall}
                  onClick={deselectAll}
                >
                  Deselect all
                </button>
              </div>

              <div className={`${styles.aiFetchedList} ${styles.thinScroll}`}>
                {filtered.length === 0 ? (
                  <span className={styles.aiEmptyText}>
                    No models match “{search}”.
                  </span>
                ) : (
                  filtered.map((id) => (
                    <label key={id} className={styles.aiFetchedItem}>
                      <input
                        type="checkbox"
                        checked={selected.has(id)}
                        onChange={() => toggleSelect(id)}
                      />
                      <span className={styles.aiFetchedName}>{id}</span>
                    </label>
                  ))
                )}
              </div>

              <div className={styles.aiFetchedActions}>
                <span className={styles.aiSelectedCount}>
                  {selected.size} selected
                </span>
                <button
                  type="button"
                  className={`${styles.btnPrimary} ${styles.btnSm}`}
                  onClick={addSelected}
                  disabled={selected.size === 0}
                >
                  Add selected
                </button>
              </div>
            </div>
          )}

          {/* staged models */}
          {models.length > 0 && (
            <div className={styles.aiStagedList}>
              {models.map((m, i) => (
                <div key={i} className={styles.aiModelRow}>
                  <input
                    className={styles.fieldInput}
                    value={m.id}
                    onChange={(e) => updateModel(i, { id: e.target.value })}
                    placeholder="Model ID"
                    autoComplete="off"
                  />
                  <input
                    className={styles.fieldInput}
                    value={m.name}
                    onChange={(e) => updateModel(i, { name: e.target.value })}
                    placeholder="Display name"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    className={`${styles.fileActionBtn} ${styles.danger}`}
                    onClick={() => removeModel(i)}
                    aria-label={`Remove ${m.id}`}
                    title="Remove model"
                  >
                    <IconX size={14} stroke={2} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {submitted && models.length === 0 && (
            <span className={styles.aiErrorText}>
              Add at least one model.
            </span>
          )}

          <div className={styles.aiFormActions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={resetForm}
            >
              Clear
            </button>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={submit}
            >
              Add provider
            </button>
          </div>
        </section>

        {/* ---------------- Saved providers ---------------- */}
        <section className={styles.settingsCard}>
          <div className={styles.settingsCardHead}>
            <h2 className={styles.settingsCardTitle}>Providers</h2>
            <p className={styles.settingsCardSub}>
              Click a model to make it the active one.
            </p>
          </div>

          {providers.length === 0 ? (
            <div className={styles.aiEmpty}>
              <IconSparkles size={22} stroke={1.6} />
              <span className={styles.aiEmptyTitle}>No providers yet</span>
              <span className={styles.aiEmptyText}>
                Add one on the left to get started.
              </span>
            </div>
          ) : (
            <div className={styles.aiProviders}>
              {providers.map((p) => (
                <div key={p.id} className={styles.aiProviderGroup}>
                  <div className={styles.aiProviderHead}>
                    <span className={styles.aiProviderInfo}>
                      <span className={styles.aiProviderName}>{p.name}</span>
                      <span className={styles.aiProviderUrl}>{p.baseUrl}</span>
                    </span>
                    <button
                      type="button"
                      className={styles.aiProviderRemove}
                      onClick={() =>
                        setConfirmRemoveId((cur) =>
                          cur === p.id ? null : p.id,
                        )
                      }
                      aria-label={`Remove provider ${p.name}`}
                      title="Remove provider"
                    >
                      <IconTrash size={14} stroke={1.8} />
                    </button>
                  </div>

                  {confirmRemoveId === p.id && (
                    <div className={styles.aiProviderConfirm}>
                      <span>
                        Remove “{p.name}” and its models?
                      </span>
                      <div className={styles.aiProviderConfirmActions}>
                        <button
                          type="button"
                          className={styles.btnGhostSmall}
                          onClick={() => setConfirmRemoveId(null)}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className={styles.aiConfirmDelete}
                          onClick={() => {
                            removeProvider(p.id);
                            setConfirmRemoveId(null);
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}

                  <div className={styles.aiModelPicks}>
                    {p.models.map((m) => {
                      const active =
                        activeProviderId === p.id && activeModelId === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          className={`${styles.aiModelPick} ${active ? styles.aiModelPickActive : ""}`}
                          onClick={() => setActiveModel(p.id, m.id)}
                          aria-pressed={active}
                        >
                          <span className={styles.aiModelDot} />
                          <span className={styles.aiModelPickName}>{m.name}</span>
                          <span className={styles.aiModelPickId}>{m.id}</span>
                          {active && (
                            <IconCheck
                              size={14}
                              stroke={2.4}
                              className={styles.aiModelCheck}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
