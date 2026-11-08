/**
 * ai-store.ts — AI provider configuration (Zustand) + persistence.
 *
 * Providers, their models, and the active selection are persisted to the
 * `aiConfig` IndexedDB store so the configuration survives reloads.
 *
 * API keys are stored locally on this device only. (Encryption at rest is a
 * follow-up; the app is local-first and never uploads the config anywhere.)
 */

import { create } from "zustand";
import {
  getDb,
  newId,
  type AiConfigRecord,
  type AiModelRecord,
  type AiProviderRecord,
} from "./db";

export type AiModel = AiModelRecord;
export type AiProvider = AiProviderRecord;

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

export async function loadAiConfig(): Promise<AiConfigRecord | null> {
  const db = await getDb();
  return (await db.get("aiConfig", "singleton")) ?? null;
}

export async function saveAiConfig(
  config: Omit<AiConfigRecord, "id">,
): Promise<void> {
  const db = await getDb();
  await db.put("aiConfig", { id: "singleton", ...config });
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

type AiState = {
  providers: AiProvider[];
  activeProviderId: string | null;
  activeModelId: string | null;
  hydrated: boolean;
  hydrate: (
    providers: AiProvider[],
    activeProviderId: string | null,
    activeModelId: string | null,
  ) => void;
  addProvider: (provider: AiProvider) => void;
  setActiveModel: (providerId: string, modelId: string) => void;
};

function persistFrom(
  state: Pick<AiState, "providers" | "activeProviderId" | "activeModelId">,
) {
  void saveAiConfig({
    providers: state.providers,
    activeProviderId: state.activeProviderId,
    activeModelId: state.activeModelId,
  });
}

export const useAiStore = create<AiState>((set, get) => ({
  providers: [],
  activeProviderId: null,
  activeModelId: null,
  hydrated: false,

  hydrate: (providers, activeProviderId, activeModelId) =>
    set({ providers, activeProviderId, activeModelId, hydrated: true }),

  addProvider: (provider) => {
    set((state) => {
      const hasActive = state.activeModelId != null;
      const firstModel = provider.models[0] ?? null;
      return {
        providers: [...state.providers, provider],
        activeProviderId: hasActive
          ? state.activeProviderId
          : firstModel
            ? provider.id
            : null,
        activeModelId: hasActive ? state.activeModelId : (firstModel?.id ?? null),
      };
    });
    persistFrom(get());
  },

  setActiveModel: (providerId, modelId) => {
    set({ activeProviderId: providerId, activeModelId: modelId });
    persistFrom(get());
  },
}));

/** Build a provider record with a generated id and normalised fields. */
export function createAiProvider(input: {
  name: string;
  baseUrl: string;
  apiKey: string;
  models: AiModel[];
}): AiProvider {
  return {
    id: newId(),
    name: input.name.trim(),
    baseUrl: input.baseUrl.trim().replace(/\/+$/, ""),
    apiKey: input.apiKey.trim(),
    models: input.models,
    createdAt: new Date().toISOString(),
  };
}
