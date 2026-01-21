import React from 'react';
import { LayoutProvider } from './context/LayoutContext';
import { ToastProvider } from './context/ToastContext';
import { AlertProvider } from './context/AlertContext';
import { ConfirmProvider } from './context/ConfirmContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { TabBar } from './components/layout/TabBar';
import { ContentArea } from './components/layout/ContentArea';
import { BottomPanel } from './components/layout/BottomPanel';
import { ChatPanel } from './components/layout/ChatPanel';

const App: React.FC = () => {
  return (
    <LayoutProvider>
      <ToastProvider>
        <AlertProvider>
          <ConfirmProvider>
            <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', width: '100%' }}>
              <Sidebar />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <Header />
                <TabBar />
                <ContentArea />
                <BottomPanel />
                <ChatPanel />
              </div>
            </div>
          </ConfirmProvider>
        </AlertProvider>
      </ToastProvider>
    </LayoutProvider>
  );
};

export default App;
