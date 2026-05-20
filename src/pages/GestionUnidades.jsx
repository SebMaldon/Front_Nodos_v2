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

const API_URL = 'http://localhost:5090';

export default function GestionUnidades() {
    const { user } = useContext(AuthContext);

    const esAdminGlobal = !user?.id_unidad || user.id_unidad === 0;
    const esDeUnidadEspecifica = !esAdminGlobal;
    
    const [unidades, setUnidades] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Client-side pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);

    // Search and filters state
    const [searchTerm, setSearchTerm] = useState('');
    const [filtroZona, setFiltroZona] = useState(' ');
    
    // Quick tabs state
    const [tabFilter, setTabFilter] = useState('Todas');

    // Modals state
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [unidadToEdit, setUnidadToEdit] = useState(null);
    const [selectedUnidadDetails, setSelectedUnidadDetails] = useState(null);
    
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
        alert('Unidad registrada correctamente.');
        fetchUnidadesDetalle();
    };

    // Handle opening edit modal
    const openEditModal = (unidad, e) => {
        e.stopPropagation();
        if (esDeUnidadEspecifica && String(unidad.id_unidad) !== String(user.id_unidad)) {
            alert('No tienes permisos para editar esta unidad.');
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
            alert('Por favor, completa los campos obligatorios: Referencia, Nombre y Tipo de Unidad.');
            return;
        }
        if (editFormData.zona !== '' && editFormData.zona !== null && parseInt(editFormData.zona, 10) < 0) {
            alert('La zona no puede ser un número negativo.');
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
            alert('Unidad actualizada correctamente.');
            setUnidadToEdit(null);
            fetchUnidadesDetalle();
        } catch (error) {
            console.error('Error al actualizar la unidad:', error);
            alert(error.response?.data?.message || error.response?.data || 'Error al intentar actualizar la unidad.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const onClickEliminar = async (unidad, e) => {
        e.stopPropagation();
        if (!window.confirm(`¿Estás seguro que deseas eliminar la unidad ${unidad.ref} (${unidad.nombre})?`)) return;

        try {
            await axios.delete(`${API_URL}/api/nodos/unidades`, {
                params: {
                    ref: unidad.ref,
                    ip: unidad.ip,
                    vlan: unidad.vlan
                }
            });
            alert('Unidad eliminada correctamente.');
            fetchUnidadesDetalle();
        } catch (error) {
            console.error('Error al eliminar la unidad:', error);
            alert('Error al intentar eliminar la unidad.');
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
                              normalize(u.ref).includes(normalize(searchTerm));
        const matchesZona = filtroZona === ' ' || String(u.zona) === filtroZona;
        
        let matchesTab = true;
        if (tabFilter === 'Médicas') matchesTab = normalize(u.tipo_unidad).includes('medica');
        if (tabFilter === 'Administrativas') matchesTab = normalize(u.tipo_unidad).includes('administrat');

        return matchesSearch && matchesZona && matchesTab;
    });

    // Client-side paging
    const paginatedUnidades = filteredUnidades.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

    const zonasDisponibles = [...new Set(unidades.map(u => u.zona).filter(z => z !== null && z !== undefined && z !== ''))].sort((a, b) => a - b);
    
    // Contadores para pestañas
    const medicasCount = unidades.filter(u => normalize(u.tipo_unidad).includes('medica')).length;
    const administrativasCount = unidades.filter(u => normalize(u.tipo_unidad).includes('administrat')).length;

    return (
        <div className="space-y-6 w-full animate-fade-in pb-10">
            {/* Header Institucional */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
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

                    {esAdminGlobal && (
                        <Button 
                            onClick={() => setShowRegisterModal(true)}
                            className="h-10 bg-[#005E3A] hover:bg-[#004d30] text-white font-medium rounded-lg px-4 flex items-center gap-2 shadow-xs transition-colors"
                        >
                            <i className="fas fa-plus"></i> Registrar Unidad
                        </Button>
                    )}
                </div>
            </div>

            {/* Pestañas Rápidas de Filtrado */}
            <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl w-fit border border-slate-200/50">
                <button 
                    onClick={() => setTabFilter('Todas')} 
                    className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-all ${tabFilter === 'Todas' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                >
                    Todas las Unidades
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tabFilter === 'Todas' ? 'bg-emerald-800 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        {unidades.length}
                    </span>
                </button>
                <button 
                    onClick={() => setTabFilter('Médicas')} 
                    className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-all ${tabFilter === 'Médicas' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                >
                    Médicas
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tabFilter === 'Médicas' ? 'bg-emerald-800 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        {medicasCount}
                    </span>
                </button>
                <button 
                    onClick={() => setTabFilter('Administrativas')} 
                    className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-all ${tabFilter === 'Administrativas' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                >
                    Administrativas
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tabFilter === 'Administrativas' ? 'bg-emerald-800 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        {administrativasCount}
                    </span>
                </button>
            </div>

            {/* UNIFICACIÓN DEL CONTENEDOR PRINCIPAL */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
                
                <div className="flex flex-col md:flex-row gap-3 items-center">
                    <div className="w-full md:flex-1 relative">
                        <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                        <input 
                            type="text"
                            placeholder="Buscar unidad por nombre o ref..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 h-10 bg-white border border-slate-200 rounded-lg text-sm shadow-2xs focus-visible:ring-emerald-600 focus:outline-none focus:ring-2 focus:border-transparent transition-all placeholder:text-slate-400"
                        />
                    </div>
                    
                    <div className="w-full md:w-auto min-w-[200px]">
                        <Select value={filtroZona} onValueChange={setFiltroZona}>
                            <SelectTrigger className="w-full h-10 bg-white border border-slate-200 rounded-lg text-sm shadow-2xs focus-visible:ring-emerald-600">
                                <SelectValue placeholder="Todas las zonas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value=" ">Todas las zonas</SelectItem>
                                {zonasDisponibles.map(z => (
                                    <SelectItem key={z} value={String(z)}>Zona {z}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="text-xs text-slate-400 font-medium">
                    {filteredUnidades.length} registros encontrados
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden w-full">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 hover:bg-slate-50">
                                <TableHead className="font-semibold text-slate-500 text-xs uppercase tracking-wider">Ref</TableHead>
                                <TableHead className="font-semibold text-slate-500 text-xs uppercase tracking-wider">Nombre</TableHead>
                                <TableHead className="font-semibold text-slate-500 text-xs uppercase tracking-wider">Tipo</TableHead>
                                <TableHead className="font-semibold text-slate-500 text-xs uppercase tracking-wider">Proveedor</TableHead>
                                <TableHead className="font-semibold text-slate-500 text-xs uppercase tracking-wider">Enlace / Velocidad</TableHead>
                                <TableHead className="font-semibold text-slate-500 text-xs uppercase tracking-wider text-right pr-6">Acciones</TableHead>
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
                                    const esSeleccionable = esAdminGlobal || String(unidad.id_unidad) === String(user?.id_unidad);
                                    
                                    return (
                                        <TableRow 
                                            key={idx} 
                                            onClick={() => openDetailsModal(unidad)}
                                            className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                                        >
                                            <TableCell className="font-semibold text-slate-700">
                                                {unidad.ref}
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium text-slate-800 line-clamp-2 max-w-xs" title={unidad.nombre}>
                                                    {unidad.nombre}
                                                </div>
                                                <div className="text-xs text-slate-400 font-mono mt-1">IP: {unidad.ip || 'N/A'}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`font-normal ${unidad.tipo_unidad === 'Médica' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : 'border-blue-200 text-blue-700 bg-blue-50'}`}>
                                                    {unidad.tipo_unidad}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm text-slate-700">{unidad.proveedor || '-'}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm text-slate-700 font-medium">{unidad.tipo_enlace || '-'}</div>
                                                <div className="text-xs text-slate-400">{unidad.velocidad || ''}</div>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                                                    onClick={(e) => { e.stopPropagation(); openDetailsModal(unidad); }}
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
                                                                        onClick={(e) => openEditModal(unidad, e)}
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
                                                                        onClick={(e) => onClickEliminar(unidad, e)}
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
                    <div className="flex items-center justify-between pt-2">
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
