import React from 'react';
import { useLayout } from '../../context/LayoutContext';
import { Card } from '../common/Card';
import { AddConnectionPage } from '../pages/AddConnectionPage';
import { ServiceOverviewPage } from '../pages/ServiceOverviewPage';
import IndexesPage from '../pages/Indexes/IndexesPage';

export const ContentArea: React.FC = () => {
  const { activeTabId, tabs, activeConnectionId } = useLayout();
  const activeTab = tabs.find(t => t.id === activeTabId);

  if (!activeTab) {
    return (
      <div style={{ padding: '20px', color: '#888', textAlign: 'center', marginTop: '20%' }}>
        <i className="fa-solid fa-search" style={{ fontSize: '48px', marginBottom: '16px' }}></i>
        <p>Select an item from the sidebar to get started.</p>
      </div>
    );
  }

  const renderContent = () => {
      switch (activeTab.component) {
          case 'add-connection':
              return <AddConnectionPage {...activeTab.props} />;
          case 'service':
              if (!activeConnectionId) return <div style={{ padding: '20px' }}>Please select a connection first.</div>;
              return <ServiceOverviewPage connectionId={activeConnectionId} />;
          case 'indexes':
              if (!activeConnectionId) return <div style={{ padding: '20px' }}>Please select a connection first.</div>;
              return <IndexesPage />;
          default:
              return (
                <div style={{ padding: '20px' }}>
                    <Card title={activeTab.title}>
                        <p>This is the placeholder content for <strong>{activeTab.title}</strong>.</p>
                        <p>Component ID: {activeTab.component}</p>
                    </Card>
                </div>
              );
      }
  };

  return (
    <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
        {renderContent()}
    </div>
  );
};
