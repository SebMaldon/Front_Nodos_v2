import React, { useContext } from 'react';
import { useApp } from '../context/AppContext';
import { AuthContext } from '../context/AuthContext';
import { User, Shield, Menu } from 'lucide-react';

const ROL_CONFIG = {
  administrador: { label: 'Administrador', sublabel: 'Gestión de Nodos', icon: Shield, color: '#006341', bg: '#dcfce7' },
  maestro:       { label: 'Maestro',       sublabel: 'Gestión de Nodos', icon: Shield, color: '#006341', bg: '#dcfce7' },
  user:          { label: 'Usuario',       sublabel: 'Consulta',         icon: User,   color: '#2563eb', bg: '#dbeafe' },
  usuario:       { label: 'Usuario',       sublabel: 'Consulta',         icon: User,   color: '#2563eb', bg: '#dbeafe' },
};

export default function Topbar() {
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed, setSidebarCollapsed } = useApp();
  const { user } = useContext(AuthContext);

  const role  = user?.role ?? 'user';
  const rolConf = ROL_CONFIG[role] ?? ROL_CONFIG.user;
  const RoleIcon = rolConf.icon;

  const displayName = user?.usuario || 'Perfil';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <header className="h-14 sm:h-16 bg-white border-b border-gray-200 flex items-center justify-between px-3 sm:px-6 flex-shrink-0 z-20">
      {/* Left: Hamburger */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={() => {
            if (window.innerWidth < 1024) {
              setSidebarOpen(!sidebarOpen);
            } else {
              setSidebarCollapsed(!sidebarCollapsed);
            }
          }}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Alternar menú"
        >
          <Menu size={20} className="text-gray-600" />
        </button>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Badge de rol */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white">
          <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: rolConf.bg }}>
            <RoleIcon size={11} style={{ color: rolConf.color }} />
          </div>
          <div className="hidden md:block text-left">
            <p className="font-semibold text-gray-800 text-xs leading-tight">{rolConf.label}</p>
            <p className="text-gray-400 text-xs leading-tight">{rolConf.sublabel}</p>
          </div>
        </div>

        {/* User Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #006341, #004d32)' }}>
            {initials}
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-semibold text-gray-800 leading-tight">{displayName}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
