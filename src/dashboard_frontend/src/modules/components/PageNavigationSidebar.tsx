import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, useLocation } from 'react-router-dom';
import { useProjects } from '../projects/ProjectProvider';

interface PageNavigationSidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}

interface NavigationItem {
  path: string;
  labelKey: string;
  icon: React.ReactNode;
  end?: boolean;
}

interface NavigationSection {
  labelKey?: string;
  items: NavigationItem[];
}

// ── Per-project DevOps tool configuration ──────────────────────────────
// Add entries here to give any registered project its own sidebar section.
// The key must match the projectName returned by the MCP server.
const projectDevOpsConfig: Record<string, NavigationSection> = {
  StakTrakr: {
    labelKey: 'nav.devopsTools',
    items: [
      {
        path: '/devops',
        labelKey: 'nav.devopsHub',
        end: true,
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        ),
      },
      {
        path: '/devops/api-dashboard',
        labelKey: 'nav.apiDashboard',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        ),
      },
      {
        path: '/devops/wiki',
        labelKey: 'nav.staktrakrWiki',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        ),
      },
    ],
  },
  // Future projects:
  // HexTrackr: { labelKey: 'nav.devopsTools', items: [...] },
};

// ── Core navigation (always visible) ───────────────────────────────────
const coreSection: NavigationSection = {
  items: [
    {
      path: '/',
      labelKey: 'nav.statistics',
      end: true,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      path: '/steering',
      labelKey: 'nav.steering',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      ),
    },
    {
      path: '/specs',
      labelKey: 'nav.specs',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      path: '/tasks',
      labelKey: 'nav.tasks',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      path: '/logs',
      labelKey: 'nav.logs',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      path: '/approvals',
      labelKey: 'nav.approvals',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      path: '/settings',
      labelKey: 'nav.settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ],
};

export function PageNavigationSidebar({
  isOpen,
  isCollapsed,
  onClose,
  onToggleCollapse,
}: PageNavigationSidebarProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const { currentProject } = useProjects();

  // Handle ESC key to close sidebar on mobile
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    if (isOpen && window.innerWidth < 1024) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Build sections: core + project-specific devops (if configured)
  const navigationSections = useMemo<NavigationSection[]>(() => {
    const sections: NavigationSection[] = [coreSection];
    if (currentProject) {
      const devops = projectDevOpsConfig[currentProject.projectName];
      if (devops) sections.push(devops);
    }
    return sections;
  }, [currentProject]);

  // Desktop: Collapsible sidebar
  // Mobile: Slide-in overlay
  return (
    <>
      {/* Backdrop for mobile - only show when open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed lg:sticky inset-y-0 lg:top-0 left-0 z-50 lg:z-auto
        ${isCollapsed ? 'lg:w-16' : 'lg:w-64'} w-64
        lg:h-screen
        bg-[var(--surface-panel)]
        border-r border-[var(--border-default)]
        flex flex-col
        transition-all duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}
      >
        {/* Header - Desktop collapse toggle */}
        <div className="hidden lg:flex items-center justify-between p-4 border-b border-[var(--border-default)]">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Spec Workflow MCP
            </h2>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-md hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] ml-auto"
            aria-label={isCollapsed ? t('nav.expand', 'Expand sidebar') : t('nav.collapse', 'Collapse sidebar')}
            title={isCollapsed ? t('nav.expand', 'Expand sidebar') : t('nav.collapse', 'Collapse sidebar')}
          >
            <svg
              className={`w-5 h-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          </button>
        </div>

        {/* Header - Mobile close button */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-[var(--border-default)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Spec Workflow MCP
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-[var(--surface-hover)] text-[var(--text-secondary)]"
            aria-label={t('nav.close', 'Close sidebar')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navigationSections.map((section, sectionIdx) => (
            <React.Fragment key={sectionIdx}>
              {/* Section divider + label (skip for first section) */}
              {section.labelKey && (
                <div className={`pt-3 ${sectionIdx > 0 ? 'mt-2 border-t border-[var(--border-default)]' : ''}`}>
                  {(!isCollapsed || window.innerWidth < 1024) && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-3">
                      {t(section.labelKey)}
                    </span>
                  )}
                  {isCollapsed && window.innerWidth >= 1024 && (
                    <div className="flex justify-center">
                      <div className="w-4 h-px bg-[var(--border-default)]" />
                    </div>
                  )}
                </div>
              )}
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      onClose();
                    }
                  }}
                  className={({ isActive }) => `
                    flex items-center gap-3 py-2 px-3 rounded-md transition-colors
                    ${
                      isActive
                        ? 'bg-[color-mix(in_srgb,var(--interactive-primary)_10%,transparent)] text-[var(--interactive-primary)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                    }
                    ${isCollapsed ? 'lg:justify-center' : ''}
                  `}
                  title={isCollapsed ? t(item.labelKey) : undefined}
                >
                  <div className="flex-shrink-0">{item.icon}</div>
                  {(!isCollapsed || window.innerWidth < 1024) && (
                    <span className="text-sm font-medium">{t(item.labelKey)}</span>
                  )}
                </NavLink>
              ))}
            </React.Fragment>
          ))}
        </nav>
      </div>
    </>
  );
}
