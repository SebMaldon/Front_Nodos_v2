import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  Network, AlertTriangle, CheckCircle, Activity,
  List, Settings, ArrowRight, RefreshCw, Clock, Wifi
} from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:5090';

export default function PantallaInicio() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalNodos: 0,
    conMantenimiento: 0,
    conOtraAtencion: 0,
    sinImagenes: 0,
    totalFaltantes: 0,
    atendidos: 0,
  });
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const fechaStr = now.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Use limit=1 to get just the summary fields (total, totalAtencion, etc.)
        // The backend returns these aggregate counts regardless of pagination
        const res = await axios.get(`${API_URL}/api/nodos`, {
          params: { page: 1, limit: 1 }
        });

        const data = res.data;

        // If the API returns aggregate stats directly, use them
        if (data && typeof data.total === 'number') {
          setStats({
            totalNodos: data.total ?? 0,
            conMantenimiento: data.totalAtencion ?? 0,
            conOtraAtencion: data.totalOtraAtencion ?? 0,
            sinImagenes: 0, // Not available as aggregate – use nodos array fallback
            totalFaltantes: data.faltantes ?? 0,
            atendidos: (data.totalAtendido ?? 0) + (data.totalOtroAtendido ?? 0),
          });

        // Also fetch sin imágenes count from the first page nodos (approximate)
          // If we have nodos in the response use them for sinImagenes ratio
          if (Array.isArray(data.nodos) && data.total > 0) {
            // Try to get sinImagenes by fetching a dedicated count
            try {
              const sinImgRes = await axios.get(`${API_URL}/api/nodos`, {
                params: { page: 1, limit: 1, sinImagenes: 1 }
              });
              if (sinImgRes.data && typeof sinImgRes.data.total === 'number') {
                setStats(prev => ({ ...prev, sinImagenes: sinImgRes.data.total }));
              }
            } catch (_) { /* ignore */ }
          }
        } else {
          // Fallback: old behavior for non-paginated responses
          const nodos = Array.isArray(data) ? data : (data.nodos || []);
          setStats({
            totalNodos: nodos.length,
            conMantenimiento: nodos.filter(n => n.Atencion).length,
            conOtraAtencion: nodos.filter(n => n.OtraAtencion).length,
            sinImagenes: nodos.filter(n => !n.TieneImagenes).length,
            totalFaltantes: nodos.reduce((sum, n) => sum + (parseInt(n.Nodos_faltantes) || 0), 0),
            atendidos: nodos.filter(n => n.Atendido || n.OtroAtendido).length,
          });
        }
      } catch (e) {
        console.error('Error al cargar estadísticas del dashboard:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);


  const STAT_CARDS = [
    {
      title: 'Total de Nodos',
      value: loading ? '...' : stats.totalNodos,
      sub: 'Registros activos en el sistema',
      icon: Network,
      color: '#006341',
      bg: '#dcfce7',
      progress: 100,
    },
    {
      title: 'Requieren Mantenimiento',
      value: loading ? '...' : stats.conMantenimiento,
      sub: 'Nodos con alerta activa',
      icon: AlertTriangle,
      color: '#dc2626',
      bg: '#fee2e2',
      progress: stats.totalNodos ? Math.round((stats.conMantenimiento / stats.totalNodos) * 100) : 0,
    },
    {
      title: 'Otra Atención Pendiente',
      value: loading ? '...' : stats.conOtraAtencion,
      sub: 'Requieren revisión especial',
      icon: Clock,
      color: '#ca8a04',
      bg: '#fef9c3',
      progress: stats.totalNodos ? Math.round((stats.conOtraAtencion / stats.totalNodos) * 100) : 0,
    },
    {
      title: 'Sin Evidencia Fotográfica',
      value: loading ? '...' : stats.sinImagenes,
      sub: 'Nodos sin imágenes registradas',
      icon: Wifi,
      color: '#2563eb',
      bg: '#dbeafe',
      progress: stats.totalNodos ? Math.round((stats.sinImagenes / stats.totalNodos) * 100) : 0,
    },
  ];

  const QUICK_LINKS = [
    {
      title: 'Catálogo de Nodos',
      desc: 'Visualice el inventario completo de nodos con información técnica y estado actual',
      icon: List,
      color: '#006341',
      bg: '#dcfce7',
      path: '/catalogo-nodos',
      label: 'Ver catálogo',
    },
    {
      title: 'Gestión y Registro',
      desc: 'Registre nuevos nodos, actualice información o elimine registros obsoletos',
      icon: Settings,
      color: '#2563eb',
      bg: '#dbeafe',
      path: '/gestion-nodos',
      label: 'Acceder',
      adminOnly: true,
    },
    {
      title: 'Nodos Prioritarios',
      desc: 'Identifique los nodos que requieren mantenimiento o reemplazo inmediato',
      icon: AlertTriangle,
      color: '#dc2626',
      bg: '#fee2e2',
      path: '/catalogo-prioritarios',
      label: 'Ver prioridades',
    },
  ];

  // Determine user label for header
  const esAdminGlobal = !user?.zona || user.zona === 0;
  const userLabel = esAdminGlobal
    ? 'Administrador — Todas las zonas'
    : `Zona ${user.zona} — ${user.nombre_unidad || user.usuario || 'Delegación'}`;
  const isAdmin = user?.role === 'administrador';


  return (
    <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel Principal</h1>
          <p className="text-gray-500 text-sm mt-1 capitalize">
            Sistema de Gestión de Nodos&nbsp;|&nbsp;{fechaStr}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-600">
          <img src="/IMSS_Logosímbolo_Blanco.png" alt="IMSS" className="w-5 h-5 object-contain" style={{ filter: 'invert(1) sepia(1) saturate(3) hue-rotate(100deg)' }} />
          <span className="font-medium">IMSS — {userLabel}</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STAT_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-500 font-medium">{card.title}</p>
                  <p className="text-3xl font-bold mt-1 text-gray-900">{card.value}</p>
                  <p className="text-xs mt-1" style={{ color: card.color }}>{card.sub}</p>
                </div>
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: card.bg }}
                >
                  <Icon size={22} style={{ color: card.color }} />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400">Proporción</span>
                  <span className="text-xs font-semibold" style={{ color: card.color }}>{card.progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${card.progress}%`, backgroundColor: card.color }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Links + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Quick Links */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {QUICK_LINKS.filter(l => !l.adminOnly || isAdmin).map((link) => {
            const Icon = link.icon;
            return (
              <div
                key={link.path}
                onClick={() => navigate(link.path)}
                className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: link.bg }}
                >
                  <Icon size={20} style={{ color: link.color }} />
                </div>
                <h3 className="font-bold text-gray-900 text-base mb-1">{link.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">{link.desc}</p>
                <div className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: link.color }}>
                  {link.label}
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
          {/* Faltantes card */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-purple-50">
              <RefreshCw size={20} className="text-purple-600" />
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-1">Nodos Faltantes</h3>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {loading ? '...' : stats.totalFaltantes}
            </p>
            <p className="text-sm text-gray-500 mt-1">Total acumulado de nodos no conectados</p>
          </div>
        </div>

        {/* Resumen de estado */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-900">Resumen de Estado</h2>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-50">
              <Activity size={16} className="text-green-600" />
            </div>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Nodos Totales', value: stats.totalNodos, color: '#006341', bg: '#dcfce7' },
              { label: 'Con Mantenimiento', value: stats.conMantenimiento, color: '#dc2626', bg: '#fee2e2' },
              { label: 'Otra Atención', value: stats.conOtraAtencion, color: '#ca8a04', bg: '#fef9c3' },
              { label: 'Atendidos', value: stats.atendidos, color: '#2563eb', bg: '#dbeafe' },
              { label: 'Sin Imágenes', value: stats.sinImagenes, color: '#7c3aed', bg: '#ede9fe' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-600">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: stats.totalNodos ? `${Math.min(100, Math.round((item.value / stats.totalNodos) * 100))}%` : '0%',
                        backgroundColor: item.color
                      }}
                    />
                  </div>
                  <span
                    className="text-sm font-bold w-8 text-right tabular-nums"
                    style={{ color: item.color }}
                  >
                    {loading ? '-' : item.value}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Estado general */}
          <div className="mt-6 pt-4 border-t border-gray-50">
            <div className="flex items-center gap-2 p-3 rounded-xl"
              style={{
                backgroundColor: stats.conMantenimiento === 0 && stats.conOtraAtencion === 0 ? '#dcfce7' : '#fef9c3'
              }}
            >
              {stats.conMantenimiento === 0 && stats.conOtraAtencion === 0 ? (
                <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
              ) : (
                <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
              )}
              <p className="text-sm font-medium"
                style={{ color: stats.conMantenimiento === 0 && stats.conOtraAtencion === 0 ? '#166534' : '#92400e' }}>
                {stats.conMantenimiento === 0 && stats.conOtraAtencion === 0
                  ? 'Todos los nodos en estado óptimo'
                  : `${stats.conMantenimiento + stats.conOtraAtencion} nodo(s) requieren atención`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
