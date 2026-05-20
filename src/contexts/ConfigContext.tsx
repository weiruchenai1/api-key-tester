import {
  useReducer,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { ProviderConfig, ProviderType } from '@/types/provider';
import { PROVIDER_PRESETS } from '@/data/providerPresets';
import { DEFAULT_ADVANCED } from '@/constants/defaults';
import { ConfigContext, type ConfigContextValue } from '@/hooks/useConfig';
import { encrypt, decrypt, isEncrypted } from '@/lib/crypto';

// ── State ──────────────────────────────────────────────────────────

interface ConfigState {
  configs: ProviderConfig[];
  activeConfigId: string | null;
}

const STORAGE_KEY = 'provider_configs';
const ACTIVE_KEY = 'active_config_id';
const encryptedApiKeys = new Map<string, string>();

const BUILTIN_TYPES: ProviderType[] = [
  'openai', 'claude', 'gemini', 'deepseek',
  'siliconcloud', 'xai', 'openrouter', 'moonshot',
];

function createBuiltinConfigs(): ProviderConfig[] {
  return BUILTIN_TYPES.map((provider) => {
    const preset = PROVIDER_PRESETS[provider];
    return {
      id: `builtin_${provider}`,
      name: preset.name,
      provider,
      baseUrl: preset.defaultBaseUrl,
      model: preset.defaultModel,
      presetModels: preset.modelOptions.join(', '),
      apiKeys: '',
      proxyUrl: '',
      extraHeaders: preset.defaultExtraHeaders,
      queryParamAuth: preset.defaultQueryParamAuth,
      advanced: {
        ...DEFAULT_ADVANCED,
        testEndpoint: preset.defaultEndpoint,
        authHeader: preset.defaultAuthHeader,
        authPrefix: preset.defaultAuthPrefix,
        balanceEndpoint: preset.defaultBalanceEndpoint,
      },
    };
  });
}

function loadState(): ConfigState {
  const builtins = createBuiltinConfigs();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved: ProviderConfig[] = JSON.parse(raw);
      const savedMap = new Map(saved.map((c) => [c.id, c]));

      // Merge saved data into builtins, deep-merging advanced settings
      const merged = builtins.map((b) => {
        const saved_ = savedMap.get(b.id);
        if (!saved_) return b;
        const cfg = {
          ...b,
          ...saved_,
          id: b.id,
          provider: b.provider,
          advanced: { ...b.advanced, ...saved_.advanced },
          extraHeaders: saved_.extraHeaders ?? b.extraHeaders,
          queryParamAuth: saved_.queryParamAuth ?? b.queryParamAuth,
        };
        if (isEncrypted(cfg.apiKeys)) {
          encryptedApiKeys.set(cfg.id, cfg.apiKeys);
          cfg.apiKeys = '';
        }
        return cfg;
      });

      // Add user-created configs (anything that isn't a builtin id)
      const builtinIds = new Set(builtins.map((b) => b.id));
      const userConfigs = saved
        .filter((c) => !builtinIds.has(c.id))
        .map((c) => {
          if (isEncrypted(c.apiKeys)) {
            encryptedApiKeys.set(c.id, c.apiKeys);
            return { ...c, apiKeys: '' };
          }
          return c;
        });

      const configs = [...merged, ...userConfigs];
      const activeConfigId = localStorage.getItem(ACTIVE_KEY);
      const validId = activeConfigId && configs.some((c) => c.id === activeConfigId)
        ? activeConfigId
        : configs[0]?.id ?? null;

      return { configs, activeConfigId: validId };
    }
  } catch {
    // fall through
  }

  // First visit: builtins only
  localStorage.setItem(STORAGE_KEY, JSON.stringify(builtins));
  localStorage.setItem(ACTIVE_KEY, builtins[0]?.id ?? null);
  return { configs: builtins, activeConfigId: builtins[0]?.id ?? null };
}

// ── Helpers ────────────────────────────────────────────────────────

let counter = 0;
function nextId() {
  counter += 1;
  return `cfg_${Date.now()}_${counter}`;
}

function isBuiltin(id: string) {
  return id.startsWith('builtin_');
}

// ── Actions ────────────────────────────────────────────────────────

type Action =
  | { type: 'ADD'; payload: ProviderConfig }
  | { type: 'UPDATE'; payload: { id: string; data: Partial<ProviderConfig> } }
  | { type: 'DELETE'; payload: string }
  | { type: 'SET_ACTIVE'; payload: string | null };

function reducer(state: ConfigState, action: Action): ConfigState {
  switch (action.type) {
    case 'ADD':
      return { ...state, configs: [...state.configs, action.payload] };

    case 'UPDATE':
      return {
        ...state,
        configs: state.configs.map((c) =>
          c.id === action.payload.id ? { ...c, ...action.payload.data } : c,
        ),
      };

    case 'DELETE':
      // Prevent deleting built-in configs
      if (isBuiltin(action.payload)) return state;
      return {
        configs: state.configs.filter((c) => c.id !== action.payload),
        activeConfigId:
          state.activeConfigId === action.payload
            ? state.configs.find((c) => c.id !== action.payload)?.id ?? null
            : state.activeConfigId,
      };

    case 'SET_ACTIVE':
      return { ...state, activeConfigId: action.payload };

    default:
      return state;
  }
}

// ── Context ────────────────────────────────────────────────────────

// ConfigContext, ConfigContextValue, and useConfig live in ./configContext
// to keep this file as a component-only module (Vite Fast-Refresh friendly).

// ── Provider ───────────────────────────────────────────────────────

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  const [ready, setReady] = useState(false);

  // Decrypt apiKeys on first mount
  useEffect(() => {
    if (encryptedApiKeys.size === 0) return;
    const entries = Array.from(encryptedApiKeys.entries());
    encryptedApiKeys.clear();
    Promise.all(
      entries.map(async ([id, value]) => {
        const decrypted = await decrypt(value);
        return { id, apiKeys: decrypted };
      }),
    ).then((results) => {
      for (const r of results) {
        if (r.apiKeys) {
          dispatch({ type: 'UPDATE', payload: { id: r.id, data: { apiKeys: r.apiKeys } } });
        }
      }
    });
  }, []);

  // Persist to localStorage (skip initial sync), encrypting apiKeys
  useEffect(() => {
    if (!ready) { setReady(true); return; }
    async function persist() {
      const configsToSave = await Promise.all(
        state.configs.map(async (c) => ({
          ...c,
          apiKeys: c.apiKeys ? await encrypt(c.apiKeys) : '',
        })),
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(configsToSave));
    }
    persist();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.configs]);

  useEffect(() => {
    if (state.activeConfigId) {
      localStorage.setItem(ACTIVE_KEY, state.activeConfigId);
    } else {
      localStorage.removeItem(ACTIVE_KEY);
    }
  }, [state.activeConfigId]);

  const value: ConfigContextValue = {
    configs: state.configs,
    activeConfigId: state.activeConfigId,
    activeConfig:
      state.configs.find((c) => c.id === state.activeConfigId) ?? null,

    addConfig(provider, name) {
      const preset = PROVIDER_PRESETS[provider];
      const config: ProviderConfig = {
        id: nextId(),
        name,
        provider,
        baseUrl: preset.defaultBaseUrl,
        model: preset.defaultModel,
        presetModels: preset.modelOptions.join(', '),
        apiKeys: '',
        proxyUrl: '',
        extraHeaders: preset.defaultExtraHeaders,
        queryParamAuth: preset.defaultQueryParamAuth,
        advanced: {
          ...DEFAULT_ADVANCED,
          testEndpoint: preset.defaultEndpoint,
          authHeader: preset.defaultAuthHeader,
          authPrefix: preset.defaultAuthPrefix,
          balanceEndpoint: preset.defaultBalanceEndpoint,
        },
      };
      dispatch({ type: 'ADD', payload: config });
      return config.id;
    },

    updateConfig(id, data) {
      dispatch({ type: 'UPDATE', payload: { id, data } });
    },

    deleteConfig(id) {
      dispatch({ type: 'DELETE', payload: id });
    },

    setActiveConfig(id) {
      dispatch({ type: 'SET_ACTIVE', payload: id });
    },

    isBuiltin,
  };

  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  );
}
