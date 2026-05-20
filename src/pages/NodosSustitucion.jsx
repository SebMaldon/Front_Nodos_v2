import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import axios from 'axios';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const API_URL = 'http://localhost:5090';



const CustomTooltip = ({ title, children }) => (
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>{children}</TooltipTrigger>
            <TooltipContent><p>{title}</p></TooltipContent>
        </Tooltip>
    </TooltipProvider>
);
const NodosSustitucion = () => {
    const { user } = useContext(AuthContext);
    const getTipoAtencionLabel = (val) => {
        switch (val) {
            case 'uno': return 'Mantenimiento Resuelto';
            case 'mantenimiento': return 'Requieren Mantenimiento';
            case 'otraAtencion': return 'Requieren Otra Atención';
            case 'ambos': return 'Ambos Pendientes';
            case 'ninguno': return 'Sin Pendientes';
            default: return 'Todos los estatus de atención';
        }
    };
    const [selectedNodo, setSelectedNodo] = useState(null); // Estado para almacenar el nodo seleccionado (detalles)
    const [selectedImage, setSelectedImage] = useState(null); // Estado para almacenar la imagen seleccionada
    const [selectedSinAtencionNodo, setSelectedAtencionNodo] = useState(null); // Estado para almacenar información del nodo y sus registros de mantenimiento
    const [selectedSinOtherAtencionNodo, setSelectedOtherAtencionNodo] = useState(null); // Estado para almacenar información del nodo y sus registros de otras atenciones
    const [unidades, setUnidades] = useState([]); // Estado para almacenar las unidades
    const [totalRegistros, setTotalRegistros] = useState(0); // Estado para el total de registros
    const [totalFaltantes, setTotalFaltantes] = useState(0); // Estado para el total de nodos faltantes
    const [totalAtencion, setTotalAtencion] = useState(0); // Estado para el total de nodos faltantes
    const [totalOtroAtendido, setTotalOtroAtendido] = useState(0); // Estado para el total de nodos atendidos de otras atenciones
    const [totalAtendidos, setTotalAtendidos] = useState(0); // Estado para el total de nodos atendidos en mantenimiento
    const [totalOtraAtencion, setTotalOtraAtencion] = useState(0); // Estado para el total de nodos faltantes
    const [searchUnidadSustitucion, setSearchUnidadSustitucion] = useState("");
    const unidadesFiltradasSustitucion = unidades.filter(u => u.nombre.toLowerCase().includes(searchUnidadSustitucion.toLowerCase()));
    const [filteredNodos, setFilteredNodos] = useState([]); // Estado para almacenar la nueva consulta
    const [filtros, setFiltros] = useState({ // Estado para los filtros
        atencion: '',
        unidad: '',
        otraatencion: '',
        categoria: '',
        anioInstalacion: '',
        longitudRango: '',
        conNodosFaltantes: '',
        ipSwitch: '',
        estadoCable: '',
        conObservaciones: '',
        atendido: '',
    });

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');

    const displayedNodos = React.useMemo(() => {
        if (!searchTerm.trim()) return filteredNodos;
        const term = searchTerm.toLowerCase();
        return filteredNodos.filter(nodo => 
            (nodo.Ubicacion && nodo.Ubicacion.toLowerCase().includes(term)) ||
            (nodo.Area && nodo.Area.toLowerCase().includes(term)) ||
            (nodo.Unidad && nodo.Unidad.toLowerCase().includes(term)) ||
            (nodo.IpSwitch && nodo.IpSwitch.toLowerCase().includes(term)) ||
            (nodo.Puerto && String(nodo.Puerto).toLowerCase().includes(term))
        );
    }, [filteredNodos, searchTerm]);

    // Reset page to 0 when searchTerm or filters change
    useEffect(() => {
        setPage(0);
    }, [filtros, searchTerm]);

    // Cargar los registros al cambiar filtros o paginación
    useEffect(() => {
        fetchNodos();
    }, [filtros, page, rowsPerPage]);

    // Función para abrir el modal con los detalles del nodo
    const handleDetailsClick = async (nodoData) => {
        try {
            const response = await axios.get(`${API_URL}/api/nodos/${nodoData.Id}`); // Llama a la API para obtener los detalles completos del nodo
            setSelectedNodo(response.data); // Guarda los detalles completos en el estado
        } catch (error) {
            console.error('Error al obtener los detalles del nodo:', error);
            alert('Error al obtener los detalles del nodo');
        }
    };

    // Función para mostrar la imagen en grande
    const handleImageClick = (imageUrl) => {
        setSelectedImage(`${API_URL}` + imageUrl); // Guarda la imagen seleccionada en el estado
    };

    // Función para obtener los registros desde el backend
    const fetchNodos = async () => {
        try {
            const params = { ...filtros }; // Copiar los filtros actuales

            // Modificar los filtros según el valor de "tipoAtencion"
            switch (filtros.tipoAtencion) {
                case 'mantenimiento':
                    params.atencion = 1; // Requiere mantenimiento
                    params.otraatencion = ''; // Ignorar otro tipo de atención
                    break;
                case 'otraAtencion':
                    params.atencion = ''; // Ignorar mantenimiento
                    params.otraatencion = 1; // Requiere otro tipo de atención
                    break;
                case 'ambos':
                    params.atencion = 1; // Requiere mantenimiento
                    params.otraatencion = 1; // Requiere otro tipo de atención
                    break;
                case 'ninguno':
                    params.atencion = 0; // No requiere mantenimiento
                    params.otraatencion = 0; // No requiere otro tipo de atención
                    params.atendido = 0;
                    break;
                case 'uno':
                    params.atendido = 1;
                    break;
                case 'cero':
                    params.atendido = 0;
                    break;
                default:
                    params.atencion = ''; // Sin filtro de atención
                    params.otraatencion = ''; // Sin filtro de otro tipo de atención
                    break;
            }

            // Eliminar el campo "tipoAtencion" para no enviarlo a la API
            delete params.tipoAtencion;

            // Hacer la solicitud a la API con los filtros modificados
            const response = await axios.get(`${API_URL}/api/nodos/candidatos`, {
                params: { ...params, page: page + 1, limit: rowsPerPage },
            });

            setFilteredNodos(response.data.nodos); // Almacenar los datos filtrados en el estado
            setTotalRegistros(response.data.total); // Almacenar el total de registros en el estado
            setTotalFaltantes(response.data.faltantes); // Almacenar el total de nodos faltantes en el estado
            setTotalAtencion(response.data.totalAtencion); // Almacenar el total de nodos que requieren mantenimiento en el estado
            setTotalOtraAtencion(response.data.totalOtraAtencion); // Almacenar el total de nodos que requieren otro tipo de atención en el estado
            setTotalAtendidos(response.data.totalAtendido); // Almacenar el total de nodos que han recibido atención de mantenimiento en el estado
            setTotalOtroAtendido(response.data.totalOtroAtendido); // Almacenar el total de nodos que han recibido atención de otro tipo en el estado
        } catch (error) {
            console.error('Error al obtener los registros:', error);
        }
    };

    // Obtener las unidades al cargar el componente
    useEffect(() => {
        const fetchUnidades = async () => { // Función para obtener las unidades
            try {
                const response = await axios.get(`${API_URL}/api/nodos/unidades`); // Hacer una petición GET a la API
                const lista = response.data;
                setUnidades(lista);

                // Si el usuario tiene unidad asignada, pre-seleccionarla automáticamente
                if (user?.id_unidad && user.id_unidad !== 0) {
                    const unidadAsignada = lista.find(
                        u => String(u.id_unidad) === String(user.id_unidad)
                    );
                    if (unidadAsignada) {
                        setFiltros(prev => ({ ...prev, unidad: unidadAsignada.ref }));
                    }
                }
            } catch (error) {
                console.error('Error al obtener las unidades:', error);
            }
        };

        fetchUnidades(); // Llamar a la función para obtener las unidades
    }, []);

    const handleFiltroChange = (e) => {
        const { name, value } = e.target; // Extrae el nombre y el valor del campo
        setFiltros({ ...filtros, [name]: value }); // Actualiza el estado de los filtros
    };

    // Función para abrir el modal de información del mantenimiento
    const handleAtencionClick = async (nodoData) => {
        try {
            // Obtener las imágenes solventadas desde el backend
            const response = await axios.get(`${API_URL}/api/nodos/${nodoData.Id}`);
            const Datos = response.data;

            // Actualizar el nodo con las imágenes solventadas
            setSelectedAtencionNodo(Datos);
        } catch (error) {
            console.error('Error al obtener los datos del nodo:', error);
        }
    };

    // Función para abrir el modal de información otras atenciones
    const handleOtherAtencionClick = async (nodoData) => {
        try {
            // Obtener las imágenes solventadas desde el backend
            const response = await axios.get(`${API_URL}/api/nodos/${nodoData.Id}`);
            const Datos = response.data;

            // Actualizar el nodo con las imágenes solventadas
            setSelectedOtherAtencionNodo(Datos);
        } catch (error) {
            console.error('Error al obtener los datos:', error);
        }
    };

    // Función para cerrar los modales
    const handleCloseModal = () => {
        setSelectedNodo(null); // Limpia el estado
        setSelectedImage(null); // Limpia el estado
        setSelectedAtencionNodo(null); // Limpia el estado
        setSelectedOtherAtencionNodo(null); // Limpia el estado
    };

    // Función para verificar si un campo (array) está vacío
    const EstaVacio = (dato) => {
        if (dato.length == 0) {
            return true;
        } else {
            return false;
        }
    };

    return (
        <div className="space-y-6 w-full">
            {/* Header principal */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">Gestión de Nodos Prioritarios</h1>
                    <p className="text-sm text-slate-500 mt-1">Nodos con mayor urgencia de atención o sustitución — Delegación Nayarit</p>
                </div>
                <div className="flex items-center gap-3">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button onClick={fetchNodos} size="icon" variant="outline" className="bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200 shadow-xs">
                                    <i className="fas fa-sync-alt"></i>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Refrescar datos</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>

            {/* Tarjetas de estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total de Nodos */}
                <div className="bg-white rounded-xl border-l-4 border-l-emerald-500 border border-slate-200/80 p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-200">
                    <div>
                        <span className="block text-sm font-medium text-slate-500">Nodos Prioritarios</span>
                        <span className="text-3xl font-bold text-slate-900 mt-1">{totalRegistros}</span>
                        <div className="text-xs text-slate-400 mt-1.5">Nodos en lista de prioridad</div>
                    </div>
                    <div className="h-12 w-12 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 shrink-0">
                        <i className="fas fa-network-wired text-xl"></i>
                    </div>
                </div>

                {/* Requieren Mantenimiento */}
                <div className="bg-white rounded-xl border-l-4 border-l-red-500 border border-slate-200/80 p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-200">
                    <div>
                        <span className="block text-sm font-medium text-slate-500">Requieren Mantenimiento</span>
                        <span className="text-3xl font-bold text-red-600 mt-1">{totalAtencion || 0}</span>
                        <div className="text-xs text-red-400 mt-1.5">Prioridad por mantenimiento</div>
                    </div>
                    <div className="h-12 w-12 bg-red-50 rounded-lg flex items-center justify-center text-red-600 shrink-0">
                        <i className="fas fa-tools text-xl"></i>
                    </div>
                </div>

                {/* Otra Atención Pendiente */}
                <div className="bg-white rounded-xl border-l-4 border-l-amber-500 border border-slate-200/80 p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-200">
                    <div>
                        <span className="block text-sm font-medium text-slate-500">Otra Atención Pendiente</span>
                        <span className="text-3xl font-bold text-amber-600 mt-1">{totalOtraAtencion || 0}</span>
                        <div className="text-xs text-amber-500 mt-1.5 font-medium">Prioridad por otras atenciones</div>
                    </div>
                    <div className="h-12 w-12 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 shrink-0">
                        <i className="fas fa-exclamation-triangle text-xl"></i>
                    </div>
                </div>

                {/* Total Faltantes */}
                <div className="bg-white rounded-xl border-l-4 border-l-slate-400 border border-slate-200/80 p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-200">
                    <div>
                        <span className="block text-sm font-medium text-slate-500">Nodos Faltantes</span>
                        <span className="text-3xl font-bold text-slate-700 mt-1">{totalFaltantes || 0}</span>
                        <div className="text-xs text-slate-400 mt-1.5">Instalaciones prioritarias</div>
                    </div>
                    <div className="h-12 w-12 bg-slate-50 rounded-lg flex items-center justify-center text-slate-600 shrink-0">
                        <i className="fas fa-folder-minus text-xl"></i>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row md:items-center gap-4">
                {/* Búsqueda cliente-side */}
                <div className="flex-1 relative">
                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                    <input
                        type="text"
                        placeholder="Buscar por ubicación, IP de switch, puerto o área..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all placeholder:text-slate-400"
                    />
                </div>
                {/* Filtro de Atención */}
                <div className="w-full md:w-auto min-w-[200px]">
                    <Select value={filtros.tipoAtencion || " "} onValueChange={(val) => handleFiltroChange({target: {name: 'tipoAtencion', value: val.trim()}})}>
                        <SelectTrigger className="w-full bg-slate-50/50 border-slate-200 text-sm">
                            <SelectValue placeholder="Filtro de atención">
                                {filtros.tipoAtencion && filtros.tipoAtencion !== " " ? getTipoAtencionLabel(filtros.tipoAtencion) : "Todos los estatus de atención"}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value=" ">Todos los estatus de atención</SelectItem>
                            <SelectItem value="uno">Mantenimiento Resuelto</SelectItem>
                            <SelectItem value="mantenimiento">Requieren Mantenimiento</SelectItem>
                            <SelectItem value="otraAtencion">Requieren Otra Atención</SelectItem>
                            <SelectItem value="ambos">Ambos Pendientes</SelectItem>
                            <SelectItem value="ninguno">Sin Pendientes</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {/* Filtro de Unidad */}
                <div className="w-full md:w-auto min-w-[220px]">
                    <Select value={filtros.unidad || " "} onValueChange={(val) => handleFiltroChange({target: {name: 'unidad', value: val.trim()}})}>
                        <SelectTrigger className="w-full bg-slate-50/50 border-slate-200 text-sm">
                            <SelectValue placeholder="Todas las unidades">
                                {filtros.unidad && filtros.unidad !== " " ? (unidades.find(u => String(u.ref) === filtros.unidad)?.nombre || filtros.unidad) : "Todas las unidades"}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <div className="p-2 sticky top-0 bg-white z-10 border-b border-slate-100">
                                <Input
                                    placeholder="Buscar unidad..."
                                    value={searchUnidadSustitucion}
                                    onChange={(e) => setSearchUnidadSustitucion(e.target.value)}
                                    onKeyDown={(e) => e.stopPropagation()}
                                    className="h-8 text-xs bg-slate-50 focus-visible:ring-emerald-500"
                                />
                            </div>
                            <SelectItem value=" ">Todas las unidades</SelectItem>
                            {unidadesFiltradasSustitucion.map((unidad) => (
                                <SelectItem key={unidad.ref} value={String(unidad.ref)}>
                                    {unidad.nombre}
                                </SelectItem>
                            ))}
                            {unidadesFiltradasSustitucion.length === 0 && (
                                <div className="py-4 text-center text-xs text-slate-500">No se encontraron unidades</div>
                            )}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Tabla Card */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden w-full">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow>
                            <TableHead className="font-semibold text-slate-700 uppercase tracking-wider text-xs">Ubicación / Área</TableHead>
                            <TableHead className="font-semibold text-slate-700 uppercase tracking-wider text-xs">Unidad / IP Switch</TableHead>
                            <TableHead className="font-semibold text-slate-700 uppercase tracking-wider text-xs">Detalles de Cable</TableHead>
                            <TableHead className="font-semibold text-slate-700 uppercase tracking-wider text-xs">Estado</TableHead>
                            <TableHead className="font-semibold text-slate-700 uppercase tracking-wider text-xs text-center">Faltantes</TableHead>
                            <TableHead className="font-semibold text-slate-700 uppercase tracking-wider text-xs text-center">Atención</TableHead>
                            <TableHead className="font-semibold text-slate-700 uppercase tracking-wider text-xs text-center">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {displayedNodos.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                                    No se encontraron registros.
                                </TableCell>
                            </TableRow>
                        ) : (
                            displayedNodos.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map((nodoData, index) => {
                                const rowClass = "hover:bg-slate-50/80 transition-colors";

                                return (
                                    <TableRow key={index} className={rowClass}>
                                        {/* Ubicación / Área */}
                                        <TableCell className="py-4">
                                            <div className="font-semibold text-slate-900">{nodoData.Ubicacion}</div>
                                            <div className="text-xs text-slate-400 mt-0.5">{nodoData.Area || 'Sin área asignada'}</div>
                                        </TableCell>

                                        {/* Unidad / IP Switch */}
                                        <TableCell className="py-4">
                                            <div className="font-medium text-slate-700">{nodoData.Unidad}</div>
                                            <div className="text-xs font-mono text-slate-400 mt-0.5">{nodoData.IpSwitch || 'Sin IP'}</div>
                                        </TableCell>

                                        {/* Detalles de Cable */}
                                        <TableCell className="py-4">
                                            <div className="font-medium text-slate-700 text-xs bg-slate-100/60 rounded px-1.5 py-0.5 inline-block">
                                                Categoría: {nodoData.CategoriaCable}
                                            </div>
                                            <div className="text-xs text-slate-400 mt-1">
                                                Puerto: {nodoData.Puerto} • Longitud: {nodoData.Longitud}m • {nodoData.AnioInstalacion}
                                            </div>
                                        </TableCell>

                                        {/* Estado */}
                                        <TableCell className="py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                                nodoData.EstadoCable === 'Bueno' ? 'bg-green-50 text-green-700 border-green-200' :
                                                nodoData.EstadoCable === 'Regular' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                'bg-red-50 text-red-700 border-red-200'
                                            }`}>
                                                {nodoData.EstadoCable}
                                            </span>
                                        </TableCell>

                                        {/* Faltantes */}
                                        <TableCell className="py-4 text-center font-semibold text-slate-700">
                                            {nodoData.Nodos_faltantes || '0'}
                                        </TableCell>

                                        {/* Atención */}
                                        <TableCell className="py-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                {/* Mantenimiento */}
                                                {nodoData.Atendido && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200">
                                                        M: Resuelto
                                                    </span>
                                                )}
                                                {!nodoData.Atendido && nodoData.Atencion && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200 animate-pulse">
                                                        M: Pendiente
                                                    </span>
                                                )}

                                                {/* Otra Atención */}
                                                {nodoData.OtroAtendido && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        OA: Resuelto
                                                    </span>
                                                )}
                                                {!nodoData.OtroAtendido && nodoData.OtraAtencion && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                                        OA: Alerta
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>

                                        {/* Acciones */}
                                        <TableCell className="py-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                {/* Ver detalles */}
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                onClick={() => handleDetailsClick(nodoData)}
                                                                className="h-8 w-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 border border-slate-200"
                                                            >
                                                                <i className="fas fa-eye text-xs"></i>
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Ver detalles y materiales</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>

                                                {/* Mantenimiento */}
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                onClick={() => handleAtencionClick(nodoData)}
                                                                className="h-8 w-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 border border-slate-200"
                                                            >
                                                                <i className="fas fa-wrench text-xs"></i>
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Mantenimiento (M)</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>

                                                {/* Otra atención */}
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                onClick={() => handleOtherAtencionClick(nodoData)}
                                                                className="h-8 w-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 border border-slate-200"
                                                            >
                                                                <i className="fas fa-exclamation-triangle text-xs"></i>
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Otra atención (OA)</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Paginación */}
            <div className="flex items-center justify-between px-4 py-4 bg-white border border-slate-200 rounded-xl shadow-xs w-full">
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
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                    </select>
                </div>
                <div className="flex items-center gap-4 text-sm">
                    <span className="text-slate-500 font-medium">
                        {page * rowsPerPage + 1}–{Math.min((page + 1) * rowsPerPage, displayedNodos.length)} de {displayedNodos.length}
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
                            onClick={() => setPage(p => Math.min(Math.ceil(displayedNodos.length / rowsPerPage) - 1, p + 1))}
                            disabled={(page + 1) * rowsPerPage >= displayedNodos.length}
                            className="h-8 w-8 p-0"
                        >
                            <i className="fas fa-chevron-right text-xs"></i>
                        </Button>
                    </div>
                </div>
            </div>

            {/* ===================== MODALES (SHADCN DIALOGS) ===================== */}

            {/* 1. Modal de Mantenimiento */}
            <Dialog open={!!selectedSinAtencionNodo} onOpenChange={(open) => !open && setSelectedAtencionNodo(null)}>
                <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto bg-white p-6 rounded-xl shadow-lg border border-slate-200">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <i className="fas fa-tools text-red-600"></i>
                            Información de Mantenimiento
                        </DialogTitle>
                    </DialogHeader>
                    {selectedSinAtencionNodo && (
                        <div className="space-y-4 py-2">
                            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm">
                                <div>
                                    <span className="text-slate-400 block uppercase text-[10px] font-bold">Ubicación</span>
                                    <span className="font-semibold text-slate-800">{selectedSinAtencionNodo.Ubicacion}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block uppercase text-[10px] font-bold">Unidad</span>
                                    <span className="font-semibold text-slate-800">{selectedSinAtencionNodo.Unidad}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block uppercase text-[10px] font-bold">Categoría del Cable</span>
                                    <span className="font-semibold text-slate-800">{selectedSinAtencionNodo.CategoriaCable}</span>
                                </div>
                                {selectedSinAtencionNodo.Observaciones && (
                                    <div className="col-span-2">
                                        <span className="text-slate-400 block uppercase text-[10px] font-bold">Observaciones Generales</span>
                                        <span className="text-slate-800">{selectedSinAtencionNodo.Observaciones}</span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <h4 className="font-semibold text-slate-800 mb-2 text-sm uppercase tracking-wider">Historial de Mantenimientos</h4>
                                {selectedSinAtencionNodo.mantenimiento && selectedSinAtencionNodo.mantenimiento.length > 0 ? (
                                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                                        <Table>
                                            <TableHeader className="bg-slate-50">
                                                <TableRow>
                                                    <TableHead className="font-semibold text-slate-700 text-xs">Fecha de registro</TableHead>
                                                    <TableHead className="font-semibold text-slate-700 text-xs">Observaciones</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedSinAtencionNodo.mantenimiento.map((CamposMantenimiento, idx) => (
                                                    <TableRow key={idx}>
                                                        <TableCell className="text-slate-600 text-xs">{CamposMantenimiento.FechaCambio}</TableCell>
                                                        <TableCell className="text-slate-600 text-xs">{CamposMantenimiento.ObservacionesUsuario}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <p className="text-slate-400 text-sm italic">No hay registros de mantenimientos.</p>
                                )}
                            </div>

                            <div>
                                <h4 className="font-semibold text-slate-800 mb-2 text-sm uppercase tracking-wider">Imágenes de Solventación</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {selectedSinAtencionNodo.imagesSolventadas && selectedSinAtencionNodo.imagesSolventadas.length > 0 ? (
                                        selectedSinAtencionNodo.imagesSolventadas.map((image, index) => {
                                            const fileName = image.ImagenURL.split('/').pop();
                                            const timestampMatch = fileName.match(/(\d+)\.\w+$/);
                                            const timestamp = timestampMatch ? parseInt(timestampMatch[1], 10) : null;
                                            const formattedDate = timestamp && new Date(timestamp).getFullYear() >= 2010
                                                ? new Date(timestamp).toLocaleDateString('es-MX', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                })
                                                : 'Fecha no disponible';

                                            return (
                                                <div key={index} className="border border-slate-200 rounded-lg p-2 bg-slate-50 flex flex-col items-center justify-between text-center shadow-xs">
                                                    <span className="text-[10px] text-slate-400 font-medium mb-1">{formattedDate}</span>
                                                    <img
                                                        src={`${API_URL}${image.ImagenURL}`}
                                                        alt={`Solventado ${index + 1}`}
                                                        className="w-full h-24 object-cover rounded-md cursor-pointer hover:opacity-90 transition"
                                                        onClick={() => handleImageClick(image.ImagenURL)}
                                                    />
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-slate-400 text-sm italic col-span-3">No hay imágenes disponibles.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={() => setSelectedAtencionNodo(null)} variant="outline">
                            Cerrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 2. Modal de Otras Atenciones */}
            <Dialog open={!!selectedSinOtherAtencionNodo} onOpenChange={(open) => !open && setSelectedOtherAtencionNodo(null)}>
                <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto bg-white p-6 rounded-xl shadow-lg border border-slate-200">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <i className="fas fa-exclamation-triangle text-amber-600"></i>
                            Información de Otras Atenciones
                        </DialogTitle>
                    </DialogHeader>
                    {selectedSinOtherAtencionNodo && (
                        <div className="space-y-4 py-2">
                            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm">
                                <div>
                                    <span className="text-slate-400 block uppercase text-[10px] font-bold">Ubicación</span>
                                    <span className="font-semibold text-slate-800">{selectedSinOtherAtencionNodo.Ubicacion}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block uppercase text-[10px] font-bold">Unidad</span>
                                    <span className="font-semibold text-slate-800">{selectedSinOtherAtencionNodo.Unidad}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block uppercase text-[10px] font-bold">Categoría del Cable</span>
                                    <span className="font-semibold text-slate-800">{selectedSinOtherAtencionNodo.CategoriaCable}</span>
                                </div>
                                {selectedSinOtherAtencionNodo.Observaciones && (
                                    <div className="col-span-2">
                                        <span className="text-slate-400 block uppercase text-[10px] font-bold">Observaciones Generales</span>
                                        <span className="text-slate-800">{selectedSinOtherAtencionNodo.Observaciones}</span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <h4 className="font-semibold text-slate-800 mb-2 text-sm uppercase tracking-wider">Historial de Otras Atenciones</h4>
                                {selectedSinOtherAtencionNodo.otrasAtenciones && selectedSinOtherAtencionNodo.otrasAtenciones.length > 0 ? (
                                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                                        <Table>
                                            <TableHeader className="bg-slate-50">
                                                <TableRow>
                                                    <TableHead className="font-semibold text-slate-700 text-xs">Fecha de registro</TableHead>
                                                    <TableHead className="font-semibold text-slate-700 text-xs">Observaciones</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedSinOtherAtencionNodo.otrasAtenciones.map((CamposOtrasAtenciones, idx) => (
                                                    <TableRow key={idx}>
                                                        <TableCell className="text-slate-600 text-xs">{CamposOtrasAtenciones.FechaCambio}</TableCell>
                                                        <TableCell className="text-slate-600 text-xs">{CamposOtrasAtenciones.ObservacionesUsuario}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <p className="text-slate-400 text-sm italic">No hay registros de otras atenciones.</p>
                                )}
                            </div>

                            <div>
                                <h4 className="font-semibold text-slate-800 mb-2 text-sm uppercase tracking-wider">Imágenes de Solventación</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {selectedSinOtherAtencionNodo.imagesSolventadas && selectedSinOtherAtencionNodo.imagesSolventadas.length > 0 ? (
                                        selectedSinOtherAtencionNodo.imagesSolventadas.map((image, index) => {
                                            const fileName = image.ImagenURL.split('/').pop();
                                            const timestampMatch = fileName.match(/(\d+)\.\w+$/);
                                            const timestamp = timestampMatch ? parseInt(timestampMatch[1], 10) : null;
                                            const formattedDate = timestamp && new Date(timestamp).getFullYear() >= 2010
                                                ? new Date(timestamp).toLocaleDateString('es-MX', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                })
                                                : 'Fecha no disponible';

                                            return (
                                                <div key={index} className="border border-slate-200 rounded-lg p-2 bg-slate-50 flex flex-col items-center justify-between text-center shadow-xs">
                                                    <span className="text-[10px] text-slate-400 font-medium mb-1">{formattedDate}</span>
                                                    <img
                                                        src={`${API_URL}${image.ImagenURL}`}
                                                        alt={`Solventado ${index + 1}`}
                                                        className="w-full h-24 object-cover rounded-md cursor-pointer hover:opacity-90 transition"
                                                        onClick={() => handleImageClick(image.ImagenURL)}
                                                    />
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-slate-400 text-sm italic col-span-3">No hay imágenes disponibles.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={() => setSelectedOtherAtencionNodo(null)} variant="outline">
                            Cerrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 3. Modal de Detalles Extra del Nodo */}
            <Dialog open={!!selectedNodo} onOpenChange={(open) => !open && setSelectedNodo(null)}>
                <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto bg-white p-6 rounded-xl shadow-lg border border-slate-200">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <i className="fas fa-info-circle text-green-700"></i>
                            Detalles Extra del Nodo
                        </DialogTitle>
                    </DialogHeader>
                    {selectedNodo && (
                        <div className="space-y-6 py-2">
                            <div>
                                <h4 className="font-semibold text-slate-800 mb-2 text-sm uppercase tracking-wider">Imágenes del Nodo</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {selectedNodo.images && selectedNodo.images.length > 0 ? (
                                        selectedNodo.images.map((image, index) => {
                                            const fileName = image.ImagenURL.split('/').pop();
                                            const timestampMatch = fileName.match(/(\d+)\.\w+$/);
                                            const timestamp = timestampMatch ? parseInt(timestampMatch[1], 10) : null;
                                            const formattedDate = timestamp && new Date(timestamp).getFullYear() >= 2010
                                                ? new Date(timestamp).toLocaleDateString('es-MX', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                })
                                                : 'Fecha no disponible';

                                            const isSolventado = image.ImagenURL.toLowerCase().includes('solventado');

                                            return (
                                                <div key={index} className="border border-slate-200 rounded-lg p-2 bg-slate-50 flex flex-col items-center justify-between text-center shadow-xs">
                                                    <span className={`text-[10px] font-semibold mb-1 ${isSolventado ? 'text-green-600' : 'text-slate-500'}`}>
                                                        {isSolventado ? 'Solventado' : 'General'}
                                                    </span>
                                                    <img
                                                        src={`${API_URL}${image.ImagenURL}`}
                                                        alt={`Imagen ${index + 1}`}
                                                        className="w-full h-24 object-cover rounded-md cursor-pointer hover:opacity-90 transition mb-1"
                                                        onClick={() => handleImageClick(image.ImagenURL)}
                                                    />
                                                    <span className="text-[9px] text-slate-400">{formattedDate}</span>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-slate-400 text-sm italic col-span-3">No hay imágenes disponibles.</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-semibold text-slate-800 mb-2 text-sm uppercase tracking-wider">Materiales Necesarios</h4>
                                    {selectedNodo.materiales && selectedNodo.materiales.length > 0 ? (
                                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                                            <Table>
                                                <TableHeader className="bg-slate-50">
                                                    <TableRow>
                                                        <TableHead className="font-semibold text-slate-700 text-xs">Material</TableHead>
                                                        <TableHead className="font-semibold text-slate-700 text-xs text-right font-medium">Cantidad</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {selectedNodo.materiales.map((mat, idx) => (
                                                        <TableRow key={idx}>
                                                            <TableCell className="text-slate-700 text-xs font-medium">{mat.Nombre}</TableCell>
                                                            <TableCell className="text-slate-600 text-xs text-right">{mat.Necesarios}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    ) : (
                                        <p className="text-slate-400 text-sm italic">No hay materiales necesarios.</p>
                                    )}
                                </div>

                                <div>
                                    <h4 className="font-semibold text-slate-800 mb-2 text-sm uppercase tracking-wider">Materiales Utilizados</h4>
                                    {selectedNodo.materiales && selectedNodo.materiales.length > 0 ? (
                                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                                            <Table>
                                                <TableHeader className="bg-slate-50">
                                                    <TableRow>
                                                        <TableHead className="font-semibold text-slate-700 text-xs">Material</TableHead>
                                                        <TableHead className="font-semibold text-slate-700 text-xs text-right font-medium">Cantidad</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {selectedNodo.materiales.map((mat, idx) => (
                                                        <TableRow key={idx}>
                                                            <TableCell className="text-slate-700 text-xs font-medium">{mat.Nombre}</TableCell>
                                                            <TableCell className="text-slate-600 text-xs text-right">{mat.Utilizados}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    ) : (
                                        <p className="text-slate-400 text-sm italic">No hay materiales utilizados.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={() => setSelectedNodo(null)} variant="outline">
                            Cerrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 4. Modal de Imagen Grande */}
            <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
                <DialogContent className="sm:max-w-3xl bg-white p-6 rounded-xl shadow-lg border border-slate-200">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-slate-800">
                            Vista de Imagen
                        </DialogTitle>
                    </DialogHeader>
                    {selectedImage && (
                        <div className="flex flex-col items-center py-2 space-y-4">
                            <img
                                src={selectedImage}
                                alt="Imagen completa"
                                className="max-h-[60vh] object-contain rounded-md border border-slate-100 shadow-md"
                            />
                            <a 
                                href={selectedImage} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-xs text-green-700 hover:underline break-all"
                            >
                                Abrir en pestaña nueva
                            </a>
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={() => setSelectedImage(null)} variant="outline">
                            Cerrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default NodosSustitucion;