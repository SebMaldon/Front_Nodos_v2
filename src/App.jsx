import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NodeForm from './components/NodeFrom';
import NodeTable from './components/NodeTable';
import TablaRegistros from './pages/tablaRegistros';
import NodosSustitucion from './pages/NodosSustitucion';
import PantallaInicio from './pages/inicio';
import Login from './pages/Login';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import GestionUnidades from './pages/GestionUnidades';

import { AppProvider, useApp } from './context/AppContext';
import { NotificationProvider } from './context/NotificationContext';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';

// ─── Layout principal ─────────────────────────────────────────────────────────
function AppLayout({ children }) {
    const { sidebarOpen, setSidebarOpen } = useApp();
    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
            {/* Sidebar */}
            <div className={`
                fixed inset-y-0 left-0 z-40 lg:static lg:z-auto
                transform transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0 lg:flex-shrink-0
            `}>
                <Sidebar />
            </div>
            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Topbar />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}

function App() {
    const [refreshKey, setRefreshKey] = useState(0); // Clave para forzar re-fetch en NodeTable

    // Función para agregar un nuevo nodo
    const handleAddNodo = async () => {
        try {
            setRefreshKey(prev => prev + 1); // Forzar re-fetch en NodeTable
        } catch (error) {
            console.error('Error al agregar el nodo:', error);
        }
    };

    return (
        <Router>
            <AuthProvider>
                <AppProvider>
                    <NotificationProvider>
                        <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route
                                path="/gestion-nodos"
                                element={
                                    <ProtectedRoute requiredRole="administrador">
                                        <AppLayout>
                                             <div className="w-full fade-in">
                                                 <NodeTable refreshKey={refreshKey} />
                                             </div>
                                        </AppLayout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/gestion-unidades"
                                element={
                                    <ProtectedRoute requiredRole="administrador">
                                        <AppLayout>
                                             <div className="w-full fade-in">
                                                 <GestionUnidades />
                                             </div>
                                         </AppLayout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/catalogo-prioritarios"
                                element={
                                    <ProtectedRoute>
                                        <AppLayout>
                                            <div className="w-full fade-in">
                                                <NodosSustitucion />
                                            </div>
                                        </AppLayout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/catalogo-nodos"
                                element={
                                    <ProtectedRoute>
                                        <AppLayout>
                                            <div className="w-full fade-in">
                                                <TablaRegistros />
                                            </div>
                                        </AppLayout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/"
                                element={
                                    <ProtectedRoute>
                                        <AppLayout>
                                            <PantallaInicio />
                                        </AppLayout>
                                    </ProtectedRoute>
                                }
                            />
                        </Routes>
                    </NotificationProvider>
                </AppProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;
