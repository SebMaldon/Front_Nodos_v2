import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { AuthContext } from '../context/AuthContext';
import {
  LayoutDashboard, List, Settings, AlertTriangle, LogOut, ChevronRight, X, ClipboardList, Building2
} from 'lucide-react';

const NAV_ITEMS = {
  administrador: [
    { path: '/', label: 'Inicio', icon: LayoutDashboard, group: 'Principal' },
    { path: '/catalogo-nodos', label: 'Catálogo de Nodos', icon: List, group: 'Gestión' },
    { path: '/gestion-nodos', label: 'Gestión y Registro', icon: Settings, group: 'Gestión' },
    { path: '/gestion-unidades', label: 'Gestión de Unidades', icon: Building2, group: 'Gestión' },
    { path: '/catalogo-prioritarios', label: 'Nodos Prioritarios', icon: AlertTriangle, group: 'Alertas' },
  ],
  user: [
    { path: '/', label: 'Inicio', icon: LayoutDashboard, group: 'Principal' },
    { path: '/catalogo-nodos', label: 'Catálogo de Nodos', icon: List, group: 'Consulta' },
    { path: '/catalogo-prioritarios', label: 'Nodos Prioritarios', icon: AlertTriangle, group: 'Alertas' },
  ]
};

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed } = useApp();
  const { user, logoutUser } = React.useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const role = user?.role || 'user';
  const navItems = NAV_ITEMS[role] || NAV_ITEMS.user;
  
  const ROL_LABELS = { administrador: 'Administrador', user: 'Usuario' };
  const rolLabel = ROL_LABELS[role] || 'Usuario';

  const grouped = navItems.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  const handleNav = (path) => {
    navigate(path);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const handleLogout = () => {
    logoutUser();
    setSidebarOpen(false);
    navigate('/login', { replace: true });
  };

  return (
    <aside className={`${sidebarCollapsed ? 'w-20' : 'w-64'} transition-all duration-300 flex-shrink-0 flex flex-col h-screen`}
      style={{ backgroundColor: '#00472e' }}>

      {/* Logo */}
      <div className="flex-shrink-0 px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
            style={{ backgroundColor: '#00472e' }}>
            <img src="/IMSS_Logosímbolo_Blanco.png" alt="IMSS" className="w-8 h-8 object-contain" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-white font-bold text-sm leading-tight whitespace-nowrap">IMSS</p>
              <p className="text-green-200 text-xs leading-tight whitespace-nowrap">Gestión de Nodos</p>
            </div>
          )}
          {/* X solo en mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Badge de rol */}
        {!sidebarCollapsed && (
          <div className="mt-3 px-2 py-1 rounded text-xs text-center whitespace-nowrap overflow-hidden"
            style={{ backgroundColor: 'rgba(201,162,39,0.15)', color: '#f0c040' }}>
            <ClipboardList size={10} className="inline mr-1" />
            {rolLabel}
          </div>
        )}
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {Object.entries(grouped).map(([group, items]) => (
          <div key={group} className="mb-5">
            {!sidebarCollapsed ? (
              <p className="text-xs font-semibold uppercase tracking-wider px-3 mb-2"
                style={{ color: 'rgba(187,247,208,0.5)' }}>
                {group}
              </p>
            ) : (
              <div className="h-px bg-white/10 mx-3 mb-2 mt-4" />
            )}
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <button
                  key={item.path}
                  onClick={() => handleNav(item.path)}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`sidebar-link w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-3 py-2.5'} rounded-lg mb-1 text-sm font-medium group
                    ${isActive
                      ? 'bg-white/15 text-white'
                      : 'text-green-100/80 hover:bg-white/10 hover:text-white'
                    }`}
                >
                  <Icon
                    size={18}
                    className={isActive ? 'text-yellow-300' : 'text-green-200/60 group-hover:text-yellow-300'}
                  />
                  {!sidebarCollapsed && <span className="flex-1 text-left whitespace-nowrap">{item.label}</span>}
                  {isActive && !sidebarCollapsed && <ChevronRight size={14} className="text-yellow-300" />}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="flex-shrink-0 p-3 border-t border-white/10">
        {/* Info del usuario */}
        {user && !sidebarCollapsed && (
          <div className="mb-2 px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
            <p className="text-white text-xs font-semibold leading-tight truncate">{user.username}</p>
          </div>
        )}
        <button
          id="btn-logout"
          onClick={handleLogout}
          title={sidebarCollapsed ? 'Cerrar Sesión' : undefined}
          className={`sidebar-link w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-3 py-2.5'} rounded-lg text-sm font-medium text-red-300/80 hover:bg-red-900/30 hover:text-red-200`}
        >
          <LogOut size={16} />
          {!sidebarCollapsed && <span>Cerrar Sesión</span>}
        </button>
        {!sidebarCollapsed && (
          <p className="text-center mt-2 text-green-200/30 text-xs whitespace-nowrap">
            © 2026 IMSS — DGSTI
          </p>
        )}
      </div>
    </aside>
  );
}
