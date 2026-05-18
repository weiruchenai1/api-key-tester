import { useState, useCallback } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import { useConfig } from '@/hooks/useConfig';
import { DEFAULT_ADVANCED } from '@/constants/defaults';
import { PROVIDER_PRESETS } from '@/data/providerPresets';
import { ContextMenu, type ContextMenuItem } from '@/components/ui/ContextMenu';
import { Tooltip } from '@/components/ui/Tooltip';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ConfigEditorModal, type ConfigEditorData } from '@/components/modals/ConfigEditorModal';
import type { ProviderConfig } from '@/types/provider';

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

// ── Context menu state ─────────────────────────────────────────────

interface CtxState {
  configId: string;
  x: number;
  y: number;
}

// ── Component ──────────────────────────────────────────────────────

export function Sidebar({ isMobileOpen, onMobileClose }: SidebarProps) {
  const { t } = useTranslation();
  const { configs, activeConfigId, setActiveConfig, addConfig, updateConfig, deleteConfig } =
    useConfig();

  const [ctxMenu, setCtxMenu] = useState<CtxState | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ProviderConfig | undefined>();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // ── Handlers ──────────────────────────────────────────────────────

  const openEditor = useCallback((cfg?: ProviderConfig) => {
    setEditingConfig(cfg);
    setEditorOpen(true);
  }, []);

  const handleCtxDelete = useCallback(
    (id: string) => {
      setConfirmDeleteId(id);
    },
    [],
  );

  const handleEditorSave = useCallback(
    (data: ConfigEditorData) => {
      if (editingConfig) {
        updateConfig(editingConfig.id, {
          name: data.name,
          provider: data.provider,
          baseUrl: data.baseUrl,
          presetModels: data.presetModels,
          extraHeaders: data.extraHeaders,
          queryParamAuth: data.queryParamAuth,
          advanced: {
            ...editingConfig.advanced,
            testEndpoint: data.testEndpoint,
            authHeader: data.authHeader,
            authPrefix: data.authPrefix,
          },
        });
      } else {
        const id = addConfig(data.provider, data.name);
        updateConfig(id, {
          baseUrl: data.baseUrl,
          presetModels: data.presetModels,
          extraHeaders: data.extraHeaders,
          queryParamAuth: data.queryParamAuth,
          advanced: {
            ...DEFAULT_ADVANCED,
            testEndpoint: data.testEndpoint,
            authHeader: data.authHeader,
            authPrefix: data.authPrefix,
            balanceEndpoint: PROVIDER_PRESETS[data.provider].defaultBalanceEndpoint,
          },
        });
        setActiveConfig(id);
      }
      setEditorOpen(false);
      setEditingConfig(undefined);
    },
    [editingConfig, addConfig, updateConfig, setActiveConfig],
  );

  const handleRightClick = useCallback(
    (e: React.MouseEvent, cfg: ProviderConfig) => {
      e.preventDefault();
      setCtxMenu({ configId: cfg.id, x: e.clientX, y: e.clientY });
    },
    [],
  );

  // ── Context menu items ───────────────────────────────────────────

  const ctxItems: ContextMenuItem[] = ctxMenu
    ? (() => {
        const isBuiltin = ctxMenu.configId.startsWith('builtin_');
        const items: ContextMenuItem[] = [
          {
            label: t('modal.editConfig'),
            icon: <Pencil size={14} strokeWidth={2} />,
            onClick: () => {
              const cfg = configs.find((c) => c.id === ctxMenu.configId);
              if (cfg) openEditor(cfg);
            },
          },
        ];
        if (!isBuiltin) {
          items.push({
            label: t('modal.deleteConfig'),
            icon: <Trash2 size={14} strokeWidth={2} />,
            onClick: () => handleCtxDelete(ctxMenu.configId),
            danger: true,
          });
        }
        return items;
      })()
    : [];

  // ═══════════════════════════════════════════════════════════════
  //  Desktop: collapsed mode — 60px wide, icons only
  // ═══════════════════════════════════════════════════════════════

  const renderConfigIcon = (cfg: ProviderConfig) => {
    const preset = PROVIDER_PRESETS[cfg.provider];
    const active = cfg.id === activeConfigId;

    return (
      <Tooltip key={cfg.id} content={cfg.name} side="right">
        <div
          onClick={() => setActiveConfig(cfg.id)}
          onContextMenu={(e) => handleRightClick(e, cfg)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setActiveConfig(cfg.id);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={cfg.name}
          aria-current={active ? 'page' : undefined}
          className={cn(
            'sidebar-item justify-center p-2 select-none',
            active ? 'is-active text-fg font-semibold' : 'text-fg-muted hover:text-fg',
          )}
        >
          <span
            className={cn(
              'flex items-center justify-center w-[20px] h-[20px] shrink-0',
              active ? 'opacity-100' : 'opacity-70',
            )}
          >
            {preset.icon}
          </span>
        </div>
      </Tooltip>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  //  Mobile: expanded row — icon + name
  // ═══════════════════════════════════════════════════════════════

  const renderConfigRow = (cfg: ProviderConfig) => {
    const preset = PROVIDER_PRESETS[cfg.provider];
    const active = cfg.id === activeConfigId;

    return (
      <div
        key={cfg.id}
        onClick={() => {
          setActiveConfig(cfg.id);
          onMobileClose?.();
        }}
        onContextMenu={(e) => handleRightClick(e, cfg)}
        role="button"
        tabIndex={0}
        aria-label={cfg.name}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'sidebar-item gap-3 px-3 py-2 select-none',
          active ? 'is-active text-fg font-semibold' : 'text-fg-muted hover:text-fg font-medium',
        )}
      >
        <span
          className={cn(
            'flex items-center justify-center w-[20px] h-[20px] shrink-0',
            active ? 'opacity-100' : 'opacity-70',
          )}
        >
          {preset.icon}
        </span>
        <span className="flex-1 truncate text-meta">{cfg.name}</span>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  //  DESKTOP
  // ═══════════════════════════════════════════════════════════════

  const desktopSidebar = (
    <aside className="hidden lg:flex flex-col w-16 shrink-0 border-r border-border bg-card h-full">
      <div className="flex flex-col items-center gap-1 flex-1 overflow-y-auto px-2 pt-5 pb-[15px]">
        {configs.length === 0 ? (
          <span className="text-fg-subtle text-caption text-center leading-tight mt-4">{t('noKeys')}</span>
        ) : (
          configs.map(renderConfigIcon)
        )}
      </div>

      {/* Separator */}
      <div className="border-t border-border mx-2" />

      {/* New config button */}
      <div className="flex justify-center py-[15px]">
        <Tooltip content={t('addProvider')} side="right">
          <button
            onClick={() => openEditor()}
            aria-label={t('addProvider')}
            className="sidebar-item justify-center w-9 h-9 text-fg-muted hover:text-fg"
          >
            <Plus size={16} strokeWidth={2} />
          </button>
        </Tooltip>
      </div>
    </aside>
  );

  // ═══════════════════════════════════════════════════════════════
  //  MOBILE
  // ═══════════════════════════════════════════════════════════════

  const mobileSidebar = isMobileOpen && (
    <div className="fixed inset-0 z-[var(--z-overlay)] lg:hidden">
      <div className="absolute inset-0 bg-overlay" onClick={onMobileClose} />

      <aside className="relative w-[160px] h-full bg-card border-r border-border flex flex-col py-5 px-3">
        <div className="flex-1 overflow-y-auto">
          {configs.length === 0 ? (
            <span className="text-fg-subtle text-body text-center block mt-8">{t('noKeys')}</span>
          ) : (
            <div className="flex flex-col gap-0.5">
              {configs.map(renderConfigRow)}
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-border mt-2">
          <button
            onClick={() => {
              openEditor();
              onMobileClose?.();
            }}
            className="sidebar-item justify-center gap-1.5 w-full h-8 text-btn text-fg-muted hover:text-fg font-medium"
          >
            <Plus size={14} strokeWidth={2} />
            {t('addProvider')}
          </button>
        </div>
      </aside>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <>
      {desktopSidebar}
      {mobileSidebar}

      <ContextMenu
        items={ctxItems}
        position={ctxMenu ? { x: ctxMenu.x, y: ctxMenu.y } : null}
        onClose={() => setCtxMenu(null)}
      />

      {editorOpen && (
        <ConfigEditorModal
          open={editorOpen}
          onClose={() => {
            setEditorOpen(false);
            setEditingConfig(undefined);
          }}
          onSave={handleEditorSave}
          config={editingConfig}
        />
      )}

      <ConfirmDialog
        open={confirmDeleteId !== null}
        danger
        title={t('modal.deleteConfig')}
        message={t('modal.confirmDelete')}
        onConfirm={() => {
          if (confirmDeleteId) deleteConfig(confirmDeleteId);
          setConfirmDeleteId(null);
        }}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </>
  );
}
