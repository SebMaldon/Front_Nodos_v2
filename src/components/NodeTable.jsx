import { useState, useEffect, useContext, useMemo } from 'react';
// MUI imports removed
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const API_URL = 'http://localhost:5090';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import NodeForm from './NodeFrom';
import NodeDetailsModal from './NodeDetailsModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import ImageModal from './ImageModal';
import EditNodeModal from './EditNodeModal';
import NodeMaterialsModal from './NodeMaterialsModal';
import NodeAttentionModal from './NodeAttentionModal';
import ObservationModal from './ObservationModal';



const NodeTable = ({ refreshKey }) => { // Recibe la key para forzar el re-fetch
    const { user } = useContext(AuthContext); // Obtenemos el usuario activo
    const { success, error: toastError, warn, confirm } = useNotifications();
    const [pageNode, setPageNode] = useState(0);
    const [rowsPerPageNode, setRowsPerPageNode] = useState(10);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedRowId, setSelectedRowId] = useState(null); // Estado para la fila seleccionada
    const [hoveredRow, setHoveredRow] = useState(null);
    const [showMaterialesModal, setShowMaterialesModal] = useState(false); // Estado para mostrar el modal de materiales
    const [materiales, setMateriales] = useState([]); // Estado para almacenar los materiales
    const [selectedNodo, setSelectedNodo] = useState(null); // Estado para almacenar el nodo seleccionado (detalles)
    const [nodoToDelete, setNodoToDelete] = useState(null); // Estado para almacenar el nodo a eliminar
    const [nodoToEdit, setNodoToEdit] = useState(null); // Estado para almacenar el nodo a editar
    const [editFormData, setEditFormData] = useState({}); // Estado para almacenar los datos del formulario de edición
    const [selectedImage, setSelectedImage] = useState(null); // Estado para almacenar la imagen seleccionada
    const [unidades, setUnidades] = useState([]); // Estado para almacenar las unidades
    const [selectedAtencionNodo, setSelectedAtencionNodo] = useState(null); // Estado para almacenar el nodo a quitar la atención
    const [selectedOtherAtencionNodo, setSelectedOtherAtencionNodo] = useState(null); // Estado para almacenar el nodo a quitar otras atenciones
    const [selectedSinAtencionNodo, setSelectedSinAtencionNodo] = useState(null); // Estado para almacenar el nodo a quitar la atención
    const [selectedSinOtherAtencionNodo, setSelectedSinOtherAtencionNodo] = useState(null); // Estado para almacenar el nodo a quitar otras atenciones
    const [filteredNodos, setFilteredNodos] = useState([]); // Estado para almacenar la nueva consulta
    const [totalRegistros, setTotalRegistros] = useState(0); // Estado para el total de registros
    const [totalFaltantes, setTotalFaltantes] = useState(0); // Estado para el total de nodos faltantes
    const [totalAtendidos, setTotalAtendidos] = useState(0); // Estado para el total de nodos atendidos
    const [totalOtraAtencion, setTotalOtraAtencion] = useState(0);
    const [totalOtroAtendido, setTotalOtroAtendido] = useState(0);
    const [totalAtencion, setTotalAtencion] = useState(0);
    const [totalSinImagenes, setTotalSinImagenes] = useState(0);

    const [activeCardFilters, setActiveCardFilters] = useState([]);
    const [isStrictFilterMode, setIsStrictFilterMode] = useState(true);

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
    const [newImageFiles, setNewImageFiles] = useState([]); // Estado para las nuevas imágenes
    const [newImageFilesAtencion, setNewImageFilesAtencion] = useState([]); // Estado para las nuevas imágenes de atención
    const [showObservacionesModal, setShowObservacionesModal] = useState(false); // Estado para mostrar la modal de observaciones en la modal de edición
    const [showObservacionesModalTable, setShowObservacionesModalTable] = useState(false); // Estado para mostrar la modal de observaciones en la tabla
    const [showObservacionesModalParcialTable, setShowObservacionesModalParcialTable] = useState(false); // Estado para mostrar la modal de observaciones en la tabla
    const [observacionesUsuario, setObservacionesUsuario] = useState(''); // Estado para almacenar las observaciones
    const [campoCambiado, setCampoCambiado] = useState(''); // Para saber si el cambio fue en Atencion o OtraAtencion
    const [tipoAtencion, setTipoAtencion] = useState(''); // Estado para almacenar el tipo de atención (Atencion u OtraAtencion)
    const [materialesEditados, setMaterialesEditados] = useState([]); // Para rastrear cambios
    const [editMateriales, setEditMateriales] = useState([]); // Estado para edición temporal
    const [pagination, setPagination] = useState({
        page: 0,
        rowsPerPage: 5,
        searchTerm: ''
    });
    const [searchUnidadTable, setSearchUnidadTable] = useState("");
    const unidadesFiltradasTable = unidades.filter(u => u.nombre.toLowerCase().includes(searchUnidadTable.toLowerCase()));


    // Filtrar y paginar materiales
    const filteredMaterials = editMateriales.filter(material =>
        material.Nombre.toLowerCase().includes(pagination.searchTerm.toLowerCase()) ||
        material.Categoria.toLowerCase().includes(pagination.searchTerm.toLowerCase())
    );

    const paginatedMaterials = filteredMaterials.slice(
        pagination.page * pagination.rowsPerPage,
        (pagination.page + 1) * pagination.rowsPerPage
    );

    // Filtros vacios check
    const filtrosEstanVacios = () => Object.values(filtros).every((filtro) => filtro === '');

    // Obtener los nodos al cargar el componente o cuando cambien los filtros
    useEffect(() => {
        setPageNode(0); // Reiniciar pagina de los filtros al modificar un filtro
        fetchNewNodos();
    }, [filtros]);

    // Re-fetch cuando se agrega un nodo nuevo desde el formulario (refreshKey viene de App.jsx)
    useEffect(() => {
        if (refreshKey > 0) {
            fetchNewNodos();
        }
    }, [refreshKey]);

    // Función para manejar cambios en los filtros
    const handleFiltroChange = (e) => {
        const { name, value } = e.target; // Extrae el nombre y el valor del campo
        setFiltros({ ...filtros, [name]: value }); // Actualiza el estado de los filtros
    };

    // Función para hacer la nueva consulta GET y actualizar el estado
    const fetchNewNodos = async () => {
        setIsLoading(true);
        try {
            const params = { ...filtros }; // Copiar los filtros actuales

            // Eliminar el campo "tipoAtencion" antiguo si existe
            delete params.tipoAtencion;

            // Añadir los filtros de las tarjetas
            // NO LOS ENVIAMOS AL BACKEND, LO MANEJAMOS EN EL FRONT PARA PERMITIR "O" (CUALQUIERA)

            // Hacer la solicitud a la API con límite alto para manejar la paginación y filtros de tarjeta en el frontend
            const response = await axios.get(`${API_URL}/api/nodos`, {
                params: { ...params, page: 1, limit: 5000 },
            });

            setFilteredNodos(response.data.nodos || []); 
            setTotalRegistros(response.data.total || 0); 
            setTotalFaltantes(response.data.faltantes || 0); 
            setTotalAtendidos(response.data.totalAtendido || 0);
            setTotalOtraAtencion(response.data.totalOtraAtencion || 0);
            setTotalOtroAtendido(response.data.totalOtroAtendido || 0);
            setTotalAtencion(response.data.totalAtencion || 0);
            
            const nodosRec = response.data.nodos || [];
            const manualSinImg = nodosRec.filter(n => !n.TieneImagenes).length;
            setTotalSinImagenes(response.data.totalSinImagenes !== undefined ? response.data.totalSinImagenes : manualSinImg);
        } catch (error) {
            console.error('Error al obtener los nuevos nodos:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleCardFilter = (filterName) => {
        setActiveCardFilters(prev => 
            prev.includes(filterName) 
                ? prev.filter(f => f !== filterName) 
                : [...prev, filterName]
        );
        setPageNode(0); // Reiniciar paginación al cambiar filtros de tarjeta
    };

    const clearCardFilters = () => {
        setActiveCardFilters([]);
    };
    const fetchUOtrosNodos = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/nodos/unidades`); // Hacer una petición GET a la API

            setUnidades(response.data); // Almacenar las unidades en el estado
        } catch (error) {
            console.error('Error al obtener las unidades:', error);
        }
    };

    // Obtener las unidades y los materiales al cargar el componente
    useEffect(() => {
        const fetchUnidades = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/nodos/unidades`);
                const lista = response.data;
                setUnidades(lista);
                // La pre-selección por zona se maneja en el backend vía JWT.
                // No pre-seleccionamos ninguna unidad aquí.
            } catch (error) {
                console.error('Error al obtener las unidades:', error);
            }
        };
        fetchUnidades();
    }, []);

    // Obtener los materiales al cargar el componente
    const fetchMateriales = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/nodos/materiales`); // Hacer una petición GET a la API

            setMateriales(response.data.materiales || response.data); // Almacenar los materiales en el estado
        } catch (error) {
            console.log('Error al obtener los materiales: ', error);
        }
    };

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

    // Función para abrir el modal de confirmación de eliminación
    const handleDeleteClick = (nodoData) => {
        setSelectedRowId(nodoData.Id);
        setNodoToDelete(nodoData); // Guarda el nodo a eliminar en el estado
    };

    // Función para abrir el modal de confirmación para quitar la atención
    const handleAtencionClick = async (nodoData) => {
        setSelectedRowId(nodoData.Id);
        if (nodoData.Atencion == true) { // Si el nodo requiere atención
            try {
                // Obtener las imágenes solventadas desde el backend
                const response = await axios.get(`${API_URL}/api/nodos/${nodoData.Id}`);
                const Datos = response.data;

                // Actualizar el nodo con las imágenes solventadas
                setSelectedAtencionNodo(Datos);
            } catch (error) {
                console.error('Error al obtener los datos del nodo:', error);
            }
        } else { // Si el nodo no requiere atención
            try {
                // Obtener las imágenes solventadas desde el backend
                const response = await axios.get(`${API_URL}/api/nodos/${nodoData.Id}`);
                const Datos = response.data;

                // Actualizar el nodo con las imágenes solventadas
                setSelectedSinAtencionNodo(Datos);
            } catch (error) {
                console.error('Error al obtener los datos del nodo:', error);
            }
        }
    };

    // Función para abrir el modal de confirmación para quitar otras atenciones
    const handleOtherAtencionClick = async (nodoData) => {
        setSelectedRowId(nodoData.Id);
        if (nodoData.OtraAtencion == true) { // Si el nodo requiere atención
            try {
                // Obtener las imágenes solventadas desde el backend
                const response = await axios.get(`${API_URL}/api/nodos/${nodoData.Id}`);
                const Datos = response.data;

                // Actualizar el nodo con las imágenes solventadas
                setSelectedOtherAtencionNodo(Datos);
            } catch (error) {
                console.error('Error al obtener los datos:', error);
            }
        } else { // Si el nodo no requiere atención
            try {
                // Obtener las imágenes solventadas desde el backend
                const response = await axios.get(`${API_URL}/api/nodos/${nodoData.Id}`);
                const Datos = response.data;

                // Actualizar el nodo con las imágenes solventadas
                setSelectedSinOtherAtencionNodo(Datos);
            } catch (error) {
                console.error('Error al obtener los datos:', error);
            }
        }
    };

    // Manejar cambios en la selección de archivos
    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);

        // Filtrar archivos duplicados por nombre y tamaño
        const uniqueFiles = files.reduce((acc, file) => {
            const isDuplicate = acc.some(
                f => f.name === file.name && f.size === file.size // Verifica si el archivo ya existe en el array
            );
            if (!isDuplicate) { // Si no es un duplicado, lo agrega al array
                acc.push(file);
            }
            return acc;
        }, []);

        setNewImageFiles(uniqueFiles); // Actualiza el estado con los archivos únicos
    };

    // Función para cerrar los modales
    const handleCloseModal = () => {
        setSelectedNodo(null); // Limpia el estado
        setNodoToDelete(null); // Limpia el estado
        setNodoToEdit(null); // Limpia el estado
        setSelectedImage(null); // Limpia la imagen seleccionada
        setSelectedAtencionNodo(null); // Limpia el estado
        setSelectedOtherAtencionNodo(null); // Limpia el estado
        setSelectedSinAtencionNodo(null); // Limpia el estado
        setSelectedSinOtherAtencionNodo(null); // Limpia el estado
        setObservacionesUsuario(''); //limpiar los datos
        setShowObservacionesModalTable(null); // Cierra la modal
        setShowObservacionesModalParcialTable(null); // Cierra la modal
        setShowObservacionesModal(null); // Cierra la modal
        setNewImageFiles([]); // Vaciar las imágenes
        setNewImageFilesAtencion([]); // Vaciar las imágenes de atención
        // Refrescar lista para que las banderas se actualicen
        fetchNewNodos();
    };

    // Función para manejar cambios en el formulario de edición
    const handleEditFormChange = (e) => {
        const { name, value, type, checked } = e.target; // Extrae el nombre, valor, tipo y estado del campo

        if (name === 'Unidad') {
            const unidadSeleccionada = unidades.find(u => u.nombre === value); // Almacena los datos de la unidad almacenada
            setEditFormData({
                ...editFormData, // Datos del formulario
                Unidad: value, // Registra el nombre de la unidad
                Referencia: unidadSeleccionada ? unidadSeleccionada.ref : '' // Registra la referencia de la unidad
            });
            return;
        }

        // Si el campo es Atencion o OtraAtencion, mostrar la modal de observaciones
        if (name === 'Atencion' || name === 'OtraAtencion') {
            setCampoCambiado(name); // Guardar el campo que se está cambiando
            setShowObservacionesModal(true); // Mostrar la modal de observaciones
        }

        setEditFormData({ // Actualiza el estado del formulario
            ...editFormData, // Mantiene los datos actuales
            [name]: type === 'checkbox' ? checked : value, // Actualiza el campo con el nuevo valor
        });
    };

    // Función que maneja la actualización de los datos cuando se guardan los cambios
    const handleSaveChangesAtenciones = async () => {
        try {
            const formDataToSend = new FormData(); // Crea un nuevo objeto FormData

            const longitud = parseFloat(editFormData.Longitud) || 0; // Convertir a valor decimal
            const nodosFaltantes = parseInt(editFormData.Nodos_faltantes) || 0; // Convertir a valor entero

            formDataToSend.append('esAtencionParcialMante', false);
            formDataToSend.append('esAtencionParcialOtro', false);
            formDataToSend.append('Ubicacion', editFormData.Ubicacion); // Agrega los datos del formulario al objeto FormData
            formDataToSend.append('Unidad', editFormData.Unidad); // Agrega los datos del formulario al objeto FormData
            formDataToSend.append('CategoriaCable', editFormData.CategoriaCable); // Agrega los datos del formulario al objeto FormData
            formDataToSend.append('AnioInstalacion', editFormData.AnioInstalacion); // Agrega los datos del formulario al objeto FormData
            formDataToSend.append('EstadoCable', editFormData.EstadoCable); // Agrega los datos del formulario al objeto FormData
            formDataToSend.append('Puerto', editFormData.Puerto); // Agrega los datos del formulario al objeto FormData
            formDataToSend.append('Area', editFormData.Area); // Agrega los datos del formulario al objeto FormData
            formDataToSend.append('Longitud', longitud); // Agrega los datos del formulario al objeto FormData
            formDataToSend.append('IpSwitch', editFormData.IpSwitch); // Agrega los datos del formulario al objeto FormData
            formDataToSend.append('Observaciones', editFormData.Observaciones); // Agrega los datos del formulario al objeto FormData
            formDataToSend.append('Atencion', editFormData.Atencion ? 1 : 0); // Agrega los datos del formulario al objeto FormData (como 1 o 0)
            formDataToSend.append('OtraAtencion', editFormData.OtraAtencion ? 1 : 0); // Agrega los datos del formulario al objeto FormData (como 1 o 0)
            formDataToSend.append('Referencia', editFormData.Referencia); // Agregar los datos del formulario al FormData
            formDataToSend.append('Nodos_faltantes', nodosFaltantes); // Agregar los datos del formulario al FormData

            // Agregar las observaciones del usuario (si existen)
            if (editFormData.ObservacionesUsuarioAtencion) {
                formDataToSend.append('ObservacionesUsuarioAtencion', editFormData.ObservacionesUsuarioAtencion);
            }
            if (editFormData.ObservacionesUsuarioOtraAtencion) {
                formDataToSend.append('ObservacionesUsuarioOtraAtencion', editFormData.ObservacionesUsuarioOtraAtencion);
            }

            // Enviar los datos al backend
            const response = await axios.put(
                `${API_URL}/api/nodos/${nodoToEdit.Id}`, // URL de la API para actualizar el nodo
                formDataToSend, // Datos a enviar
                {
                    headers: { // Cabeceras de la petición
                        'Content-Type': 'multipart/form-data', // Tipo de contenido (multipart/form-data)
                    },
                }
            );

            success('Cambios guardados correctamente');
            handleCloseModal(); // Cerrar el modal
            fetchNewNodos(); // Actualizar la lista filtrada y refrescar las banderas
            setNewImageFiles([]); // Limpiar el estado de las nuevas imágenes
        } catch (error) {
            console.error('Error al guardar los cambios:', error);
            toastError('Error al guardar los cambios');
        }
    };

    // Función que maneja la actualización de los datos cuando se guardan los cambios
    const handleSaveChanges = async () => {
        try {
            const formDataToSend = new FormData(); // Crea un nuevo objeto FormData

            const longitud = parseFloat(editFormData.Longitud) || 0; // Convertir a valor decimal
            const nodosFaltantes = parseInt(editFormData.Nodos_faltantes) || 0; // Convertir a valor entero

            formDataToSend.append('esAtencionParcialMante', false);
            formDataToSend.append('esAtencionParcialOtro', false);
            formDataToSend.append('Ubicacion', editFormData.Ubicacion); // Agrega los datos del formulario al objeto FormData
            formDataToSend.append('Unidad', editFormData.Unidad); // Agrega los datos del formulario al objeto FormData
            formDataToSend.append('CategoriaCable', editFormData.CategoriaCable); // Agrega los datos del formulario al objeto FormData
            formDataToSend.append('AnioInstalacion', editFormData.AnioInstalacion); // Agrega los datos del formulario al objeto FormData
            formDataToSend.append('EstadoCable', editFormData.EstadoCable); // Agrega los datos del formulario al objeto FormData
            formDataToSend.append('Puerto', editFormData.Puerto); // Agrega los datos del formulario al objeto FormData
            formDataToSend.append('Area', editFormData.Area); // Agrega los datos del formulario al objeto FormData
            formDataToSend.append('Longitud', longitud); // Agrega los datos del formulario al objeto FormData
            formDataToSend.append('IpSwitch', editFormData.IpSwitch); // Agrega los datos del formulario al objeto FormData
            formDataToSend.append('Observaciones', editFormData.Observaciones); // Agrega los datos del formulario al objeto FormData
            formDataToSend.append('Atencion', editFormData.Atencion ? 1 : 0); // Agrega los datos del formulario al objeto FormData (como 1 o 0)
            formDataToSend.append('OtraAtencion', editFormData.OtraAtencion ? 1 : 0); // Agrega los datos del formulario al objeto FormData (como 1 o 0)
            formDataToSend.append('Referencia', editFormData.Referencia); // Agregar los datos del formulario al FormData
            formDataToSend.append('Nodos_faltantes', nodosFaltantes); // Agregar los datos del formulario al FormData

            // Agregar las observaciones del usuario (si existen)
            if (editFormData.ObservacionesUsuarioAtencion) {
                formDataToSend.append('ObservacionesUsuarioAtencion', editFormData.ObservacionesUsuarioAtencion);
            }
            if (editFormData.ObservacionesUsuarioOtraAtencion) {
                formDataToSend.append('ObservacionesUsuarioOtraAtencion', editFormData.ObservacionesUsuarioOtraAtencion);
            }

            // Agregar las nuevas imágenes (solo si se seleccionan)
            if (newImageFiles.length > 0) {
                newImageFiles.forEach((file) => { // Iterar sobre las nuevas imágenes
                    formDataToSend.append('newImages', file); // Agregar las nuevas imágenes al objeto FormData
                });
            }

            // Enviar los datos al backend
            const response = await axios.put(
                `${API_URL}/api/nodos/${nodoToEdit.Id}`, // URL de la API para actualizar el nodo
                formDataToSend, // Datos a enviar
                {
                    headers: { // Cabeceras de la petición
                        'Content-Type': 'multipart/form-data', // Tipo de contenido (multipart/form-data)
                    },
                }
            );

            success('Cambios guardados correctamente');
            handleCloseModal(); // Cerrar el modal
            fetchNewNodos(); // Actualizar la lista filtrada y refrescar las banderas
            setNewImageFiles([]); // Limpiar el estado de las nuevas imágenes
        } catch (error) {
            console.error('Error al guardar los cambios:', error);
            toastError('Error al guardar los cambios');
        }
    };

    // Función para quitar la atención de un nodo
    const handleDeleteAtencion = async () => {
        setTipoAtencion('Atencion'); // Establecer el tipo de atención
        setShowObservacionesModalTable(true); // Mostrar la modal de observaciones
    };

    // Función para quitar otra atención de un nodo
    const handleDeleteOtherAtencion = async () => {
        setTipoAtencion('OtraAtencion'); // Establecer el tipo de atención
        setShowObservacionesModalTable(true); // Mostrar la modal de observaciones
    };

    // Función para quitar la atención de un nodo
    const handleParcialAtencion = async () => {
        setTipoAtencion('Atencion'); // Establecer el tipo de atención
        setShowObservacionesModalParcialTable(true); // Mostrar la modal de observaciones
    };

    // Función para quitar otra atención de un nodo
    const handleParcialOtherAtencion = async () => {
        setTipoAtencion('OtraAtencion'); // Establecer el tipo de atención
        setShowObservacionesModalParcialTable(true); // Mostrar la modal de observaciones
    };

    // Función para eliminar el nodo
    const handleConfirmDelete = async () => {
        try {
            await axios.delete(`${API_URL}/api/nodos/${nodoToDelete.Id}`); // URL de la API para eliminar el nodo
            fetchNewNodos(); // Actualizar la lista de nodos
            success('Nodo eliminado exitosamente');
            handleCloseModal(); // Cerrar el modal
            fetchNewNodos(); // Actualizar los registros de la tabla
        } catch (error) {
            console.error('Error al eliminar el nodo:', error);
        }
    };

    // Función para mostrar la imagen en grande
    const handleImageClick = (imageUrl) => {
        setSelectedImage(`${API_URL}` + imageUrl); // Guarda la imagen seleccionada en el estado
    };

    // Función para abrir el modal de edición
    const handleEditClick = async (nodoData) => {
        setSelectedRowId(nodoData.Id);
        try {
            const response = await axios.get(`${API_URL}/api/nodos/${nodoData.Id}`); // Obtener los detalles completos del nodo
            setNodoToEdit(nodoData); // Guardar el nodo a editar en el estado
            setEditFormData({
                ...nodoData, // Llenar el formulario con los datos actuales del nodo
                images: response.data.images || [], // Agregar las imágenes al formulario (si hay)
                imagesSolventadas: response.data.imagesSolventadas || [], // Agregar las imágenes al formulario (si hay)
            });
        } catch (error) {
            console.error('Error al obtener los detalles del nodo:', error);
            toastError('Error al obtener los detalles del nodo');
        }
    };


    // Función para eliminar una imagen de la base de datos
    const handleDeleteImage = async (imageId) => {
        if (!await confirm('¿Estás seguro de que deseas eliminar esta imagen?')) return;

        try {
            await axios.delete(`${API_URL}/api/nodos/images/${imageId}`);

            // Versión segura que verifica la existencia de selectedNodo e images
            setSelectedNodo(prevState => {
                if (!prevState) {
                    console.error('selectedNodo es null');
                    return null;
                }

                return {
                    ...prevState,
                    images: Array.isArray(prevState.images)
                        ? prevState.images.filter(img => img.Id !== imageId)
                        : []
                };
            });

            // Mostrar feedback al usuario
            success('Imagen eliminada con éxito');

            // No cerrar el modal automáticamente para permitir más acciones
            handleCloseModal();

            // Recargar datos
            fetchNewNodos();

        } catch (error) {
            console.error('Error al eliminar la imagen:', error);
            toastError('Hubo un error al eliminar la imagen');
        }
    };

    const datosAMostrar = useMemo(() => {
        let result = Array.isArray(filteredNodos) ? filteredNodos : [];

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
            const term = searchTerm.toLowerCase().trim();
            result = result.filter(n => 
                (n.Ubicacion && n.Ubicacion.toLowerCase().includes(term)) ||
                (n.Unidad && n.Unidad.toLowerCase().includes(term)) ||
                (n.Puerto && String(n.Puerto).toLowerCase().includes(term)) ||
                (n.IpSwitch && n.IpSwitch.toLowerCase().includes(term)) ||
                (n.Observaciones && n.Observaciones.toLowerCase().includes(term)) ||
                (n.Area && n.Area.toLowerCase().includes(term))
            );
        }

        return result;
    }, [filteredNodos, activeCardFilters, isStrictFilterMode, searchTerm]);

    // Eliminado filtrosEstanVacios duplicado

    // Función para verificar si un campo (array) está vacío
    const EstaVacio = (dato) => {
        // console.log(dato,' - ',dato.length);
        if (dato.length == 0) {
            return true;
        } else {
            return false;
        }
    };

    const handleOpenMaterialesModal = async () => {
        try {
            // Obtener todos los materiales disponibles
            const materialesResponse = await axios.get(`${API_URL}/api/nodos/materiales`);
            const todosMateriales = materialesResponse.data.materiales || materialesResponse.data;
            // Obtener materiales específicos del nodo (si existen)
            const nodoMaterialesResponse = await axios.get(`${API_URL}/api/nodos/${nodoToEdit.Id}`);
            const materialesDelNodo = nodoMaterialesResponse.data.materiales || [];
            // Combinar ambos conjuntos de datos
            const materialesCombinados = todosMateriales.map(material => {
                const materialEnNodo = materialesDelNodo.find(m => m.MaterialId === material.Id);
                return {
                    ...material,
                    Necesarios: materialEnNodo ? parseFloat(materialEnNodo.Necesarios) || 0 : 0,
                    Utilizados: materialEnNodo ? parseFloat(materialEnNodo.Utilizados) || 0 : 0,
                    editado: false,
                    MaterialId: material.Id
                };
            });
            setEditMateriales(materialesCombinados); // Guardar los materiales en el estado
            setMaterialesEditados([]); // Limpiar la lista de editados
            setShowMaterialesModal(true); // Mostrar el modal de materiales
        } catch (error) {
            console.error('Error al obtener materiales:', error);
            toastError('Error al cargar materiales');
        }
    };

    // Función para manejar cambios en los inputs de materiales
    const handleMaterialChange = (materialId, field, value, unidadMedida) => {
        // Validación basada en la unidad de medida
        let valorNumerico;

        if (unidadMedida === 'piezas') {
            // Para piezas: solo enteros positivos
            valorNumerico = Math.max(0, parseInt(value) || 0);
        } else {
            // Para otras unidades: permitir decimales
            valorNumerico = Math.max(0, parseFloat(value) || 0);
        }

        setEditMateriales(prev => prev.map(mat => { // Actualiza el estado de los materiales
            if (mat.Id === materialId) { // Si el material coincide con el ID
                const valorCambiado = mat[field] !== valorNumerico;

                return {
                    ...mat,
                    [field]: valorNumerico,
                    editado: valorCambiado ? true : mat.editado
                };
            }
            return mat;
        }));

        // Actualizar lista de materiales editados
        setMaterialesEditados(prev => {
            if (!prev.includes(materialId)) { // Si el material no está en la lista de editados
                return [...prev, materialId];
            }
            return prev;
        });
    };

    // Función para guardar cambios
    const handleSaveMateriales = async () => {
        try {
            // Filtrar solo materiales que fueron editados
            const materialesAEnviar = editMateriales
                .filter(mat => materialesEditados.includes(mat.Id)) // Filtrar los materiales editados
                .map(({ MaterialId, Necesarios, Utilizados }) => ({ // Mapear los datos necesarios
                    MaterialId,
                    Necesarios,
                    Utilizados
                }));

            if (materialesAEnviar.length === 0) { // Si no hay cambios, mostrar alerta
                warn('No hay cambios para guardar');
                return;
            }

            // Enviar los cambios al backend
            const response = await axios.put(
                `${API_URL}/api/nodos/materiales/${nodoToEdit.Id}`,
                { materiales: materialesAEnviar }
            );
            if (response.data.success) {
                success('Materiales actualizados correctamente');
                setShowMaterialesModal(false); // Cerrar la modal de materiales
                setMaterialesEditados([]); // Limpiar la lista de editados
            }
        } catch (error) {
            console.error('Error al guardar materiales:', error);
            toastError('Error al guardar materiales');
        }
    };

    // Función para validar la entrada de materiales
    const validarEntradaMaterial = (value, unidadMedida) => {
        if (unidadMedida === 'piezas') {
            // Solo permitir números enteros positivos
            const intValue = parseInt(value);
            return isNaN(intValue) ? 0 : Math.max(0, intValue);
        }
        // Para otras unidades (metros), permitir decimales
        const floatValue = parseFloat(value);
        return isNaN(floatValue) ? 0 : Math.max(0, floatValue);
    };

    return (
        <div className="flex flex-col space-y-3 md:h-[calc(100vh-120px)] lg:h-[calc(100vh-140px)]">
            {/* Header del catálogo */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-800">Gestión de Nodos</h1>
                    <p className="text-xs text-slate-500 mt-0.5">Administración y registro de nodos y enlaces institucionales</p>
                </div>
                
                {/* Botones de acción alineados en el header */}
                <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end">
                    {/* Botón de Refrescar siempre visible */}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    onClick={fetchNewNodos} 
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

                    {user?.role === 'administrador' && (
                        <Button 
                            onClick={() => setShowRegisterModal(true)}
                            className="h-10 bg-[#005E3A] hover:bg-[#004d30] text-white font-medium rounded-lg px-4 flex items-center gap-2 shadow-xs transition-colors"
                        >
                            <i className="fas fa-plus"></i> Registrar Nodo
                        </Button>
                    )}
                </div>
            </div>

            {/* Tarjetas de estadísticas */}
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
                            : 'bg-white border-slate-200/80 hover:shadow-sm'
                    }`}
                >
                    <div>
                        <span className="block text-[9px] uppercase font-bold tracking-wider text-slate-400">Total Nodos</span>
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
                            : 'bg-white border-slate-200/80 hover:shadow-sm'
                    }`}
                >
                    <div>
                        <span className="block text-[9px] uppercase font-bold tracking-wider text-slate-400">Req. Mantenimiento</span>
                        <span className="text-xl font-extrabold text-red-600 mt-0.5 block">{totalAtencion}</span>
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
                            : 'bg-white border-slate-200/80 hover:shadow-sm'
                    }`}
                >
                    <div>
                        <span className="block text-[9px] uppercase font-bold tracking-wider text-slate-400">Req. Otra Atención</span>
                        <span className="text-xl font-extrabold text-amber-600 mt-0.5 block">{totalOtraAtencion}</span>
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
                            : 'bg-white border-slate-200/80 hover:shadow-sm'
                    }`}
                >
                    <div>
                        <span className="block text-[9px] uppercase font-bold tracking-wider text-slate-400">Mant. Resuelto</span>
                        <span className="text-xl font-extrabold text-green-600 mt-0.5 block">{totalAtendidos}</span>
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
                            : 'bg-white border-slate-200/80 hover:shadow-sm'
                    }`}
                >
                    <div>
                        <span className="block text-[9px] uppercase font-bold tracking-wider text-slate-400">Otra At. Resuelta</span>
                        <span className="text-xl font-extrabold text-teal-600 mt-0.5 block">{totalOtroAtendido}</span>
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
                            : 'bg-white border-slate-200/80 hover:shadow-sm'
                    }`}
                >
                    <div>
                        <span className="block text-[9px] uppercase font-bold tracking-wider text-slate-400">Total Faltantes</span>
                        <span className="text-xl font-extrabold text-slate-600 mt-0.5 block">{totalFaltantes}</span>
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
                            : 'bg-white border-slate-200/80 hover:shadow-sm'
                    }`}
                >
                    <div>
                        <span className="block text-[9px] uppercase font-bold tracking-wider text-slate-400">Sin Imágenes</span>
                        <span className="text-xl font-extrabold text-blue-600 mt-0.5 block">{totalSinImagenes}</span>
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
                            className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                        />
                    </div>
                    {/* Filtro de Unidad */}
                    <div className="w-full md:w-auto min-w-[220px]">
                        <Select 
                            value={filtros.unidad || " "} 
                            onValueChange={(val) => handleFiltroChange({target: {name: 'unidad', value: val.trim()}})}
                        >
                            <SelectTrigger className="w-full bg-slate-50/50 border-slate-200 text-sm h-9">
                                <SelectValue placeholder="Todas las unidades">
                                    {filtros.unidad && filtros.unidad !== " " ? (unidades.find(u => String(u.ref) === filtros.unidad)?.nombre || filtros.unidad) : "Todas las unidades"}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <div className="p-2 sticky top-0 bg-white z-10 border-b border-slate-100">
                                    <Input
                                        placeholder="Buscar unidad..."
                                        value={searchUnidadTable}
                                        onChange={(e) => setSearchUnidadTable(e.target.value)}
                                        onKeyDown={(e) => e.stopPropagation()}
                                        className="h-8 text-xs bg-slate-50 focus-visible:ring-emerald-500"
                                    />
                                </div>
                                <SelectItem value=" ">Todas las unidades</SelectItem>
                                {unidadesFiltradasTable.map(u => (
                                    <SelectItem key={u.ref} value={String(u.ref)}>
                                        {u.nombre}
                                    </SelectItem>
                                ))}
                                {unidadesFiltradasTable.length === 0 && (
                                    <div className="py-4 text-center text-xs text-slate-500">No se encontraron unidades</div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Tabla de Nodos */}
                <div className="overflow-auto flex-1 w-full min-h-0 border border-slate-200/80 rounded-xl bg-white shadow-xs">
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
                            {(!isLoading && datosAMostrar.length === 0) ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                                        No se encontraron nodos con los filtros actuales.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                datosAMostrar.slice(pageNode * rowsPerPageNode, (pageNode + 1) * rowsPerPageNode).map((nodoData, index) => {
                                    const isSelected = selectedRowId === nodoData.Id;
                                    const rowClass = `transition-colors ${
                                        isSelected 
                                            ? 'bg-blue-50/80 hover:bg-blue-100/60' 
                                            : 'hover:bg-slate-50/80'
                                    }`;

                                    const firstCellBorderClass = isSelected
                                        ? 'shadow-[inset_4px_0_0_0_#3b82f6]'
                                        : (nodoData.TieneImagenes === 0 ? 'shadow-[inset_4px_0_0_0_#fb923c]' : '');

                                    return (
                                        <TableRow 
                                            key={nodoData.Id || index}
                                            className={rowClass}
                                        >
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
                                                <div className="flex items-center justify-center gap-2">
                                                    
                                                    {/* Grupo 1: Acciones del Nodo (Ver, Editar, Eliminar) */}
                                                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/60 p-1 rounded-lg shadow-2xs">
                                                        {/* Ver detalles */}
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        size="icon"
                                                                        variant="ghost"
                                                                        onClick={() => handleDetailsClick(nodoData)}
                                                                        className="h-7 w-7 rounded-md text-blue-600 hover:text-blue-700 hover:bg-blue-100 transition-colors"
                                                                    >
                                                                        <i className="fas fa-eye text-[13px]"></i>
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Ver detalles completos</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>

                                                        {user?.role === 'administrador' && (
                                                            <>
                                                                {/* Editar */}
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button 
                                                                                size="icon" 
                                                                                variant="ghost" 
                                                                                onClick={(e) => { e.stopPropagation(); handleEditClick(nodoData); }}
                                                                                className="h-7 w-7 rounded-md text-amber-600 hover:text-amber-700 hover:bg-amber-100 transition-colors"
                                                                            >
                                                                                <i className="fas fa-edit text-[13px]"></i>
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>Editar Nodo</TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>

                                                                {/* Eliminar */}
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button 
                                                                                size="icon" 
                                                                                variant="ghost" 
                                                                                onClick={(e) => { e.stopPropagation(); handleDeleteClick(nodoData); }}
                                                                                className="h-7 w-7 rounded-md text-red-600 hover:text-red-700 hover:bg-red-100 transition-colors"
                                                                            >
                                                                                <i className="fas fa-trash text-[13px]"></i>
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>Eliminar Nodo</TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            </>
                                                        )}
                                                    </div>

                                                    {/* Grupo 2: Mantenimiento (Mantenimiento, Otra Atención) */}
                                                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/60 p-1 rounded-lg shadow-2xs">
                                                        {/* Mantenimiento */}
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        size="icon"
                                                                        variant="ghost"
                                                                        onClick={() => handleAtencionClick(nodoData)}
                                                                        className={`h-7 w-7 rounded-md transition-colors ${
                                                                            nodoData.Atencion
                                                                                ? 'text-red-600 hover:text-red-700 hover:bg-red-100'
                                                                                : nodoData.Atendido
                                                                                    ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100'
                                                                                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'
                                                                        }`}
                                                                    >
                                                                        <i className="fas fa-wrench text-[13px]"></i>
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Mantenimiento: {nodoData.Atencion ? 'Pendiente' : nodoData.Atendido ? 'Resuelto' : 'Sin reporte'}</p>
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
                                                                        className={`h-7 w-7 rounded-md transition-colors ${
                                                                            nodoData.OtraAtencion
                                                                                ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-100'
                                                                                : nodoData.OtroAtendido
                                                                                    ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100'
                                                                                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'
                                                                        }`}
                                                                    >
                                                                        <i className="fas fa-exclamation-triangle text-[13px]"></i>
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Otra Atención: {nodoData.OtraAtencion ? 'Pendiente' : nodoData.OtroAtendido ? 'Resuelta' : 'Sin reporte'}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>

                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Paginación (Estilo NodosSustitucion) */}
                <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-slate-200/80 w-full mt-auto">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span>Registros por página:</span>
                        <select
                            className="border border-slate-200 rounded-lg p-1.5 bg-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            value={rowsPerPageNode}
                            onChange={(e) => {
                                setRowsPerPageNode(parseInt(e.target.value, 10));
                                setPageNode(0);
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
                            {datosAMostrar.length === 0 ? 0 : pageNode * rowsPerPageNode + 1}–{Math.min((pageNode + 1) * rowsPerPageNode, datosAMostrar.length)} de {datosAMostrar.length}
                        </span>
                        <div className="flex gap-1">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setPageNode(p => Math.max(0, p - 1))}
                                disabled={pageNode === 0}
                                className="h-8 w-8 text-slate-600 disabled:opacity-50 border-slate-200"
                            >
                                <i className="fas fa-chevron-left text-xs"></i>
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setPageNode(p => p + 1)}
                                disabled={(pageNode + 1) * rowsPerPageNode >= datosAMostrar.length}
                                className="h-8 w-8 text-slate-600 disabled:opacity-50 border-slate-200"
                            >
                                <i className="fas fa-chevron-right text-xs"></i>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODALS */}
            <NodeDetailsModal 
                selectedNodo={selectedNodo} 
                onClose={handleCloseModal} 
                handleImageClick={handleImageClick} 
            />

            <ConfirmDeleteModal 
                nodoToDelete={nodoToDelete} 
                onClose={handleCloseModal} 
                onConfirm={handleConfirmDelete} 
            />

            <ImageModal 
                selectedImage={selectedImage} 
                onClose={() => setSelectedImage(null)} 
            />

            <EditNodeModal 
                nodoToEdit={nodoToEdit}
                editFormData={editFormData}
                unidades={unidades}
                handleEditFormChange={handleEditFormChange}
                handleFileChange={handleFileChange}
                handleDeleteImage={handleDeleteImage}
                handleSaveChanges={handleSaveChanges}
                handleCloseModal={handleCloseModal}
                handleOpenMaterialesModal={handleOpenMaterialesModal}
                handleImageClick={handleImageClick}
                newImageFiles={newImageFiles}
                setNewImageFiles={setNewImageFiles}
            />

            <NodeMaterialsModal 
                showMaterialesModal={showMaterialesModal}
                nodoToEdit={nodoToEdit}
                setShowMaterialesModal={setShowMaterialesModal}
                pagination={pagination}
                setPagination={setPagination}
                filteredMaterials={filteredMaterials}
                paginatedMaterials={paginatedMaterials}
                handleMaterialChange={handleMaterialChange}
                handleSaveMateriales={handleSaveMateriales}
            />

            {/* Attention Modals */}
            <NodeAttentionModal 
                nodo={selectedAtencionNodo}
                title="¿Estás seguro de que este nodo ya no requiere mantenimiento?"
                onClose={handleCloseModal}
                onSolventarParcialmente={handleParcialAtencion}
                onSolventarCompletamente={handleDeleteAtencion}
                handleImageClick={handleImageClick}
                completeActionText="Ya no requiere mantenimiento"
            />

            <NodeAttentionModal 
                nodo={selectedSinAtencionNodo}
                title="Este nodo no requiere mantenimiento"
                onClose={handleCloseModal}
                handleImageClick={handleImageClick}
                showActions={false}
            />

            <NodeAttentionModal 
                nodo={selectedOtherAtencionNodo}
                title="¿Estás seguro de que este nodo ya no requiere de otra atención?"
                onClose={handleCloseModal}
                onSolventarParcialmente={handleParcialOtherAtencion}
                onSolventarCompletamente={handleDeleteOtherAtencion}
                handleImageClick={handleImageClick}
                completeActionText="Ya no requiere atención"
                historialLabel="Historial de otras atenciones"
                historialType="otrasAtenciones"
            />

            <NodeAttentionModal 
                nodo={selectedSinOtherAtencionNodo}
                title="Este nodo no requiere otras atenciones"
                onClose={handleCloseModal}
                handleImageClick={handleImageClick}
                showActions={false}
                historialLabel="Historial de otras atenciones"
                historialType="otrasAtenciones"
            />

            {/* Observation Modals */}
            <ObservationModal 
                isOpen={showObservacionesModal}
                title="Motivos del cambio del estado"
                observacionesUsuario={observacionesUsuario}
                setObservacionesUsuario={setObservacionesUsuario}
                onFileChange={(e) => {
                    const files = Array.from(e.target.files);
                    const uniqueFiles = files.reduce((acc, file) => {
                        const isDuplicate = acc.some(f => f.name === file.name && f.size === file.size);
                        if (!isDuplicate) acc.push(file);
                        return acc;
                    }, []);
                    setNewImageFilesAtencion(uniqueFiles);
                }}
                onCancel={() => {
                    setEditFormData(prev => ({
                        ...prev,
                        [campoCambiado]: !prev[campoCambiado],
                    }));
                    setShowObservacionesModal(false);
                }}
                onConfirm={async () => {
                    const formData = new FormData();
                    formData.append('Ubicacion', editFormData.Ubicacion);
                    formData.append('Unidad', editFormData.Unidad);
                    formData.append('atencion', editFormData.Atencion ? 1 : 0);
                    formData.append('otraAtencion', editFormData.OtraAtencion ? 1 : 0);
                    formData.append('observacionesUsuario', observacionesUsuario);
                    formData.append('esAtencionParcialMante', false);
                    formData.append('esAtencionParcialOtro', false);
                    newImageFilesAtencion.forEach((file) => formData.append('newImagesAtencion', file));

                    try {
                        await axios.put(`${API_URL}/api/nodos/updateAtencion/${nodoToEdit.Id}`, formData, {
                            headers: { 'Content-Type': 'multipart/form-data' },
                        });
                        setNewImageFilesAtencion([]);
                        setShowObservacionesModal(false);
                    } catch (error) {
                        console.error('Error al guardar los cambios:', error);
                        toastError('Error al guardar los cambios');
                    }
                }}
            />

            <ObservationModal 
                isOpen={showObservacionesModalTable}
                title="Motivos del cambio"
                observacionesUsuario={observacionesUsuario}
                setObservacionesUsuario={setObservacionesUsuario}
                onFileChange={handleFileChange}
                onCancel={() => setShowObservacionesModalTable(false)}
                onConfirm={async () => {
                    const formData = new FormData();
                    formData.append('esAtencionParcialMante', false);
                    formData.append('esAtencionParcialOtro', false);
                    
                    const nodoReferencia = tipoAtencion === 'Atencion' ? selectedAtencionNodo : selectedOtherAtencionNodo;
                    formData.append('Ubicacion', nodoReferencia.Ubicacion);
                    formData.append('Unidad', nodoReferencia.Unidad);
                    formData.append('observacionesUsuario', observacionesUsuario);
                    newImageFiles.forEach((file) => formData.append('newImages', file));

                    const endpoint = tipoAtencion === 'Atencion'
                        ? `${API_URL}/api/nodos/atencion/${nodoReferencia.Id}`
                        : `${API_URL}/api/nodos/otraAtencion/${nodoReferencia.Id}`;

                    try {
                        await axios.put(endpoint, formData, {
                            headers: { 'Content-Type': 'multipart/form-data' },
                        });
                        success(`${tipoAtencion === 'Atencion' ? 'Mantenimiento' : 'Otra atención'} eliminada`);
                        setNewImageFiles([]);
                        handleCloseModal();
                        fetchNewNodos();
                    } catch (error) {
                        console.error(`Error al eliminar ${tipoAtencion}:`, error);
                        toastError(`Error al eliminar ${tipoAtencion === 'Atencion' ? 'el mantenimiento' : 'otra atención'}`);
                    }
                }}
            />

            <ObservationModal 
                isOpen={showObservacionesModalParcialTable}
                title="Solventado Parcialmente"
                placeholder="Ingrese los cambios solventados en el nodo..."
                observacionesUsuario={observacionesUsuario}
                setObservacionesUsuario={setObservacionesUsuario}
                onFileChange={handleFileChange}
                onCancel={() => setShowObservacionesModalParcialTable(false)}
                onConfirm={async () => {
                    const formData = new FormData();
                    const nodoReferencia = tipoAtencion === 'Atencion' ? selectedAtencionNodo : selectedOtherAtencionNodo;
                    
                    formData.append('Ubicacion', nodoReferencia.Ubicacion);
                    formData.append('Unidad', nodoReferencia.Unidad);
                    formData.append('observacionesUsuario', observacionesUsuario);
                    newImageFiles.forEach((file) => formData.append('newImagesAtencion', file));
                    
                    if (tipoAtencion === 'Atencion') {
                        formData.append('atencion', 1);
                        formData.append('otraAtencion', nodoReferencia.OtraAtencion ? 1 : 0);
                        formData.append('esAtencionParcialMante', true);
                        formData.append('esAtencionParcialOtro', false);
                    } else {
                        formData.append('atencion', nodoReferencia.Atencion ? 1 : 0);
                        formData.append('otraAtencion', 1);
                        formData.append('esAtencionParcialMante', false);
                        formData.append('esAtencionParcialOtro', true);
                    }

                    try {
                        await axios.put(`${API_URL}/api/nodos/updateAtencion/${nodoReferencia.Id}`, formData, {
                            headers: { 'Content-Type': 'multipart/form-data' },
                        });
                        success(`${tipoAtencion === 'Atencion' ? 'Mantenimiento parcialmente solucionado' : 'Otra atención parcialmente solucionada'}`);
                        setNewImageFiles([]);
                        fetchNewNodos();
                        handleCloseModal();
                    } catch (error) {
                        console.error(`Error al solventar parcialmente:`, error);
                        toastError(`Error al solventar parcialmente`);
                    }
                }}
            />

            {/* Modal de Registro de Nodo */}
            <Dialog open={showRegisterModal} onOpenChange={setShowRegisterModal}>
                <DialogContent className="max-w-[95vw] sm:max-w-3xl md:max-w-4xl max-h-[90vh] overflow-y-auto bg-white p-8 rounded-xl border border-slate-200 shadow-xl">
                    <DialogHeader className="border-b border-slate-100 pb-4 mb-6">
                        <DialogTitle className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                            <i className="fas fa-network-wired text-emerald-700"></i> Registrar Nuevo Nodo
                        </DialogTitle>
                        <p className="text-sm text-slate-500 mt-1">Complete la información requerida para dar de alta un nodo en el padrón</p>
                    </DialogHeader>
                    <NodeForm 
                        onAddNodo={fetchNewNodos} 
                        onClose={() => setShowRegisterModal(false)} 
                    />
                </DialogContent>
            </Dialog>

        </div>
    );
};
export default NodeTable;
