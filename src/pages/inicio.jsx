import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  Network, AlertTriangle, CheckCircle, Activity,
  List, Settings, ArrowRight, RefreshCw, Clock, Wifi, ChevronDown, Check
} from 'lucide-react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

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

  const [fullChartData, setFullChartData] = useState([]);
  const [selectedUnits, setSelectedUnits] = useState([]);
  const chartMaxBars = 10;
  
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [resNodos, resUnidades] = await Promise.all([
            axios.get(`${API_URL}/api/nodos`, { params: { page: 1, limit: 10000 } }),
            axios.get(`${API_URL}/api/nodos/unidades/detalle`, { params: { page: 1, limit: 1000 } }).catch(() => ({ data: { unidades: [] } }))
        ]);
        
        const data = resNodos.data;
        const nodosArray = Array.isArray(data) ? data : (data.nodos || []);
        const unidadesArray = resUnidades.data.unidades || [];

        const unitNameMap = {};
        unidadesArray.forEach(u => {
            unitNameMap[String(u.ref)] = u.nombre || `Ref: ${u.ref}`;
        });

        let conMant = 0, conOtra = 0, sinImg = 0, faltantes = 0, atendidos = 0;
        const grouped = {};
        
        nodosArray.forEach(n => {
            const reqMantenimiento = n.Atencion === 1 || n.Atencion === true;
            const reqOtraAtencion = n.OtraAtencion === 1 || n.OtraAtencion === true;
            const atendido = n.Atendido === 1 || n.Atendido === true || n.OtroAtendido === 1 || n.OtroAtendido === true;
            
            if (reqMantenimiento) conMant++;
            if (reqOtraAtencion) conOtra++;
            if (!n.TieneImagenes) sinImg++;
            if (atendido) atendidos++;
            faltantes += (parseInt(n.Nodos_faltantes) || 0);

            const rawRef = n.Referencia || n.referencia;
            const unitRef = String(rawRef || n.unidad || n.Unidad || 'Desconocida');
            const unitName = unitNameMap[unitRef] || n.Unidad || `Unidad ${unitRef}`;
            
            if (!grouped[unitName]) {
                grouped[unitName] = { name: unitName, unitId: unitRef, total: 0, Optimos: 0, 'Requieren Mantenimiento': 0, 'Otra Atención': 0 };
            }
            
            grouped[unitName].total += 1;
            
            if (reqMantenimiento) {
                grouped[unitName]['Requieren Mantenimiento'] += 1;
            } else if (reqOtraAtencion) {
                grouped[unitName]['Otra Atención'] += 1;
            } else {
                grouped[unitName].Optimos += 1;
            }
        });

        setStats({
            totalNodos: nodosArray.length,
            conMantenimiento: conMant,
            conOtraAtencion: conOtra,
            sinImagenes: sinImg,
            totalFaltantes: faltantes,
            atendidos: atendidos,
        });

        const chartDataRaw = Object.values(grouped).sort((a, b) => b.total - a.total);
        setFullChartData(chartDataRaw);
        setSelectedUnits(chartDataRaw.slice(0, 6).map(d => d.name));

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
      filter: 'reqMantenimiento',
    },
    {
      title: 'Otra Atención Pendiente',
      value: loading ? '...' : stats.conOtraAtencion,
      sub: 'Requieren revisión especial',
      icon: Clock,
      color: '#ca8a04',
      bg: '#fef9c3',
      progress: stats.totalNodos ? Math.round((stats.conOtraAtencion / stats.totalNodos) * 100) : 0,
      filter: 'reqOtraAtencion',
    },
    {
      title: 'Sin Evidencia Fotográfica',
      value: loading ? '...' : stats.sinImagenes,
      sub: 'Nodos sin imágenes registradas',
      icon: Wifi,
      color: '#2563eb',
      bg: '#dbeafe',
      progress: stats.totalNodos ? Math.round((stats.sinImagenes / stats.totalNodos) * 100) : 0,
      filter: 'sinImagenes',
    },
  ];

  const handleToggleUnit = (unitName) => {
    if (selectedUnits.includes(unitName)) {
        setSelectedUnits(prev => prev.filter(n => n !== unitName));
    } else {
        if (selectedUnits.length >= chartMaxBars) {
            return; // Or show notification
        }
        setSelectedUnits(prev => [...prev, unitName]);
    }
  };

  const chartData = fullChartData.filter(d => selectedUnits.includes(d.name));

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
              onClick={() => navigate('/catalogo-nodos', card.filter ? { state: { activeCardFilter: card.filter } } : {})}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
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

      {/* Gráfica de Nodos por Unidad */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
                <h2 className="text-lg font-bold text-gray-900">Nodos por Unidad</h2>
                <p className="text-sm text-gray-500">Distribución de nodos y estados (Mostrando {selectedUnits.length} de {fullChartData.length} unidades)</p>
            </div>
            
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="h-9 gap-2 text-sm">
                        <Settings size={14} /> Filtrar Unidades
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                    <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                        <p className="text-sm font-medium">Seleccionar unidades a graficar</p>
                        <p className="text-xs text-gray-500">Máximo {chartMaxBars} permitidas.</p>
                    </div>
                    <div className="p-2 max-h-60 overflow-y-auto">
                        {fullChartData.map(unit => {
                            const isSelected = selectedUnits.includes(unit.name);
                            const isDisabled = !isSelected && selectedUnits.length >= chartMaxBars;
                            return (
                                <div 
                                    key={unit.name}
                                    onClick={() => !isDisabled && handleToggleUnit(unit.name)}
                                    className={`flex items-center justify-between p-2 rounded-md text-sm transition-colors ${
                                        isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-100'
                                    }`}
                                >
                                    <span className="truncate pr-2 flex-1">{unit.name} ({unit.total})</span>
                                    {isSelected && <Check size={16} className="text-green-600 shrink-0" />}
                                </div>
                            );
                        })}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
        
        <div className="w-full overflow-x-auto pb-4">
            {loading ? (
                <div className="h-[350px] w-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
            ) : chartData.length > 0 ? (
                <div className="h-[380px]" style={{ minWidth: `${Math.max(100, chartData.length * 120)}px`, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                            style={{ cursor: 'pointer' }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis 
                                dataKey="name" 
                                axisLine={false}
                                tickLine={false}
                                interval={0}
                                tick={{ fontSize: 11, fill: '#6b7280', width: 100 }}
                                tickFormatter={(val) => {
                                    let name = val.replace(/^Unidad\s+/i, '');
                                    return name.length > 18 ? name.substring(0, 15) + '...' : name;
                                }}
                            />
                            <YAxis 
                                yAxisId="left"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#006341', fontWeight: 500 }}
                            />
                            <YAxis 
                                yAxisId="right"
                                orientation="right"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#ef4444', fontWeight: 500 }}
                            />
                            <RechartsTooltip 
                                cursor={{ fill: '#f3f4f6' }}
                                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            <Bar yAxisId="left" dataKey="Optimos" fill="#006341" radius={[4, 4, 0, 0]} maxBarSize={40} minPointSize={4} onClick={(data) => navigate('/catalogo-nodos', { state: { unidadFilter: data.unitId || data.payload?.unitId } })} />
                            <Bar yAxisId="right" dataKey="Otra Atención" fill="#eab308" radius={[4, 4, 0, 0]} maxBarSize={40} minPointSize={4} onClick={(data) => navigate('/catalogo-nodos', { state: { unidadFilter: data.unitId || data.payload?.unitId } })} />
                            <Bar yAxisId="right" dataKey="Requieren Mantenimiento" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} minPointSize={4} onClick={(data) => navigate('/catalogo-nodos', { state: { unidadFilter: data.unitId || data.payload?.unitId } })} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="h-full w-full flex items-center justify-center text-gray-500">
                    No hay datos disponibles para graficar.
                </div>
            )}
        </div>
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
          <div 
            onClick={() => navigate('/catalogo-nodos', { state: { activeCardFilter: 'totalFaltantes' } })}
            className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
          >
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
              { label: 'Con Mantenimiento', value: stats.conMantenimiento, color: '#dc2626', bg: '#fee2e2', filter: 'reqMantenimiento' },
              { label: 'Otra Atención', value: stats.conOtraAtencion, color: '#ca8a04', bg: '#fef9c3', filter: 'reqOtraAtencion' },
              { label: 'Atendidos', value: stats.atendidos, color: '#2563eb', bg: '#dbeafe', filter: ['mantResuelto', 'otraAtResuelta'] },
              { label: 'Sin Imágenes', value: stats.sinImagenes, color: '#7c3aed', bg: '#ede9fe', filter: 'sinImagenes' },
            ].map(item => (
              <div 
                key={item.label} 
                className="flex items-center justify-between p-2 -mx-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => navigate('/catalogo-nodos', item.filter ? { state: { activeCardFilter: item.filter } } : {})}
              >
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
