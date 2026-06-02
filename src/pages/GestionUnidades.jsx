import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

import UnidadForm from '../components/UnidadForm';
import EditUnidadModal from '../components/EditUnidadModal';
import UnidadDetailsModal from '../components/UnidadDetailsModal';
import { useNotifications } from '../context/NotificationContext';

const API_URL = 'http://localhost:5090';

export default function GestionUnidades() {
    const { user } = useContext(AuthContext);
    const { success, error: toastError, warn, confirm } = useNotifications();

    const esAdminGlobal = !user?.zona;
    const esDeUnidadEspecifica = !esAdminGlobal;
    
    const ENLACE_MAP = {
        1: 'Fibra Óptica',
        2: 'Cobre',
        3: 'Satelital',
        4: 'Punto a punto',
        5: 'Otro'
    };

    const [unidades, setUnidades] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Client-side pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);

    // Search and filters state
    const [searchTerm, setSearchTerm] = useState('');
    const [filtroZona, setFiltroZona] = useState('TODAS');
    const [filtroProveedor, setFiltroProveedor] = useState('TODOS');
    const [filtroEnlace, setFiltroEnlace] = useState('TODOS');
    
    // Quick tabs state
    const [tabFilter, setTabFilter] = useState('Todas');

    // Modals state
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [unidadToEdit, setUnidadToEdit] = useState(null);
    const [selectedUnidadDetails, setSelectedUnidadDetails] = useState(null);
    const [selectedRowId, setSelectedRowId] = useState(null);
    
    const [editFormData, setEditFormData] = useState({});
    const [currentOldData, setCurrentOldData] = useState(null);

    const fetchUnidadesDetalle = async () => {
        setIsLoading(true);
        try {
            // Fetch all records at once (client-side pagination handles display)
            const response = await axios.get(`${API_URL}/api/nodos/unidades/detalle`, {
                params: {
                    page: 1,
                    limit: 1000
                }
            });
            setUnidades(response.data.unidades || []);
        } catch (error) {
            console.error('Error al obtener el detalle de las unidades:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUnidadesDetalle();
    }, []);

    // Handle adding new unidad
    const handleAddUnidad = async (submitData) => {
        await axios.post(`${API_URL}/api/nodos/unidades`, submitData);
        success('Unidad registrada correctamente.');
        fetchUnidadesDetalle();
    };

    // Handle opening edit modal
    const openEditModal = (unidad, e) => {
        e.stopPropagation();
        // Un administrador de zona específica puede editar unidades de su propia zona
        // Un administrador de unidad específica (si existe) podría limitarse a su unidad,
        // pero aquí nos basamos en la zona si el usuario tiene una asignada.
        const canEdit = esAdminGlobal || 
            (user?.zona && String(unidad.zona) === String(user.zona)) ||
            (user?.id_unidad && String(unidad.id_unidad) === String(user.id_unidad));

        if (!canEdit) {
            warn('No tienes permisos para editar esta unidad.');
            return;
        }
        
        setCurrentOldData({
            ref: unidad.ref,
            ip: unidad.ip,
            vlan: unidad.vlan
        });
        
        setEditFormData({
            ref: unidad.ref || '',
            nombre: unidad.nombre || '',
            ip: unidad.ip || '',
            tipo_unidad: unidad.tipo_unidad || 'Médica',
            vlan: unidad.vlan !== null ? unidad.vlan : '',
            zona: unidad.zona !== null ? unidad.zona : '',
            bits: unidad.bits !== null ? unidad.bits : '',
            ipinit: unidad.ipinit || '',
            proveedor: unidad.proveedor || '',
            fecha_migracion: unidad.fecha_migracion || '',
            velocidad: unidad.velocidad || '',
            tipo_enlace: unidad.tipo_enlace || '',
        });
        
        setUnidadToEdit(unidad);
    };

    const handleEditFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditFormData({
            ...editFormData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSaveChanges = async () => {
        if (!editFormData.ref || !editFormData.nombre || !editFormData.tipo_unidad) {
            warn('Por favor, completa los campos obligatorios: Referencia, Nombre y Tipo de Unidad.');
            return;
        }
        if (editFormData.zona !== '' && editFormData.zona !== null && parseInt(editFormData.zona, 10) < 0) {
            warn('La zona no puede ser un número negativo.');
            return;
        }

        setIsSubmitting(true);
        try {
            await axios.put(`${API_URL}/api/nodos/unidades`, {
                oldData: currentOldData,
                newData: {
                    ...editFormData,
                    vlan: editFormData.vlan === '' ? null : parseInt(editFormData.vlan, 10),
                    zona: editFormData.zona === '' ? null : parseInt(editFormData.zona, 10),
                    bits: editFormData.bits === '' ? null : parseInt(editFormData.bits, 10),
                }
            });
            success('Unidad actualizada correctamente.');
            setUnidadToEdit(null);
            fetchUnidadesDetalle();
        } catch (error) {
            console.error('Error al actualizar la unidad:', error);
            toastError(error.response?.data?.message || error.response?.data || 'Error al intentar actualizar la unidad.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const onClickEliminar = async (unidad, e) => {
        e.stopPropagation();
        if (!await confirm(`¿Estás seguro que deseas eliminar la unidad ${unidad.ref} (${unidad.nombre})?`)) return;

        try {
            await axios.delete(`${API_URL}/api/nodos/unidades`, {
                params: {
                    ref: unidad.ref,
                    ip: unidad.ip,
                    vlan: unidad.vlan
                }
            });
            success('Unidad eliminada correctamente.');
            fetchUnidadesDetalle();
        } catch (error) {
            console.error('Error al eliminar la unidad:', error);
            toastError('Error al intentar eliminar la unidad.');
        }
    };

    const openDetailsModal = (unidad) => {
        setSelectedUnidadDetails(unidad);
    };

    // Normalize string: remove accents, lowercase for comparison
    const normalize = (str) =>
        (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Filter logic
    const filteredUnidades = unidades.filter(u => {
        const matchesSearch = normalize(u.nombre).includes(normalize(searchTerm)) || 
                              normalize(u.ref).includes(normalize(searchTerm)) ||
                              normalize(u.ip).includes(normalize(searchTerm));
        const matchesZona = filtroZona === 'TODAS' || 
                            (filtroZona === 'SIN_ZONA' && (u.zona === null || u.zona === undefined || String(u.zona).trim() === '')) || 
                            String(u.zona) === filtroZona;
        const matchesProveedor = filtroProveedor === 'TODOS' || (u.proveedor && u.proveedor.toUpperCase() === filtroProveedor);
        const matchesEnlace = filtroEnlace === 'TODOS' || (u.tipo_enlace && String(u.tipo_enlace) === filtroEnlace);
        
        let matchesTab = true;
        if (tabFilter === 'Médicas') matchesTab = normalize(u.tipo_unidad).includes('medica');
        if (tabFilter === 'Administrativas') matchesTab = normalize(u.tipo_unidad).includes('administrat');

        return matchesSearch && matchesZona && matchesProveedor && matchesEnlace && matchesTab;
    });

    // Client-side paging
    const paginatedUnidades = filteredUnidades.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

    const zonasDisponibles = [...new Set(unidades.map(u => u.zona).filter(z => z !== null && z !== undefined && z !== ''))].sort((a, b) => a - b);
    const proveedoresDisponibles = [...new Set(unidades.map(u => u.proveedor ? u.proveedor.toUpperCase() : '').filter(p => p !== ''))].sort();
    
    // Contadores para pestañas optimizados
    const { medicasCount, administrativasCount } = React.useMemo(() => {
        let med = 0;
        let adm = 0;
        unidades.forEach(u => {
            const normalized = (u.tipo_unidad || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            if (normalized.includes('medica')) med++;
            if (normalized.includes('administrat')) adm++;
        });
        return { medicasCount: med, administrativasCount: adm };
    }, [unidades]);

    return (
        <div className="flex flex-col space-y-4 w-full h-full md:h-[calc(100vh-120px)] lg:h-[calc(100vh-140px)] animate-fade-in pb-2">
            {/* Header Institucional */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex-shrink-0">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">Gestión de Unidades</h1>
                    <p className="text-sm text-slate-500 mt-1">Crea, edita o elimina los segmentos de red y unidades de atención del sistema.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    onClick={fetchUnidadesDetalle} 
                                    variant="outline" 
                                    className="h-10 w-10 rounded-full border border-slate-200 p-0 text-slate-500 hover:bg-slate-50 hover:text-slate-700 flex items-center justify-center bg-white shadow-xs"
                                >
                                    <i className="fas fa-sync-alt"></i>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Refrescar datos</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <Button 
                        onClick={() => setShowRegisterModal(true)}
                        className="h-10 bg-[#005E3A] hover:bg-[#004d30] text-white font-medium rounded-lg px-4 flex items-center gap-2 shadow-xs transition-colors"
                    >
                        <i className="fas fa-plus"></i> Registrar Unidad
                    </Button>
                </div>
            </div>

            {/* Tarjetas de estadísticas / filtros rápidos */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mt-2 mb-1 gap-2">
                <span className="text-[10px] sm:text-xs font-semibold text-slate-500 hidden md:inline">Haz clic en las tarjetas para filtrar los resultados en la tabla.</span>
                <span className="text-[10px] font-semibold text-slate-500 md:hidden">Toca las tarjetas para filtrar.</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-shrink-0">
                {/* Todas las Unidades */}
                <div 
                    onClick={() => setTabFilter('Todas')}
                    className={`cursor-pointer rounded-xl border-l-4 p-3 shadow-xs flex items-center justify-between transition-all duration-200 ${
                        tabFilter === 'Todas'
                            ? 'bg-slate-100 border-slate-500 border-y border-r border-slate-200 shadow-sm ring-1 ring-slate-400' 
                            : 'bg-white border-slate-500 border border-slate-200/80 hover:shadow-sm'
                    }`}
                >
                    <div>
                        <span className="block text-[9px] uppercase font-bold tracking-wider text-slate-400">Todas las Unidades</span>
                        <span className="text-xl font-extrabold text-slate-800 mt-0.5 block">{unidades.length}</span>
                    </div>
                    <div className="h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 shrink-0">
                        <i className="fas fa-building text-xs"></i>
                    </div>
                </div>

                {/* Médicas */}
                <div 
                    onClick={() => setTabFilter('Médicas')}
                    className={`cursor-pointer rounded-xl border-l-4 p-3 shadow-xs flex items-center justify-between transition-all duration-200 ${
                        tabFilter === 'Médicas'
                            ? 'bg-emerald-50 border-emerald-500 border-y border-r border-emerald-200 shadow-sm ring-1 ring-emerald-400'
                            : 'bg-white border-emerald-500 border border-slate-200/80 hover:shadow-sm'
                    }`}
                >
                    <div>
                        <span className="block text-[9px] uppercase font-bold tracking-wider text-slate-400">Unidades Médicas</span>
                        <span className="text-xl font-extrabold text-emerald-600 mt-0.5 block">{medicasCount}</span>
                    </div>
                    <div className="h-8 w-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 shrink-0">
                        <i className="fas fa-clinic-medical text-xs"></i>
                    </div>
                </div>

                {/* Administrativas */}
                <div 
                    onClick={() => setTabFilter('Administrativas')}
                    className={`cursor-pointer rounded-xl border-l-4 p-3 shadow-xs flex items-center justify-between transition-all duration-200 ${
                        tabFilter === 'Administrativas'
                            ? 'bg-blue-50 border-blue-500 border-y border-r border-blue-200 shadow-sm ring-1 ring-blue-400'
                            : 'bg-white border-blue-500 border border-slate-200/80 hover:shadow-sm'
                    }`}
                >
                    <div>
                        <span className="block text-[9px] uppercase font-bold tracking-wider text-slate-400">Unidades Administrativas</span>
                        <span className="text-xl font-extrabold text-blue-600 mt-0.5 block">{administrativasCount}</span>
                    </div>
                    <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
                        <i className="fas fa-briefcase text-xs"></i>
                    </div>
                </div>
            </div>

            {/* UNIFICACIÓN DEL CONTENEDOR PRINCIPAL */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col flex-1 min-h-[500px] md:min-h-0 w-full mb-0">
                
                {/* Barra de Filtros (Header del contenedor) */}
                <div className="p-3 border-b border-slate-200/80 flex flex-col md:flex-row md:flex-wrap md:items-center gap-3 bg-slate-50/30">
                    <div className="flex-1 relative">
                        <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                        <input 
                            type="text"
                            placeholder="Buscar unidad por nombre, ref o IP..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all placeholder:text-slate-400"
                        />
                    </div>
                    
                    <div className="w-full md:w-auto min-w-[150px]">
                        <Select value={filtroZona} onValueChange={setFiltroZona}>
                            <SelectTrigger className="w-full bg-slate-50/50 border-slate-200 text-sm h-9">
                                <SelectValue placeholder="Todas las zonas">
                                    {filtroZona === 'TODAS' ? 'Todas las zonas' : filtroZona === 'SIN_ZONA' ? 'Sin zona asignada' : `Zona ${filtroZona}`}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="TODAS">Todas las zonas</SelectItem>
                                <SelectItem value="SIN_ZONA">Sin zona asignada</SelectItem>
                                {zonasDisponibles.map(z => (
                                    <SelectItem key={z} value={String(z)}>Zona {z}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-full md:w-auto min-w-[150px]">
                        <Select value={filtroProveedor} onValueChange={setFiltroProveedor}>
                            <SelectTrigger className="w-full bg-slate-50/50 border-slate-200 text-sm h-9">
                                <SelectValue placeholder="Todos los proveedores">
                                    {filtroProveedor === 'TODOS' ? 'Todos los proveedores' : filtroProveedor}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="TODOS">Todos los proveedores</SelectItem>
                                {proveedoresDisponibles.map(p => (
                                    <SelectItem key={p} value={p}>{p}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-full md:w-auto min-w-[150px]">
                        <Select value={filtroEnlace} onValueChange={setFiltroEnlace}>
                            <SelectTrigger className="w-full bg-slate-50/50 border-slate-200 text-sm h-9">
                                <SelectValue placeholder="Todos los enlaces">
                                    {filtroEnlace === 'TODOS' ? 'Todos los enlaces' : ENLACE_MAP[filtroEnlace] || filtroEnlace}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="TODOS">Todos los enlaces</SelectItem>
                                <SelectItem value="1">Fibra Óptica</SelectItem>
                                <SelectItem value="2">Cobre</SelectItem>
                                <SelectItem value="3">Satelital</SelectItem>
                                <SelectItem value="4">Punto a punto</SelectItem>
                                <SelectItem value="5">Otro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="text-xs text-slate-400 font-medium">
                        {filteredUnidades.length} registros encontrados
                    </div>
                </div>

                <div className="overflow-auto flex-1 w-full min-h-0">
                    <Table className="relative">
                        <TableHeader className="sticky top-0 z-10 bg-slate-50 shadow-[0_1px_2px_rgba(0,0,0,0.08)]">
                            <TableRow className="border-b border-slate-200/80">
                                <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider py-3">Ref</TableHead>
                                <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider py-3">Nombre</TableHead>
                                <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider py-3">Tipo</TableHead>
                                <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider py-3">Proveedor</TableHead>
                                <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider py-3">Enlace / Velocidad</TableHead>
                                <TableHead className="font-semibold text-slate-700 text-xs uppercase tracking-wider text-right pr-6 py-3">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <i className="fas fa-spinner fa-spin text-2xl text-emerald-600"></i>
                                            <p>Cargando unidades...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) :                 filteredUnidades.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center space-y-2">
                                            <i className="fas fa-building text-3xl text-slate-300"></i>
                                            <p>No se encontraron unidades registradas.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedUnidades.map((unidad, idx) => {
                                    const esSeleccionable = esAdminGlobal || 
                                        (user?.zona && String(unidad.zona) === String(user.zona)) ||
                                        (user?.id_unidad && String(unidad.id_unidad) === String(user.id_unidad));
                                    const uniqueRowId = `${unidad.ref}-${unidad.ip || 'no-ip'}`;
                                    const tieneZona = unidad.zona !== null && unidad.zona !== undefined && String(unidad.zona).trim() !== '';
                                    
                                    let rowBgClass = 'hover:bg-slate-50/80';
                                    let leftBorderClass = 'border-l-4 border-transparent';

                                    if (selectedRowId === uniqueRowId) {
                                        rowBgClass = 'bg-blue-50/80 hover:bg-blue-100/60';
                                        leftBorderClass = 'border-l-4 border-blue-500';
                                    } else if (!tieneZona) {
                                        rowBgClass = 'bg-red-50/40 hover:bg-red-50/60';
                                        leftBorderClass = 'border-l-4 border-red-400';
                                    }

                                    return (
                                        <TableRow 
                                            key={idx} 
                                            className={`transition-colors border-b-0 group ${rowBgClass}`}
                                        >
                                            <TableCell className={`py-3 font-semibold text-slate-700 ${leftBorderClass}`}>
                                                <div className="flex items-center gap-2">
                                                    {unidad.ref}
                                                    {!tieneZona && (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <i className="fas fa-exclamation-triangle text-red-500 text-[10px] animate-pulse" title="Sin zona asignada"></i>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Falta asignar zona a esta unidad</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <div className="font-medium text-slate-800 line-clamp-2 max-w-xs" title={unidad.nombre}>
                                                    {unidad.nombre}
                                                </div>
                                                <div className="text-xs text-slate-400 font-mono mt-1">IP: {unidad.ip || 'N/A'}</div>
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                                    unidad.tipo_unidad === 'Médica' 
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                                        : 'bg-blue-50 text-blue-700 border-blue-200'
                                                }`}>
                                                    <i className={`fas ${unidad.tipo_unidad === 'Médica' ? 'fa-clinic-medical' : 'fa-briefcase'} mr-1.5`}></i>
                                                    {unidad.tipo_unidad}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <div className="text-sm text-slate-700">{unidad.proveedor || '-'}</div>
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <div className="text-sm text-slate-700 font-medium">{ENLACE_MAP[unidad.tipo_enlace] || unidad.tipo_enlace || '-'}</div>
                                                <div className="text-xs text-slate-400">{unidad.velocidad || ''}</div>
                                            </TableCell>
                                            <TableCell className="text-right pr-6 py-3">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                                                    onClick={(e) => { e.stopPropagation(); setSelectedRowId(uniqueRowId); openDetailsModal(unidad); }}
                                                                >
                                                                    <i className="fas fa-eye text-sm"></i>
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Ver Detalles</TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>

                                                    {esSeleccionable && (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="icon" 
                                                                        className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                                                                        onClick={(e) => { e.stopPropagation(); setSelectedRowId(uniqueRowId); openEditModal(unidad, e); }}
                                                                    >
                                                                        <i className="fas fa-edit text-sm"></i>
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Editar Unidad</TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}

                                                    {esAdminGlobal && (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="icon" 
                                                                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                                                        onClick={(e) => { e.stopPropagation(); setSelectedRowId(uniqueRowId); onClickEliminar(unidad, e); }}
                                                                    >
                                                                        <i className="fas fa-trash text-sm"></i>
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Eliminar Unidad</TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Paginación client-side */}
                {filteredUnidades.length > 0 && (
                    <div className="flex items-center justify-between p-3 border-t border-slate-200/80 bg-slate-50/50">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span>Registros por página:</span>
                            <select
                                className="border border-slate-200 rounded-lg p-1.5 bg-white text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                                value={rowsPerPage}
                                onChange={(e) => {
                                    setRowsPerPage(parseInt(e.target.value, 10));
                                    setPage(0);
                                }}
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                            <span className="text-slate-500 font-medium">
                                {page * rowsPerPage + 1}–{Math.min((page + 1) * rowsPerPage, filteredUnidades.length)} de {filteredUnidades.length}
                            </span>
                            <div className="flex gap-1">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setPage(p => Math.max(0, p - 1))}
                                    disabled={page === 0}
                                    className="h-8 w-8 p-0"
                                >
                                    <i className="fas fa-chevron-left text-xs"></i>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={(page + 1) * rowsPerPage >= filteredUnidades.length}
                                    className="h-8 w-8 p-0"
                                >
                                    <i className="fas fa-chevron-right text-xs"></i>
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modales */}
            {showRegisterModal && (
                <UnidadForm 
                    onClose={() => setShowRegisterModal(false)} 
                    onAddUnidad={handleAddUnidad} 
                    esAdminGlobal={esAdminGlobal}
                    userZona={user?.zona}
                />
            )}

            {unidadToEdit && (
                <EditUnidadModal 
                    unidadToEdit={unidadToEdit}
                    editFormData={editFormData}
                    handleEditFormChange={handleEditFormChange}
                    handleSaveChanges={handleSaveChanges}
                    handleCloseModal={() => setUnidadToEdit(null)}
                    isSubmitting={isSubmitting}
                    esAdminGlobal={esAdminGlobal}
                />
            )}

            {selectedUnidadDetails && (
                <UnidadDetailsModal 
                    selectedUnidad={selectedUnidadDetails}
                    onClose={() => setSelectedUnidadDetails(null)}
                />
            )}
        </div>
    );
}
