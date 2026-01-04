import React from 'react';
import { LayoutProvider } from './context/LayoutContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { TabBar } from './components/layout/TabBar';
import { ContentArea } from './components/layout/ContentArea';
import { BottomPanel } from './components/layout/BottomPanel';

const App: React.FC = () => {
  return (
    <LayoutProvider>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', width: '100%' }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Header />
          <TabBar />
          <ContentArea />
          <BottomPanel />
        </div>
      </div>
    </LayoutProvider>
  );
};

export default App;
