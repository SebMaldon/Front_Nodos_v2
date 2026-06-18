import ExcelJS from 'exceljs';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const API_URL = import.meta.env.VITE_API_URL;



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
    const { success, error: toastError, warn, confirm } = useNotifications();
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
    const [hoveredRow, setHoveredRow] = useState(null); // Estado para marcar la selección en la tabla
    const [selectedRowId, setSelectedRowId] = useState(null); // Estado para la fila seleccionada
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
    const [totalSinImagenes, setTotalSinImagenes] = useState(0); // Estado para total sin imagenes
    const [searchUnidadTabla, setSearchUnidadTabla] = useState("");
    const unidadesFiltradasTabla = unidades.filter(u => u.nombre.toLowerCase().includes(searchUnidadTabla.toLowerCase()));
    const [filteredNodos, setFilteredNodos] = useState([]); // Estado para almacenar la nueva consulta
    const [materiales, setMateriales] = useState([]); // Estado para almacenar los materiales totales de la consulta
    const [total_IDF_MDF, setTotal_IDF_MDF] = useState([]); // Estado para almacenar la suma de los MDF e IDF de la consulta
    const [selectedImagesUnidad, setSelectedImagesUnidad] = useState(null); // Estado para almacenar las imágenes de la unidad seleccionada
    const [selectedImagesUnidadNodos, setSelectedImagesUnidadNodos] = useState(null); // Estado para almacenar las imágenes de la consulta
    const [showMaterials, setShowMaterials] = useState(false); // Estado para mostrar el modal de materiales
    const [showMdfIdfForm, setShowMdfIdfForm] = useState(false);
    const [isEditingMdfIdf, setIsEditingMdfIdf] = useState(false);
    const [fetchedUnitCodes, setFetchedUnitCodes] = useState([]);
    const [fetchedUnitImages, setFetchedUnitImages] = useState([]);
    const [imgVersion, setImgVersion] = useState(Date.now()); // cache-busting para imágenes MDF/IDF
    const [mdfIdfFormData, setMdfIdfFormData] = useState({
        isNew: 'Existente',
        tipo: 'MDF',
        unidadForm: '',
        codigoMDFIDF: '',
        nombre: '',
        file: null
    });
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
    const [page, setPage] = useState(0); // Estado para la página actual
    const [rowsPerPage, setRowsPerPage] = useState(10); // Estado para la cantidad de registros por página
    const [searchTerm, setSearchTerm] = useState('');
    
    // Filtros de Tarjetas
    const [activeCardFilters, setActiveCardFilters] = useState([]); 
    const [isStrictFilterMode, setIsStrictFilterMode] = useState(true);

    const toggleCardFilter = (filterKey) => {
        setActiveCardFilters(prev => 
            prev.includes(filterKey) 
                ? prev.filter(k => k !== filterKey)
                : [...prev, filterKey]
        );
    };

    const clearCardFilters = () => {
        setActiveCardFilters([]);
    };

    const displayedNodos = React.useMemo(() => {
        let result = filteredNodos;

        // Apply Card Filters
        if (activeCardFilters.length > 0) {
            result = result.filter(nodo => {
                const conditions = {
                    reqMantenimiento: nodo.Atencion === 1 || nodo.Atencion === true,
                    reqOtraAtencion: nodo.OtraAtencion === 1 || nodo.OtraAtencion === true,
                    mantResuelto: nodo.Atendido === 1 || nodo.Atendido === true,
                    otraAtResuelta: nodo.OtroAtendido === 1 || nodo.OtroAtendido === true,
                    totalFaltantes: parseInt(nodo.Nodos_faltantes) > 0,
                    sinImagenes: !nodo.TieneImagenes
                };

                const activeConditions = activeCardFilters.map(f => conditions[f]);

                if (isStrictFilterMode) {
                    // AND logic: all active filters must be true
                    return activeConditions.every(cond => cond === true);
                } else {
                    // OR logic: at least one active filter must be true
                    return activeConditions.some(cond => cond === true);
                }
            });
        }

        // Apply Search Term
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            result = result.filter(nodo => 
                (nodo.Ubicacion && nodo.Ubicacion.toLowerCase().includes(term)) ||
                (nodo.Area && nodo.Area.toLowerCase().includes(term)) ||
                (nodo.Unidad && nodo.Unidad.toLowerCase().includes(term)) ||
                (nodo.IpSwitch && nodo.IpSwitch.toLowerCase().includes(term)) ||
                (nodo.Puerto && String(nodo.Puerto).toLowerCase().includes(term))
            );
        }

        return result;
    }, [filteredNodos, searchTerm, activeCardFilters, isStrictFilterMode]);

    // Reset page to 0 when searchTerm changes
    useEffect(() => {
        setPage(0);
    }, [searchTerm]);

    // Paginación para modal de imágenes de nodos
    const [imgNodosPage, setImgNodosPage] = useState(0);
    const [imgNodosPerPage, setImgNodosPerPage] = useState(12);

    // Paginación para modal de imágenes MDF/IDF
    const [imgMdfPage, setImgMdfPage] = useState(0);
    const [imgMdfPerPage, setImgMdfPerPage] = useState(12);

    // Función para abrir el modal con los detalles del nodo
    const handleDetailsClick = async (nodoData) => {
        setSelectedRowId(nodoData.Id);
        try {
            const response = await axios.get(`${API_URL}/api/nodos/${nodoData.Id}`); // Llama a la API para obtener los detalles completos del nodo
            setSelectedNodo(response.data); // Guarda los detalles completos en el estado
        } catch (error) {
            console.error('Error al obtener los detalles del nodo:', error);
            toastError('Error al obtener los detalles del nodo');
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
                    params.atencion = 1;
                    params.otraatencion = '';
                    break;
                case 'otraAtencion':
                    params.atencion = '';
                    params.otraatencion = 1;
                    break;
                case 'ambos':
                    params.atencion = 1;
                    params.otraatencion = 1;
                    break;
                case 'ninguno':
                    params.atencion = 0;
                    params.otraatencion = 0;
                    params.atendido = 0;
                    break;
                case 'uno':
                    params.atendido = 1;
                    break;
                case 'cero':
                    params.atendido = 0;
                    break;
                default:
                    params.atencion = '';
                    params.otraatencion = '';
                    break;
            }

            delete params.tipoAtencion;

            // Fetch ALL records at once — client-side pagination handles display
            const response = await axios.get(`${API_URL}/api/nodos/candidatos`, {
                params: { ...params, page: 1, limit: 1000 },
            });

            const data = response.data || {};
            const nodos = Array.isArray(data) ? data : (data.nodos || []);

            setFilteredNodos(nodos);
            setTotalRegistros(data.total || nodos.length);
            setTotalFaltantes(data.faltantes || 0);
            setTotalAtencion(data.totalAtencion || 0);
            setTotalOtraAtencion(data.totalOtraAtencion || 0);
            setTotalAtendidos(data.totalAtendido || 0);
            setTotalOtroAtendido(data.totalOtroAtendido || 0);
            
            const nodosRecibidos = nodos;
            const manualSinImagenes = nodosRecibidos.filter(n => !n.TieneImagenes).length;
            setTotalSinImagenes(data.totalSinImagenes !== undefined ? data.totalSinImagenes : manualSinImagenes);

            setMateriales(data.materialesSuma || []);
            setTotal_IDF_MDF(data.idf_mdf_Suma || []);
        } catch (error) {
            console.error('Error al obtener los registros:', error);
        }
    };

    const exportarAExcel = async () => {
        try {
            // 1. Crear un nuevo libro de Excel y hoja de trabajo
            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'Sistema de Gestión de Nodos'; // Metadatos del creador
            workbook.created = new Date(); // Fecha de creación
            const worksheet = workbook.addWorksheet('Registros de Nodos');

            // 2. Definir columnas con anchos personalizados
            worksheet.columns = [
                { header: 'Puerto', key: 'Puerto', width: 12 },
                { header: 'Dirección IP', key: 'Dirección IP', width: 15 },
                { header: 'Ubicación', key: 'Ubicación', width: 40 },
                { header: 'Unidad', key: 'Unidad', width: 30 }
            ];

            // 3. Estilo avanzado para encabezados
            const headerStyle = {
                fill: {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF4472C4' } // Azul más oscuro
                },
                font: {
                    bold: true,
                    color: { argb: 'FFFFFFFF' },
                    size: 14,
                    name: 'Calibri'
                },
                alignment: {
                    vertical: 'middle',
                    horizontal: 'center',
                    wrapText: true
                },
                border: {
                    top: { style: 'thin', color: { argb: 'FF000000' } },
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } }
                }
            };

            // Aplicar estilo a la fila de encabezados
            const headerRow = worksheet.getRow(1);
            headerRow.height = 22; // Altura personalizada
            headerRow.eachCell((cell) => {
                cell.style = headerStyle;
            });

            // 4. Añadir datos con estilos alternados (zebra striping)
            filteredNodos.forEach((nodo, index) => {
                const row = worksheet.addRow({
                    'Puerto': nodo.Puerto || 'N/A',
                    'Dirección IP': nodo.IpSwitch || 'N/A',
                    'Ubicación': nodo.Ubicacion || 'N/A',
                    'Unidad': nodo.Unidad || 'N/A'
                });

                // Estilo para filas (alternar colores)
                const rowStyle = {
                    fill: {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: index % 2 === 0 ? 'FFFFFFFF' : 'FFF2F2F2' }
                    },
                    font: {
                        name: 'Calibri',
                        size: 12
                    },
                    alignment: {
                        vertical: 'middle',
                        horizontal: 'left',
                        wrapText: true
                    },
                    border: {
                        top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                        left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                        bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                        right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
                    }
                };

                row.eachCell((cell) => {
                    cell.style = rowStyle;
                });

                // Ajustar altura de fila automáticamente para contenido largo
                row.height = Math.max(20, Math.ceil(nodo.Ubicacion?.length / 40) * 20);
            });

            // 5. Configuraciones adicionales de la hoja
            // Congelar fila de encabezados
            worksheet.views = [{
                state: 'frozen',
                ySplit: 1,
                showGridLines: false
            }];

            // Añadir filtros automáticos
            worksheet.autoFilter = {
                from: { row: 1, column: 1 },
                to: { row: 1, column: worksheet.columnCount }
            };

            // Proteger hoja (solo lectura)
            //worksheet.protect('', {
            //    selectLockedCells: false,
            //    selectUnlockedCells: false
            //});

            // 6. Generar y descargar el archivo
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });

            // Nombre del archivo con unidad y fecha
            const unidad = filteredNodos[0]?.Unidad || 'Generales';
            const fecha = new Date().toLocaleDateString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }).replace(/\//g, '-');

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Registros_Nodos_${unidad.replace(/\s+/g, '_')}_${fecha}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Error al exportar a Excel:", error);
            toastError("Ocurrió un error al generar el archivo Excel");
        }
    };

    const exportarAExcelMateriales = async () => {
        try {
            // 1. Crear un nuevo libro de Excel y hoja de trabajo
            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'Sistema de Gestión de Nodos'; // Metadatos del creador
            workbook.created = new Date(); // Fecha de creación
            const worksheet = workbook.addWorksheet('Lista de materiales');

            // 2. Definir columnas con anchos personalizados
            worksheet.columns = [
                { header: 'Nombre', key: 'Nombre', width: 24 },
                { header: 'Necesarios', key: 'Necesarios', width: 15 },
                { header: 'Utilizados', key: 'Utilizados', width: 15 }
            ];

            // 3. Estilo avanzado para encabezados
            const headerStyle = {
                fill: {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF4472C4' } // Azul más oscuro
                },
                font: {
                    bold: true,
                    color: { argb: 'FFFFFFFF' },
                    size: 14,
                    name: 'Calibri'
                },
                alignment: {
                    vertical: 'middle',
                    horizontal: 'center',
                    wrapText: true
                },
                border: {
                    top: { style: 'thin', color: { argb: 'FF000000' } },
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } }
                }
            };

            // Aplicar estilo a la fila de encabezados
            const headerRow = worksheet.getRow(1);
            headerRow.height = 22; // Altura personalizada
            headerRow.eachCell((cell) => {
                cell.style = headerStyle;
            });

            // 4. Añadir datos con estilos alternados (zebra striping)
            materiales.forEach((material, index) => {
                const row = worksheet.addRow({
                    'Nombre': material.Nombre || 'N/A',
                    'Necesarios': (material.Necesarios == 0 ? '-' : material.Necesarios + ' ' + material.UnidadMedida) || '-',
                    'Utilizados': (material.Utilizados == 0 ? '-' : material.Utilizados + ' ' + material.UnidadMedida) || '-'
                });

                // Estilo para filas (alternar colores)
                const rowStyle = {
                    fill: {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: index % 2 === 0 ? 'FFFFFFFF' : 'FFF2F2F2' }
                    },
                    font: {
                        name: 'Calibri',
                        size: 12
                    },
                    alignment: {
                        vertical: 'middle',
                        horizontal: 'left',
                        wrapText: true
                    },
                    border: {
                        top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                        left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                        bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                        right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
                    }
                };

                row.eachCell((cell) => {
                    cell.style = rowStyle;
                });

                // Ajustar altura de fila automáticamente para contenido largo
                row.height = Math.max(20, Math.ceil(materiales.Nombre?.length / 40) * 20);
            });

            // 6. Generar y descargar el archivo
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });

            // Nombre del archivo con unidad y fecha
            const unidad = filtros.unidad == '' ? 'Generales' : filteredNodos[0]?.Unidad;
            const fecha = new Date().toLocaleDateString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }).replace(/\//g, '-');

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Materiales_${unidad.replace(/\s+/g, '_')}_${fecha}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Error al exportar a Excel:", error);
            toastError("Ocurrió un error al generar el archivo Excel");
        }
    };

    const exportarAExcelMaterialesNecesarios = async () => {
        try {
            // 1. Crear un nuevo libro de Excel y hoja de trabajo
            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'Sistema de Gestión de Nodos'; // Metadatos del creador
            workbook.created = new Date(); // Fecha de creación
            const worksheet = workbook.addWorksheet('Lista de materiales necesarios');

            // 2. Definir columnas con anchos personalizados
            worksheet.columns = [
                { header: 'Nombre', key: 'Nombre', width: 24 },
                { header: 'Cantidad', key: 'Cantidad', width: 15 }
            ];

            // 3. Estilo avanzado para encabezados
            const headerStyle = {
                fill: {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF4472C4' } // Azul más oscuro
                },
                font: {
                    bold: true,
                    color: { argb: 'FFFFFFFF' },
                    size: 14,
                    name: 'Calibri'
                },
                alignment: {
                    vertical: 'middle',
                    horizontal: 'center',
                    wrapText: true
                },
                border: {
                    top: { style: 'thin', color: { argb: 'FF000000' } },
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } }
                }
            };

            // Aplicar estilo a la fila de encabezados
            const headerRow = worksheet.getRow(1);
            headerRow.height = 22; // Altura personalizada
            headerRow.eachCell((cell) => {
                cell.style = headerStyle;
            });

            // 4. Añadir datos con estilos alternados (zebra striping)
            materiales.forEach((material, index) => {
                const row = worksheet.addRow({
                    'Nombre': material.Nombre || 'N/A',
                    'Cantidad': (material.Necesarios == 0 ? '-' : material.Necesarios + ' ' + material.UnidadMedida) || '-'
                });

                // Estilo para filas (alternar colores)
                const rowStyle = {
                    fill: {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: index % 2 === 0 ? 'FFFFFFFF' : 'FFF2F2F2' }
                    },
                    font: {
                        name: 'Calibri',
                        size: 12
                    },
                    alignment: {
                        vertical: 'middle',
                        horizontal: 'left',
                        wrapText: true
                    },
                    border: {
                        top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                        left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                        bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
                        right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
                    }
                };

                row.eachCell((cell) => {
                    cell.style = rowStyle;
                });

                // Ajustar altura de fila automáticamente para contenido largo
                row.height = Math.max(20, Math.ceil(materiales.Nombre?.length / 40) * 20);
            });

            // 6. Generar y descargar el archivo
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });

            // Nombre del archivo con unidad y fecha
            const unidad = filtros.unidad == '' ? 'Generales' : filteredNodos[0]?.Unidad;
            const fecha = new Date().toLocaleDateString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }).replace(/\//g, '-');

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Materiales_Necesarios_${unidad.replace(/\s+/g, '_')}_${fecha}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Error al exportar a Excel:", error);
            toastError("Ocurrió un error al generar el archivo Excel");
        }
    };

    // Obtener las unidades al cargar el componente
    useEffect(() => {
        const fetchUnidades = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/nodos/unidades`);
                const lista = response.data;
                setUnidades(lista);
                // La pre-selección por zona se maneja en el backend vía JWT.
                // No pre-seleccionamos ninguna unidad para que el usuario zonal
                // pueda ver todas sus unidades (el backend filtra por zona automáticamente).
            } catch (error) {
                console.error('Error al obtener las unidades:', error);
            }
        };

        fetchUnidades();
    }, []);

    // Cargar los registros al iniciar la página
    useEffect(() => {
        fetchNodos();
    }, [filtros, page, rowsPerPage]);

    const handleFiltroChange = (e) => {
        const { name, value } = e.target; // Extrae el nombre y el valor del campo
        setFiltros({ ...filtros, [name]: value }); // Actualiza el estado de los filtros
    };

    // Función para cerrar los modales
    const handleCloseModal = () => {
        setSelectedNodo(null); // Limpia el estado
        setSelectedImage(null); // Limpia el estado
        setSelectedAtencionNodo(null); // Limpia el estado
        setSelectedOtherAtencionNodo(null); // Limpia el estado
    };

    // Función para abrir el modal de información del mantenimiento
    const handleAtencionClick = async (nodoData) => {
        setSelectedRowId(nodoData.Id);
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
        setSelectedRowId(nodoData.Id);
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

    // filtrosEstanVacios: siempre retorna false para que fetchNodos siempre se ejecute.
    // El backend filtra automáticamente por zona usando el token JWT.
    const filtrosEstanVacios = () => false;

    // Función para verificar si un campo (array) está vacío
    const EstaVacio = (dato) => {
        if (dato.length == 0) {
            return true;
        } else {
            return false;
        }
    };

    // Función para abrir el modal de todas las imágenes de la unidad
    const handleImagenesUnidadNodos = async (overrideUnidad) => {
        try {
            // Obtenemos los IDs de los nodos que actualmente se están visualizando en la tabla
            const nodosIds = displayedNodos.map(nodo => nodo.Id);

            // Obtener TODAS las imágenes (limit alto para traer todo y paginar en cliente)
            const response = await axios.post(`${API_URL}/api/nodos/imagenes-nodos-filtrados`, {
                nodosIds: nodosIds,
                page: 1, 
                limit: 9999
            });

            const ImagenesNodos = response.data;

            // Actualizar el nodo con las imágenes solventadas
            setSelectedImagesUnidadNodos(ImagenesNodos);
            setImgNodosPage(0); // Resetear a primera página
        } catch (error) {
            console.error('Error al obtener los datos:', error);
        }
    };

    // Función para abrir el modal de todas las imágenes de la unidad (MDF IDF)
    const handleImagenesUnidad = async (overrideUnidad) => {
        try {
            const unidadParam = typeof overrideUnidad === 'string' ? overrideUnidad : (filtros.unidad || " ");
            const response = await axios.get(`${API_URL}/api/nodos/imagenes/${unidadParam}`, {
                params: { page: 1, limit: 9999 }
            });
            const ImagenesNodos = response.data;
            setSelectedImagesUnidad(ImagenesNodos);
            setImgMdfPage(0); // Resetear a primera página
            return ImagenesNodos; // retorna los datos para uso inmediato
        } catch (error) {
            console.error('Error al obtener los datos:', error);
            return null;
        }
    };

    // === Lógica CRUD MDF e IDF ===
    const handleCloseMdfIdfForm = () => {
        setShowMdfIdfForm(false);
        setIsEditingMdfIdf(false);
        setMdfIdfFormData({ isNew: 'Existente', tipo: 'MDF', unidadForm: '', codigoMDFIDF: '', nombre: '', file: null });
        setFetchedUnitCodes([]);
        setFetchedUnitImages([]);
    };

    const handleFormUnidadChange = async (unidadRef) => {
        setMdfIdfFormData(prev => ({ ...prev, unidadForm: unidadRef, codigoMDFIDF: '' }));
        setFetchedUnitCodes([]);
        setFetchedUnitImages([]);
        if (!unidadRef) return;

        try {
            // Cargar códigos e imágenes de la unidad en paralelo
            const [codigosRes, imagenesRes] = await Promise.all([
                axios.get(`${API_URL}/api/nodos/mdf-idf-codigos/${unidadRef}`),
                axios.get(`${API_URL}/api/nodos/imagenes/${unidadRef}`)
            ]);
            const codigos = codigosRes.data || [];
            const imagenes = imagenesRes.data?.MDF_IDF_Images || [];
            setFetchedUnitCodes(codigos);
            setFetchedUnitImages(imagenes);
        } catch (error) {
            console.error('Error al obtener códigos/imágenes MDF/IDF:', error);
            setFetchedUnitCodes([]);
            setFetchedUnitImages([]);
        }
    };

    const handleEditMdfIdfClick = async (image) => {
        const unidadRef = image.ReferenciaUnidad || '';
        setMdfIdfFormData({
            id: image.Id,
            isNew: 'Editando', // Solo para edición
            tipo: image.Tipo || 'MDF',
            unidadForm: unidadRef,
            codigoMDFIDF: image.CodigoMDFIDF || '',
            nombre: image.Nombre || '',
            file: null
        });
        setFetchedUnitCodes([]);
        setFetchedUnitImages([]);
        if (unidadRef) {
            try {
                const [codigosRes, imagenesRes] = await Promise.all([
                    axios.get(`${API_URL}/api/nodos/mdf-idf-codigos/${unidadRef}`),
                    axios.get(`${API_URL}/api/nodos/imagenes/${unidadRef}`)
                ]);
                setFetchedUnitCodes(codigosRes.data || []);
                setFetchedUnitImages(imagenesRes.data?.MDF_IDF_Images || []);
            } catch (error) {
                console.error('Error al cargar códigos/imágenes para edición:', error);
            }
        }
        setIsEditingMdfIdf(true);
        setShowMdfIdfForm(true);
    };

    const handleDeleteMdfIdf = async (id) => {
        if (!await confirm('¿Estás seguro de que deseas eliminar esta imagen?')) return;
        try {
            await axios.delete(`${API_URL}/api/nodos/mdf-idf-imagenes/${id}`);
            success('Imagen eliminada con éxito');
            setSelectedImage(null); // Cerrar imagen grande
            setImgVersion(Date.now()); // Forzar rotura de cache
            handleImagenesUnidad(); // Recargar
        } catch (error) {
            console.error('Error al eliminar:', error);
            toastError('Hubo un error al eliminar la imagen');
        }
    };

    const handleSubmitMdfIdf = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('Nombre', mdfIdfFormData.nombre);

            if (isEditingMdfIdf) {
                // Multer requiere NombreUnidad para la carpeta de destino
                const referenciaUnidad = mdfIdfFormData.unidadForm || filtros.unidad;
                const unidadObj = unidades.find(u => String(u.ref) === String(referenciaUnidad));
                const nombreUnidad = unidadObj ? unidadObj.nombre : referenciaUnidad;
                formData.append('NombreUnidad', nombreUnidad);
                formData.append('ReferenciaUnidad', referenciaUnidad);
                if (mdfIdfFormData.codigoMDFIDF) {
                    formData.append('CodigoMDFIDF', mdfIdfFormData.codigoMDFIDF);
                }
                if (mdfIdfFormData.file) {
                    formData.append('newImage', mdfIdfFormData.file);
                }
                await axios.put(`${API_URL}/api/nodos/mdf-idf-imagenes/${mdfIdfFormData.id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                success('Imagen actualizada con éxito');
            } else {
                const referenciaUnidad = mdfIdfFormData.unidadForm || filtros.unidad;
                const unidadObj = unidades.find(u => String(u.ref) === String(referenciaUnidad));
                const nombreUnidad = unidadObj ? unidadObj.nombre : referenciaUnidad;
                formData.append('NombreUnidad', nombreUnidad); // ⬅ requerido por Multer para la carpeta
                formData.append('image', mdfIdfFormData.file);
                formData.append('Tipo', mdfIdfFormData.tipo);
                formData.append('ReferenciaUnidad', referenciaUnidad);
                if (mdfIdfFormData.isNew === 'Existente') {
                    formData.append('CodigoMDFIDF', mdfIdfFormData.codigoMDFIDF);
                }

                await axios.post(`${API_URL}/api/nodos/mdf-idf-imagenes`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                success('Imagen agregada con éxito');
            }
            handleCloseMdfIdfForm();
            setImgVersion(Date.now()); // Forzar rotura de cache
            const datosActualizados = await handleImagenesUnidad(); // Recargar lista y obtener datos frescos

            // Si era una edición, actualizar selectedImage al instante con los datos recién obtenidos
            if (isEditingMdfIdf && datosActualizados) {
                const imagenActualizada = datosActualizados.MDF_IDF_Images?.find(
                    img => img.Id === mdfIdfFormData.id
                );
                if (imagenActualizada) {
                    setSelectedImage({ ...imagenActualizada, isMdfIdf: true });
                }
            }
        } catch (error) {
            console.error('Error al guardar:', error);
            toastError('Error al guardar la imagen');
        }
    };
    // =============================

    return (
        <div className="flex flex-col space-y-3 md:h-[calc(100vh-120px)] lg:h-[calc(100vh-140px)]">
            {/* Header del catálogo */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-800">Nodos Prioritarios</h1>
                    <p className="text-xs text-slate-500 mt-0.5">Nodos con mayor urgencia de atención o sustitución</p>
                </div>
                
                {/* Botones de acción alineados en el header */}
                <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end">
                    {/* Botón de Refrescar siempre visible */}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    onClick={fetchNodos} 
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

                    {!EstaVacio(materiales) && (
                        <Button
                            onClick={() => setShowMaterials(true)}
                            className="h-10 bg-[#005E3A] hover:bg-[#004d30] text-white font-medium rounded-lg px-4 flex items-center gap-2 shadow-xs transition-colors"
                        >
                            <i className="fas fa-boxes"></i> Mostrar materiales
                        </Button>
                    )}

                    {filtros.unidad !== '' && (
                        <>
                            <Button
                                onClick={exportarAExcel}
                                className="h-10 bg-[#005E3A] hover:bg-[#004d30] text-white font-medium rounded-lg px-4 flex items-center gap-2 shadow-xs transition-colors"
                                disabled={filteredNodos.length === 0}
                            >
                                <i className="fas fa-file-excel"></i> Exportar
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Tarjetas de estadísticas mejoradas */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mt-2 mb-1 gap-2">
                <span className="text-[10px] sm:text-xs font-semibold text-slate-500 hidden md:inline">Haz clic en las tarjetas para filtrar los resultados en la tabla.</span>
                <span className="text-[10px] font-semibold text-slate-500 md:hidden">Toca las tarjetas para filtrar.</span>
                <div className="flex items-center gap-2 self-start md:self-auto">
                    <span className="text-[10px] sm:text-xs font-semibold text-slate-500">Combinar Filtros:</span>
                    <button 
                        onClick={() => setIsStrictFilterMode(true)}
                        className={`text-[10px] sm:text-xs px-2 sm:px-2.5 py-1 rounded-full border transition-colors ${isStrictFilterMode ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold' : 'bg-white border-slate-200 text-slate-500'}`}
                    >
                        Estricto (Y)
                    </button>
                    <button 
                        onClick={() => setIsStrictFilterMode(false)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${!isStrictFilterMode ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold' : 'bg-white border-slate-200 text-slate-500'}`}
                    >
                        Cualquiera (O)
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                {/* Total Registros */}
                <div 
                    onClick={clearCardFilters}
                    className={`cursor-pointer rounded-xl border-l-4 p-3 shadow-xs flex items-center justify-between transition-all duration-200 ${
                        activeCardFilters.length === 0 
                            ? 'bg-emerald-50 border-emerald-500 border-y border-r border-emerald-200 shadow-sm ring-1 ring-emerald-400' 
                            : 'bg-white border-slate-200 hover:shadow-sm border-l-transparent'
                    }`}
                >
                    <div>
                        <span className="block text-[9px] uppercase font-bold tracking-wider text-slate-400">Nodos Prioritarios</span>
                        <span className="text-xl font-extrabold text-slate-800 mt-0.5 block">{totalRegistros}</span>
                    </div>
                    <div className="h-8 w-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 shrink-0">
                        <i className="fas fa-database text-xs"></i>
                    </div>
                </div>

                {/* Req. Mantenimiento */}
                <div 
                    onClick={() => toggleCardFilter('reqMantenimiento')}
                    className={`cursor-pointer rounded-xl border-l-4 p-3 shadow-xs flex items-center justify-between transition-all duration-200 ${
                        activeCardFilters.includes('reqMantenimiento')
                            ? 'bg-red-50 border-red-500 border-y border-r border-red-200 shadow-sm ring-1 ring-red-400'
                            : 'bg-white border-slate-200 hover:shadow-sm border-l-transparent'
                    }`}
                >
                    <div>
                        <span className="block text-[9px] uppercase font-bold tracking-wider text-slate-400">Req. Mantenimiento</span>
                        <span className="text-xl font-extrabold text-red-600 mt-0.5 block">{totalAtencion || 0}</span>
                    </div>
                    <div className="h-8 w-8 bg-red-50 rounded-lg flex items-center justify-center text-red-600 shrink-0">
                        <i className="fas fa-tools text-xs"></i>
                    </div>
                </div>

                {/* Req. Otra Atención */}
                <div 
                    onClick={() => toggleCardFilter('reqOtraAtencion')}
                    className={`cursor-pointer rounded-xl border-l-4 p-3 shadow-xs flex items-center justify-between transition-all duration-200 ${
                        activeCardFilters.includes('reqOtraAtencion')
                            ? 'bg-amber-50 border-amber-500 border-y border-r border-amber-200 shadow-sm ring-1 ring-amber-400'
                            : 'bg-white border-slate-200 hover:shadow-sm border-l-transparent'
                    }`}
                >
                    <div>
                        <span className="block text-[9px] uppercase font-bold tracking-wider text-slate-400">Req. Otra Atención</span>
                        <span className="text-xl font-extrabold text-amber-600 mt-0.5 block">{totalOtraAtencion || 0}</span>
                    </div>
                    <div className="h-8 w-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-500 shrink-0">
                        <i className="fas fa-exclamation-triangle text-xs"></i>
                    </div>
                </div>

                {/* Mantenimiento Resuelto */}
                <div 
                    onClick={() => toggleCardFilter('mantResuelto')}
                    className={`cursor-pointer rounded-xl border-l-4 p-3 shadow-xs flex items-center justify-between transition-all duration-200 ${
                        activeCardFilters.includes('mantResuelto')
                            ? 'bg-green-50 border-green-600 border-y border-r border-green-200 shadow-sm ring-1 ring-green-400'
                            : 'bg-white border-slate-200 hover:shadow-sm border-l-transparent'
                    }`}
                >
                    <div>
                        <span className="block text-[9px] uppercase font-bold tracking-wider text-slate-400">Mant. Resuelto</span>
                        <span className="text-xl font-extrabold text-green-600 mt-0.5 block">{totalAtendidos || 0}</span>
                    </div>
                    <div className="h-8 w-8 bg-green-50 rounded-lg flex items-center justify-center text-green-600 shrink-0">
                        <i className="fas fa-check-circle text-xs"></i>
                    </div>
                </div>

                {/* Otra At. Resuelta */}
                <div 
                    onClick={() => toggleCardFilter('otraAtResuelta')}
                    className={`cursor-pointer rounded-xl border-l-4 p-3 shadow-xs flex items-center justify-between transition-all duration-200 ${
                        activeCardFilters.includes('otraAtResuelta')
                            ? 'bg-teal-50 border-teal-500 border-y border-r border-teal-200 shadow-sm ring-1 ring-teal-400'
                            : 'bg-white border-slate-200 hover:shadow-sm border-l-transparent'
                    }`}
                >
                    <div>
                        <span className="block text-[9px] uppercase font-bold tracking-wider text-slate-400">Otra At. Resuelta</span>
                        <span className="text-xl font-extrabold text-teal-600 mt-0.5 block">{totalOtroAtendido || 0}</span>
                    </div>
                    <div className="h-8 w-8 bg-teal-50 rounded-lg flex items-center justify-center text-teal-600 shrink-0">
                        <i className="fas fa-tasks text-xs"></i>
                    </div>
                </div>

                {/* Total Faltantes */}
                <div 
                    onClick={() => toggleCardFilter('totalFaltantes')}
                    className={`cursor-pointer rounded-xl border-l-4 p-3 shadow-xs flex items-center justify-between transition-all duration-200 ${
                        activeCardFilters.includes('totalFaltantes')
                            ? 'bg-slate-100 border-slate-400 border-y border-r border-slate-300 shadow-sm ring-1 ring-slate-400'
                            : 'bg-white border-slate-200 hover:shadow-sm border-l-transparent'
                    }`}
                >
                    <div>
                        <span className="block text-[9px] uppercase font-bold tracking-wider text-slate-400">Total Faltantes</span>
                        <span className="text-xl font-extrabold text-slate-600 mt-0.5 block">{totalFaltantes || 0}</span>
                    </div>
                    <div className="h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 shrink-0">
                        <i className="fas fa-folder-minus text-xs"></i>
                    </div>
                </div>

                {/* Sin Imágenes */}
                <div 
                    onClick={() => toggleCardFilter('sinImagenes')}
                    className={`cursor-pointer rounded-xl border-l-4 p-3 shadow-xs flex items-center justify-between transition-all duration-200 ${
                        activeCardFilters.includes('sinImagenes')
                            ? 'bg-blue-50 border-blue-600 border-y border-r border-blue-200 shadow-sm ring-1 ring-blue-400'
                            : 'bg-white border-slate-200 hover:shadow-sm border-l-transparent'
                    }`}
                >
                    <div>
                        <span className="block text-[9px] uppercase font-bold tracking-wider text-slate-400">Sin Imágenes</span>
                        <span className="text-xl font-extrabold text-blue-600 mt-0.5 block">{totalSinImagenes || 0}</span>
                    </div>
                    <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
                        <i className="fas fa-wifi text-xs"></i>
                    </div>
                </div>

            </div>

            {/* Contenedor principal de datos (Filtros + Tabla + Paginación) */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col flex-1 min-h-[500px] md:min-h-0 w-full mb-0">
                
                {/* Barra de Filtros (Header del contenedor) */}
                <div className="p-3 border-b border-slate-200/80 flex flex-col md:flex-row md:flex-wrap md:items-center gap-3 bg-slate-50/30">
                {/* Búsqueda cliente-side */}
                <div className="flex-1 relative">
                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                    <input
                        type="text"
                        placeholder="Buscar por ubicación, IP de switch, puerto o área..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all placeholder:text-slate-400"
                    />
                </div>
                {/* Filtro de Unidad */}
                <div className="w-full md:w-auto min-w-[220px]">
                    <Select value={filtros.unidad || " "} onValueChange={(val) => handleFiltroChange({target: {name: 'unidad', value: val.trim()}})}>
                        <SelectTrigger className="w-full bg-slate-50/50 border-slate-200 text-sm h-9">
                            <SelectValue placeholder="Todas las unidades">
                                {filtros.unidad && filtros.unidad !== " " ? (unidades.find(u => String(u.ref) === filtros.unidad)?.nombre || filtros.unidad) : "Todas las unidades"}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <div className="p-2 sticky top-0 bg-white z-10 border-b border-slate-100">
                                <Input
                                    placeholder="Buscar unidad..."
                                    value={searchUnidadTabla}
                                    onChange={(e) => setSearchUnidadTabla(e.target.value)}
                                    onKeyDown={(e) => e.stopPropagation()}
                                    className="h-8 text-xs bg-slate-50 focus-visible:ring-emerald-500"
                                />
                            </div>
                            <SelectItem value=" ">Todas las unidades</SelectItem>
                            {unidadesFiltradasTabla.map((unidad) => (
                                <SelectItem key={unidad.ref} value={String(unidad.ref)}>
                                    {unidad.nombre}
                                </SelectItem>
                            ))}
                            {unidadesFiltradasTabla.length === 0 && (
                                <div className="py-4 text-center text-xs text-slate-500">No se encontraron unidades</div>
                            )}
                        </SelectContent>
                    </Select>
                </div>
                {/* Botones de Galerías */}
                {total_IDF_MDF?.length > 0 && total_IDF_MDF.map((IDF_MDF, index) => (
                    <Button
                        key={index}
                        variant="outline"
                        onClick={() => handleImagenesUnidad()}
                        className="h-9 bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 shadow-xs transition gap-2 whitespace-nowrap"
                    >
                        <i className="fas fa-images text-sky-500"></i>
                        <span className="hidden lg:inline">Galería</span> {IDF_MDF.Tipo}
                        <span className="bg-sky-100 text-sky-700 py-0.5 px-2 rounded-full text-xs font-bold ml-1">{IDF_MDF.Cantidad}</span>
                    </Button>
                ))}
                
                <Button
                    variant="outline"
                    onClick={() => handleImagenesUnidadNodos()}
                    className="h-9 bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 shadow-xs transition gap-2 whitespace-nowrap"
                >
                    <i className="fas fa-network-wired text-blue-500"></i>
                    <span className="hidden lg:inline">Galería Nodos</span>
                </Button>
            </div>

            {/* Tabla (Body scrollable del contenedor) */}
            <div className="overflow-auto flex-1 w-full min-h-0">
                <Table className="relative">
                    <TableHeader className="sticky top-0 z-10 bg-slate-50 shadow-[0_1px_2px_rgba(0,0,0,0.08)]">
                        <TableRow>
                            <TableHead className="font-semibold text-slate-700 uppercase tracking-wider text-xs">Ubicación / Unidad</TableHead>
                            <TableHead className="font-semibold text-slate-700 uppercase tracking-wider text-xs">Área / IP Switch</TableHead>
                            <TableHead className="font-semibold text-slate-700 uppercase tracking-wider text-xs">Detalles de Cable</TableHead>
                            <TableHead className="font-semibold text-slate-700 uppercase tracking-wider text-xs">Estado</TableHead>
                            <TableHead className="font-semibold text-slate-700 uppercase tracking-wider text-xs text-center">Faltantes</TableHead>
                            <TableHead className="font-semibold text-slate-700 uppercase tracking-wider text-xs text-center">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {displayedNodos.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                                    No se encontraron registros.
                                </TableCell>
                            </TableRow>
                        ) : (
                            displayedNodos.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map((nodoData, index) => {
                                const isSelected = selectedRowId === nodoData.Id;
                                const rowClass = `transition-colors ${
                                    isSelected 
                                        ? 'bg-blue-50/80 hover:bg-blue-100/60' 
                                        : 'hover:bg-slate-50/80'
                                } ${
                                    nodoData.TieneImagenes === 0 
                                        ? 'bg-orange-50/40' 
                                        : ''
                                }`;

                                const firstCellBorderClass = isSelected
                                    ? 'shadow-[inset_4px_0_0_0_#3b82f6]'
                                    : (nodoData.TieneImagenes === 0 ? 'shadow-[inset_4px_0_0_0_#fb923c]' : 'border-l-4 border-transparent');

                                return (
                                    <TableRow key={index} className={rowClass}>
                                        {/* Ubicación / Unidad */}
                                        <TableCell className={`py-3 ${firstCellBorderClass}`}>
                                            <div className="font-semibold text-slate-900 flex items-center gap-2">
                                                {nodoData.Ubicacion}
                                                {nodoData.TieneImagenes === 0 && (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <i className="fas fa-camera-slash text-orange-500 text-[10px] animate-pulse" title="Sin imágenes"></i>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Faltan fotografías de este nodo</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-0.5">{nodoData.Unidad || 'Sin unidad'}</div>
                                        </TableCell>

                                        {/* Área / IP Switch */}
                                        <TableCell className="py-3">
                                            <div className="font-medium text-slate-700">{nodoData.Area || 'Sin área asignada'}</div>
                                            <div className="text-xs font-mono text-slate-400 mt-0.5">{nodoData.IpSwitch || 'Sin IP'}</div>
                                        </TableCell>

                                        {/* Detalles de Cable */}
                                        <TableCell className="py-3">
                                            <div className={`font-medium text-[11px] rounded px-1.5 py-0.5 inline-block ${
                                                parseInt(nodoData.CategoriaCable) < 6
                                                    ? 'bg-red-50 text-red-700 border border-red-200'
                                                    : 'bg-slate-100/60 text-slate-700'
                                            }`}>
                                                Categoría: {nodoData.CategoriaCable}
                                                {parseInt(nodoData.CategoriaCable) < 6 && <i className="fas fa-exclamation-circle ml-1 text-red-500"></i>}
                                            </div>
                                            <div className="text-[11px] text-slate-400 mt-0.5">
                                                Puerto: {nodoData.Puerto} • Longitud: {nodoData.Longitud}m • {nodoData.AnioInstalacion}
                                            </div>
                                        </TableCell>

                                        {/* Estado */}
                                        <TableCell className="py-3">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                                nodoData.EstadoCable?.toLowerCase() === 'bueno' ? 'bg-green-50 text-green-700 border-green-200' :
                                                nodoData.EstadoCable?.toLowerCase() === 'regular' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                'bg-red-50 text-red-700 border-red-200'
                                            }`}>
                                                {nodoData.EstadoCable}
                                            </span>
                                        </TableCell>

                                        {/* Faltantes */}
                                        <TableCell className="py-3 text-center">
                                            <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold ${
                                                parseInt(nodoData.Nodos_faltantes) > 0
                                                    ? 'bg-red-50 text-red-700 border border-red-200'
                                                    : 'text-slate-400'
                                            }`}>
                                                {parseInt(nodoData.Nodos_faltantes) > 0 && <i className="fas fa-exclamation-circle mr-1"></i>}
                                                {nodoData.Nodos_faltantes || '0'}
                                            </span>
                                        </TableCell>



                                        {/* Acciones */}
                                        <TableCell className="py-3 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                {/* Ver detalles */}
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                onClick={() => handleDetailsClick(nodoData)}
                                                                className="h-8 w-8 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                                                            >
                                                                <i className="fas fa-eye text-sm"></i>
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Ver detalles completos</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>

                                                {/* Mantenimiento — colored by status */}
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                onClick={() => handleAtencionClick(nodoData)}
                                                                className={`h-8 w-8 rounded-lg transition-colors ${
                                                                    nodoData.Atencion
                                                                        ? 'text-red-600 hover:text-red-700 hover:bg-red-50'
                                                                        : nodoData.Atendido
                                                                            ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                                                                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                                                }`}
                                                            >
                                                                <i className="fas fa-wrench text-sm"></i>
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Mantenimiento: {nodoData.Atencion ? 'Pendiente' : nodoData.Atendido ? 'Resuelto' : 'Sin reporte'}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>

                                                {/* Otra atención — colored by status */}
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                onClick={() => handleOtherAtencionClick(nodoData)}
                                                                className={`h-8 w-8 rounded-lg transition-colors ${
                                                                    nodoData.OtraAtencion
                                                                        ? 'text-red-600 hover:text-red-700 hover:bg-red-50'
                                                                        : nodoData.OtroAtendido
                                                                            ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                                                                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                                                }`}
                                                            >
                                                                <i className="fas fa-exclamation-triangle text-sm"></i>
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Otra Atención: {nodoData.OtraAtencion ? 'Pendiente' : nodoData.OtroAtendido ? 'Resuelta' : 'Sin reporte'}</p>
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

            {/* Paginación (Footer del contenedor) */}
            <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-slate-200/80 w-full mt-auto">
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
        </div>

            {/* ===================== MODALES (SHADCN DIALOGS) ===================== */}

            {/* 1. Modal de Materiales Totales */}
            <Dialog open={showMaterials} onOpenChange={setShowMaterials}>
                <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto bg-white p-6 rounded-xl shadow-lg border border-slate-200">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <i className="fas fa-boxes text-emerald-600"></i>
                            Lista de Materiales
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead className="font-semibold text-slate-700">Material</TableHead>
                                    <TableHead className="text-right font-semibold text-slate-700">Necesarios</TableHead>
                                    <TableHead className="text-right font-semibold text-slate-700">Utilizados</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {materiales.map((material, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium text-slate-800">{material.Nombre}</TableCell>
                                        <TableCell className="text-right text-slate-600">{material.Necesarios == 0 ? '-' : `${material.Necesarios} ${material.UnidadMedida}`}</TableCell>
                                        <TableCell className="text-right text-slate-600">{material.Utilizados == 0 ? '-' : `${material.Utilizados} ${material.UnidadMedida}`}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
                        <Button variant="outline" onClick={() => setShowMaterials(false)}>
                            Cerrar
                        </Button>
                        <Button onClick={exportarAExcelMateriales} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                            <i className="fas fa-file-excel"></i> Descargar todos
                        </Button>
                        <Button onClick={exportarAExcelMaterialesNecesarios} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                            <i className="fas fa-file-excel"></i> Descargar necesarios
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 2. Modal de Información de Mantenimiento (M) */}
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
                                                <div key={index} className="border border-slate-200 rounded-lg p-2 bg-slate-50 flex flex-col items-center justify-between text-center">
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

            {/* 3. Modal de Información de Otras Atenciones (OA) */}
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
                                                <div key={index} className="border border-slate-200 rounded-lg p-2 bg-slate-50 flex flex-col items-center justify-between text-center">
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

            {/* 4. Modal de Detalles Extra del Nodo */}
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

            {/* 5. Modal de Imágenes de los Nodos (Búsqueda General) */}
            <Dialog open={!!selectedImagesUnidadNodos} onOpenChange={(open) => !open && setSelectedImagesUnidadNodos(null)}>
                <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col overflow-hidden bg-white p-0 rounded-xl shadow-lg border border-slate-200">
                    <DialogHeader className="px-6 py-4 border-b border-slate-100 flex-shrink-0">
                        <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <i className="fas fa-network-wired text-green-700"></i>
                            Imágenes de los Nodos
                        </DialogTitle>
                    </DialogHeader>
                    {selectedImagesUnidadNodos && (() => {
                        const allNodosImages = selectedImagesUnidadNodos.nodosImages || [];
                        const totalNodosImages = allNodosImages.length;
                        const nodosImagesPage = allNodosImages.slice(
                            imgNodosPage * imgNodosPerPage,
                            imgNodosPage * imgNodosPerPage + imgNodosPerPage
                        );

                        return (
                            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                                {totalNodosImages > 0 ? (
                                    <>
                                        <div className="flex-1 overflow-y-auto px-6 py-4">
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {nodosImagesPage.map((image, index) => {
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
                                                    <div key={index} className="border border-slate-200 rounded-lg p-3 bg-slate-50 flex flex-col justify-between shadow-xs [content-visibility:auto] contain-intrinsic-size-[200px]">
                                                        <div className="mb-2">
                                                            <div className="font-semibold text-slate-800 text-xs truncate" title={image.Ubicacion}>{image.Ubicacion}</div>
                                                            <div className="text-[10px] text-slate-500 truncate" title={image.NombreUnidad}>{image.NombreUnidad || 'Sin Unidad'}</div>
                                                            <span className={`text-[10px] font-semibold ${isSolventado ? 'text-green-600' : 'text-slate-400'}`}>
                                                                {isSolventado ? 'Solventado' : 'General'}
                                                            </span>
                                                        </div>
                                                        <img
                                                            src={`${API_URL}${image.ImagenURL}`}
                                                            alt={`Imagen ${index + 1}`}
                                                            className="w-full h-32 object-cover rounded-md cursor-pointer hover:opacity-95 transition mb-2"
                                                            loading="lazy"
                                                            decoding="async"
                                                            onClick={() => handleImageClick(image.ImagenURL)}
                                                        />
                                                        <div className="text-[10px] text-slate-400 text-right">{formattedDate}</div>
                                                    </div>
                                                );
                                            })}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-slate-50 flex-shrink-0">
                                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                                <span>Imágenes por página:</span>
                                                <select
                                                    className="border border-slate-200 rounded p-1 bg-white text-sm focus:outline-none"
                                                    value={imgNodosPerPage}
                                                    onChange={(e) => {
                                                        setImgNodosPerPage(parseInt(e.target.value, 10));
                                                        setImgNodosPage(0);
                                                    }}
                                                >
                                                    <option value={6}>6</option>
                                                    <option value={12}>12</option>
                                                    <option value={24}>24</option>
                                                </select>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm">
                                                <span className="text-slate-500 font-medium">
                                                    {imgNodosPage * imgNodosPerPage + 1}–{Math.min((imgNodosPage + 1) * imgNodosPerPage, totalNodosImages)} de {totalNodosImages}
                                                </span>
                                                <div className="flex gap-1">
                                                    <Button variant="outline" size="icon" onClick={() => setImgNodosPage(p => Math.max(0, p - 1))} disabled={imgNodosPage === 0} className="h-8 w-8">
                                                        <i className="fas fa-chevron-left text-xs"></i>
                                                    </Button>
                                                    <Button variant="outline" size="icon" onClick={() => setImgNodosPage(p => Math.min(Math.ceil(totalNodosImages / imgNodosPerPage) - 1, p + 1))} disabled={(imgNodosPage + 1) * imgNodosPerPage >= totalNodosImages} className="h-8 w-8">
                                                        <i className="fas fa-chevron-right text-xs"></i>
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex-1 px-6 py-6">
                                        <p className="text-slate-400 text-center italic">No hay imágenes de los nodos disponibles.</p>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                    <DialogFooter className="px-6 py-4 border-t border-slate-100 flex-shrink-0">
                        <Button onClick={() => setSelectedImagesUnidadNodos(null)} variant="outline">
                            Cerrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 6. Modal de Imágenes de MDF/IDF */}
            <Dialog open={!!selectedImagesUnidad} onOpenChange={(open) => !open && setSelectedImagesUnidad(null)}>
                <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col overflow-hidden bg-white p-0 rounded-xl shadow-lg border border-slate-200">
                    <DialogHeader className="px-6 py-4 border-b border-slate-100 flex flex-row items-center justify-between flex-shrink-0">
                        <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <i className="fas fa-images text-green-700"></i>
                            Imágenes de MDF e IDF
                        </DialogTitle>
                        {user?.role === 'administrador' && (
                            <Button
                                className="bg-green-700 hover:bg-green-800 text-white font-medium gap-2 h-9 px-3 text-xs mr-6"
                                onClick={() => {
                                    setMdfIdfFormData(prev => ({ ...prev, unidadForm: filtros.unidad, isNew: 'Nuevo' }));
                                    setShowMdfIdfForm(true);
                                }}
                            >
                                <i className="fas fa-plus"></i> Añadir Imagen
                            </Button>
                        )}
                    </DialogHeader>
                    {selectedImagesUnidad && (() => {
                        const allMdfImages = selectedImagesUnidad.MDF_IDF_Images || [];
                        const totalMdfImages = allMdfImages.length;
                        const mdfImagesPage = allMdfImages.slice(
                            imgMdfPage * imgMdfPerPage,
                            imgMdfPage * imgMdfPerPage + imgMdfPerPage
                        );

                        return (
                            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                                {totalMdfImages > 0 ? (
                                    <>
                                        <div className="flex-1 overflow-y-auto px-6 py-4">
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {mdfImagesPage.map((image, index) => {
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
                                                    <div key={index} className="border border-slate-200 rounded-lg p-3 bg-slate-50 flex flex-col justify-between shadow-xs [content-visibility:auto] contain-intrinsic-size-[200px]">
                                                        <div className="mb-2">
                                                            <div className="font-semibold text-slate-800 text-xs truncate">Código: {image.CodigoMDFIDF}</div>
                                                            <span className="text-[10px] text-slate-400 font-medium block truncate">
                                                                Tipo: {image.Tipo} • {image.Nombre || 'Sin nombre'}
                                                            </span>
                                                            {image.NombreUnidad && (
                                                                <div className="text-[10px] font-semibold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded mt-1 truncate border border-sky-100" title={image.NombreUnidad}>
                                                                    <i className="fas fa-building mr-1"></i>
                                                                    {image.NombreUnidad}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <img
                                                            src={`${API_URL}${image.ImagenURL}?v=${imgVersion}`}
                                                            alt={image.Nombre || 'Imagen'}
                                                            className="w-full h-32 object-cover rounded-md cursor-pointer hover:opacity-95 transition mb-2"
                                                            loading="lazy"
                                                            decoding="async"
                                                            onClick={() => setSelectedImage({ ...image, isMdfIdf: true })}
                                                        />
                                                        <div className="text-[10px] text-slate-400 text-right">{formattedDate}</div>
                                                    </div>
                                                );
                                            })}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-slate-50 flex-shrink-0">
                                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                                <span>Imágenes por página:</span>
                                                <select
                                                    className="border border-slate-200 rounded p-1 bg-white text-sm focus:outline-none"
                                                    value={imgMdfPerPage}
                                                    onChange={(e) => {
                                                        setImgMdfPerPage(parseInt(e.target.value, 10));
                                                        setImgMdfPage(0);
                                                    }}
                                                >
                                                    <option value={6}>6</option>
                                                    <option value={12}>12</option>
                                                    <option value={24}>24</option>
                                                </select>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm">
                                                <span className="text-slate-500 font-medium">
                                                    {imgMdfPage * imgMdfPerPage + 1}–{Math.min((imgMdfPage + 1) * imgMdfPerPage, totalMdfImages)} de {totalMdfImages}
                                                </span>
                                                <div className="flex gap-1">
                                                    <Button variant="outline" size="icon" onClick={() => setImgMdfPage(p => Math.max(0, p - 1))} disabled={imgMdfPage === 0} className="h-8 w-8">
                                                        <i className="fas fa-chevron-left text-xs"></i>
                                                    </Button>
                                                    <Button variant="outline" size="icon" onClick={() => setImgMdfPage(p => Math.min(Math.ceil(totalMdfImages / imgMdfPerPage) - 1, p + 1))} disabled={(imgMdfPage + 1) * imgMdfPerPage >= totalMdfImages} className="h-8 w-8">
                                                        <i className="fas fa-chevron-right text-xs"></i>
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex-1 px-6 py-6">
                                        <p className="text-slate-400 text-center italic">No hay imágenes MDF/IDF disponibles.</p>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                    <DialogFooter className="px-6 py-4 border-t border-slate-100 flex-shrink-0">
                        <Button onClick={() => setSelectedImagesUnidad(null)} variant="outline">
                            Cerrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 7. Modal de Imagen en Tamaño Completo */}
            <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
                <DialogContent className="sm:max-w-3xl bg-white p-6 rounded-xl shadow-lg border border-slate-200">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-slate-800">
                            Vista de Imagen
                        </DialogTitle>
                    </DialogHeader>
                    {selectedImage && (() => {
                        const imgUrl = typeof selectedImage === 'string' 
                            ? selectedImage 
                            : `${API_URL}${selectedImage.ImagenURL}${selectedImage.isMdfIdf ? '?v=' + imgVersion : ''}`;
                        return (
                            <div className="flex flex-col items-center py-2 space-y-4">
                                <img
                                    src={imgUrl}
                                    alt="Imagen completa"
                                    className="max-h-[60vh] object-contain rounded-md border border-slate-100 shadow-md"
                                />
                                <a 
                                    href={imgUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-xs text-green-700 hover:underline break-all"
                                >
                                    Abrir en pestaña nueva
                                </a>
                                {typeof selectedImage === 'object' && selectedImage.isMdfIdf && user?.role === 'administrador' && (
                                    <div className="flex gap-2 pt-2">
                                        <Button
                                            className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
                                            onClick={() => handleEditMdfIdfClick(selectedImage)}
                                        >
                                            <i className="fas fa-edit"></i>
                                            <span>Editar</span>
                                        </Button>
                                        <Button
                                            className="bg-red-600 hover:bg-red-700 text-white gap-2"
                                            onClick={() => handleDeleteMdfIdf(selectedImage.Id)}
                                        >
                                            <i className="fas fa-trash"></i>
                                            <span>Eliminar</span>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                    <DialogFooter>
                        <Button onClick={() => setSelectedImage(null)} variant="outline">
                            Cerrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 8. Modal de Formulario MDF / IDF (Añadir / Editar) */}
            <Dialog open={showMdfIdfForm} onOpenChange={(open) => !open && handleCloseMdfIdfForm()}>
                <DialogContent className="sm:max-w-lg bg-white p-6 rounded-xl shadow-lg border border-slate-200">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-slate-800">
                            {isEditingMdfIdf ? 'Editar Imagen' : 'Añadir Imagen MDF / IDF'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmitMdfIdf} className="space-y-4 py-2">
                        {!isEditingMdfIdf && (
                            <div className="flex justify-center gap-6 py-2 border-b border-slate-100">
                                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                                    <input
                                        type="radio"
                                        name="isNew"
                                        value="Nuevo"
                                        checked={mdfIdfFormData.isNew === 'Nuevo'}
                                        onChange={(e) => setMdfIdfFormData({ ...mdfIdfFormData, isNew: e.target.value })}
                                        className="h-4 w-4 text-green-600 border-slate-300 focus:ring-green-500"
                                    />
                                    <span>Nuevo Registro MDF/IDF</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                                    <input
                                        type="radio"
                                        name="isNew"
                                        value="Existente"
                                        checked={mdfIdfFormData.isNew === 'Existente'}
                                        onChange={(e) => setMdfIdfFormData({ ...mdfIdfFormData, isNew: e.target.value })}
                                        className="h-4 w-4 text-green-600 border-slate-300 focus:ring-green-500"
                                    />
                                    <span>Registro Existente</span>
                                </label>
                            </div>
                        )}

                        {!isEditingMdfIdf && (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold uppercase text-slate-500">Unidad</label>
                                <select
                                    value={mdfIdfFormData.unidadForm}
                                    onChange={(e) => handleFormUnidadChange(e.target.value)}
                                    className="border border-slate-200 rounded-lg p-2 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                                    required
                                >
                                    <option value="">Seleccione una unidad</option>
                                    {unidades.map(u => (
                                        <option key={u.ref} value={u.ref}>{u.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {!isEditingMdfIdf && mdfIdfFormData.isNew === 'Nuevo' && (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold uppercase text-slate-500">Tipo</label>
                                <select
                                    value={mdfIdfFormData.tipo}
                                    onChange={(e) => setMdfIdfFormData({ ...mdfIdfFormData, tipo: e.target.value })}
                                    className="border border-slate-200 rounded-lg p-2 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                                    required
                                >
                                    <option value="MDF">MDF</option>
                                    <option value="IDF">IDF</option>
                                </select>
                            </div>
                        )}

                        {!isEditingMdfIdf && mdfIdfFormData.isNew === 'Existente' && (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold uppercase text-slate-500">Código Existente</label>
                                <select
                                    value={mdfIdfFormData.codigoMDFIDF}
                                    onChange={(e) => setMdfIdfFormData({ ...mdfIdfFormData, codigoMDFIDF: e.target.value })}
                                    className="border border-slate-200 rounded-lg p-2 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                                    required
                                >
                                    <option value="">Seleccione un código</option>
                                    {fetchedUnitCodes.map(code => (
                                        <option key={code} value={code}>{code}</option>
                                    ))}
                                </select>

                                {mdfIdfFormData.codigoMDFIDF && (
                                    <div className="mt-2 bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                                        <span className="text-xs font-medium text-slate-400 block mb-2">Imágenes bajo este código:</span>
                                        <div className="flex flex-wrap gap-2 justify-center">
                                            {fetchedUnitImages
                                                .filter(img => img.CodigoMDFIDF === mdfIdfFormData.codigoMDFIDF)
                                                .map(img => (
                                                    <div key={img.Id} className="flex flex-col items-center">
                                                        <img
                                                            src={`${API_URL}${img.ImagenURL}?v=${imgVersion}`}
                                                            alt={img.Nombre || 'Imagen'}
                                                            className="w-16 h-16 object-cover rounded border border-slate-200 shadow-xs"
                                                        />
                                                        {img.Nombre && (
                                                            <span className="text-[9px] text-slate-500 truncate max-w-[64px]">{img.Nombre}</span>
                                                        )}
                                                    </div>
                                                ))
                                            }
                                            {fetchedUnitImages.filter(img => img.CodigoMDFIDF === mdfIdfFormData.codigoMDFIDF).length === 0 && (
                                                <span className="text-xs text-slate-400 italic">Sin imágenes aún.</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {isEditingMdfIdf && (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold uppercase text-slate-500">Código MDF/IDF</label>
                                <select
                                    value={mdfIdfFormData.codigoMDFIDF}
                                    onChange={(e) => setMdfIdfFormData({ ...mdfIdfFormData, codigoMDFIDF: e.target.value })}
                                    className="border border-slate-200 rounded-lg p-2 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                                >
                                    <option value="">Sin código asignado</option>
                                    {fetchedUnitCodes.map(code => (
                                        <option key={code} value={code}>{code}</option>
                                    ))}
                                </select>
                                <span className="text-xs text-slate-400 font-medium mt-1 block">
                                    Unidad: {unidades.find(u => String(u.ref) === String(mdfIdfFormData.unidadForm))?.nombre || mdfIdfFormData.unidadForm}
                                </span>
                            </div>
                        )}

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold uppercase text-slate-500 font-medium">Nombre (opcional)</label>
                            <input
                                type="text"
                                value={mdfIdfFormData.nombre}
                                onChange={(e) => setMdfIdfFormData({ ...mdfIdfFormData, nombre: e.target.value })}
                                className="border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                                placeholder="Nombre descriptivo de la imagen"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold uppercase text-slate-500 font-medium">
                                Imagen {isEditingMdfIdf ? '(opcional para reemplazar)' : '*'}
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setMdfIdfFormData({ ...mdfIdfFormData, file: e.target.files[0] })}
                                className="border border-slate-200 rounded-lg p-2 text-sm bg-slate-50 focus:bg-white focus:outline-none file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer"
                                required={!isEditingMdfIdf}
                            />
                        </div>

                        <DialogFooter className="pt-4 flex gap-2">
                            <Button type="button" variant="outline" onClick={handleCloseMdfIdfForm}>
                                Cancelar
                            </Button>
                            <Button type="submit" className="bg-green-700 hover:bg-green-800 text-white font-semibold">
                                Guardar
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default NodosSustitucion;