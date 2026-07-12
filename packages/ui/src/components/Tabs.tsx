import * as React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTabId: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTabId, onChange, className = '' }) => {
  return (
    <div className={`flex gap-1 p-1 bg-neutral-950/60 border border-white/5 rounded-lg ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all cursor-pointer ${
              isActive
                ? 'bg-neutral-900 text-white shadow-sm border border-white/5'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
