import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState('inicio');

  return (
    <AppContext.Provider value={{
      sidebarOpen, setSidebarOpen,
      sidebarCollapsed, setSidebarCollapsed,
      currentPage, setCurrentPage
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
