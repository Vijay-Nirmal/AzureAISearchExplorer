import React from 'react';
import { useLayout } from '../../context/LayoutContext';
import { Card } from '../common/Card';

export const ContentArea: React.FC = () => {
  const { activeTabId, tabs } = useLayout();
  const activeTab = tabs.find(t => t.id === activeTabId);

  if (!activeTab) {
    return (
      <div style={{ padding: '20px', color: '#888', textAlign: 'center', marginTop: '20%' }}>
        <i className="fa-solid fa-search" style={{ fontSize: '48px', marginBottom: '16px' }}></i>
        <p>Select an item from the sidebar to get started.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
      <Card title={activeTab.title}>
        <p>This is the placeholder content for <strong>{activeTab.title}</strong>.</p>
        <p>Component ID: {activeTab.component}</p>
      </Card>
    </div>
  );
};
