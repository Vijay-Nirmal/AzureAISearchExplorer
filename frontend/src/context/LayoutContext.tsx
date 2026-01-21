import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Tab {
  id: string;
  title: string;
  icon?: string;
  component?: string; // ID of the component/page to render
  props?: any;
}

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface LayoutContextType {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  activeTabId: string | null;
  tabs: Tab[];
  openTab: (tab: Tab) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  isBottomPanelOpen: boolean;
  toggleBottomPanel: () => void;
  isChatOpen: boolean;
  toggleChat: () => void;
  activeConnectionId: string | null;
  setActiveConnectionId: (id: string | null) => void;
  breadcrumbs: BreadcrumbItem[];
  setBreadcrumbs: (items: BreadcrumbItem[]) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeConnectionId, setActiveConnectionId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  useEffect(() => {
    document.body.className = theme === 'light' ? 'light-theme' : '';
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const openTab = (tab: Tab) => {
    if (!tabs.find(t => t.id === tab.id)) {
      setTabs([...tabs, tab]);
    }
    setActiveTabId(tab.id);
  };

  const closeTab = (tabId: string) => {
    const newTabs = tabs.filter(t => t.id !== tabId);
    setTabs(newTabs);
    if (activeTabId === tabId) {
      setActiveTabId(newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null);
    }
  };

  const toggleBottomPanel = () => {
    setIsBottomPanelOpen(prev => !prev);
  };

  const toggleChat = () => {
    setIsChatOpen(prev => !prev);
  };

  return (
    <LayoutContext.Provider value={{
      theme,
      toggleTheme,
      activeTabId,
      tabs,
      openTab,
      closeTab,
      setActiveTab: setActiveTabId,
      isBottomPanelOpen,
      toggleBottomPanel,
      isChatOpen,
      toggleChat,
      activeConnectionId,
      setActiveConnectionId,
      breadcrumbs,
      setBreadcrumbs
    }}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};
