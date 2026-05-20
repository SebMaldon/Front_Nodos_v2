import { useState, useEffect, useContext } from 'react';
// MUI imports removed
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

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

    // Re-fetch cuando cambiamos la pagina o el limite
    useEffect(() => {
        fetchNewNodos();
    }, [pageNode, rowsPerPageNode]);

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

            // Hacer la solicitud a la API con los filtros modificados y paginación
            const response = await axios.get(`${API_URL}/api/nodos`, {
                params: { ...params, page: pageNode + 1, limit: rowsPerPageNode },
            });

            setFilteredNodos(response.data.nodos); // Almacenar los datos filtrados en el estado
            setTotalRegistros(response.data.total); // Almacenar el total de registros en el estado
            setTotalFaltantes(response.data.faltantes); // Almacenar el total de nodos faltantes en el estado
            setTotalAtendidos(response.data.totalAtendido);// Almacenar el total de nodos atendidos en el estado
        } catch (error) {
            console.error('Error al obtener los nuevos nodos:', error);
        } finally {
            setIsLoading(false);
        }
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
        try {
            const response = await axios.get(`${API_URL}/api/nodos/${nodoData.Id}`); // Llama a la API para obtener los detalles completos del nodo
            setSelectedNodo(response.data); // Guarda los detalles completos en el estado
        } catch (error) {
            console.error('Error al obtener los detalles del nodo:', error);
            alert('Error al obtener los detalles del nodo');
        }
    };

    // Función para abrir el modal de confirmación de eliminación
    const handleDeleteClick = (nodoData) => {
        setNodoToDelete(nodoData); // Guarda el nodo a eliminar en el estado
    };

    // Función para abrir el modal de confirmación para quitar la atención
    const handleAtencionClick = async (nodoData) => {
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

            alert('Cambios guardados correctamente');
            handleCloseModal(); // Cerrar el modal
            fetchNewNodos(); // Actualizar la lista filtrada y refrescar las banderas
            setNewImageFiles([]); // Limpiar el estado de las nuevas imágenes
        } catch (error) {
            console.error('Error al guardar los cambios:', error);
            alert('Error al guardar los cambios');
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

            alert('Cambios guardados correctamente');
            handleCloseModal(); // Cerrar el modal
            fetchNewNodos(); // Actualizar la lista filtrada y refrescar las banderas
            setNewImageFiles([]); // Limpiar el estado de las nuevas imágenes
        } catch (error) {
            console.error('Error al guardar los cambios:', error);
            alert('Error al guardar los cambios');
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
            alert('Nodo eliminado exitosamente');
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
            alert('Error al obtener los detalles del nodo');
        }
    };


    // Función para eliminar una imagen de la base de datos
    const handleDeleteImage = async (imageId) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta imagen?')) return;

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
            alert('Imagen eliminada con éxito');

            // No cerrar el modal automáticamente para permitir más acciones
            handleCloseModal();

            // Recargar datos
            fetchNewNodos();

        } catch (error) {
            console.error('Error al eliminar la imagen:', error);
            alert('Hubo un error al eliminar la imagen');
        }
    };

    const datosAMostrar = Array.isArray(filteredNodos) ? filteredNodos.filter(n => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            (n.Ubicacion && n.Ubicacion.toLowerCase().includes(term)) ||
            (n.Unidad && n.Unidad.toLowerCase().includes(term)) ||
            (n.Puerto && String(n.Puerto).toLowerCase().includes(term)) ||
            (n.IpSwitch && n.IpSwitch.toLowerCase().includes(term)) ||
            (n.Observaciones && n.Observaciones.toLowerCase().includes(term))
        );
    }) : [];

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
            alert('Error al cargar materiales');
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
                alert('No hay cambios para guardar');
                return;
            }

            // Enviar los cambios al backend
            const response = await axios.put(
                `${API_URL}/api/nodos/materiales/${nodoToEdit.Id}`,
                { materiales: materialesAEnviar }
            );
            if (response.data.success) {
                alert('Materiales actualizados correctamente');
                setShowMaterialesModal(false); // Cerrar la modal de materiales
                setMaterialesEditados([]); // Limpiar la lista de editados
            }
        } catch (error) {
            console.error('Error al guardar materiales:', error);
            alert('Error al guardar materiales');
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
        <div className="space-y-6 w-full">
            {/* Header / Título estilo Screenshot */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestión y Registro de Nodos</h1>
                    <p className="text-sm text-slate-500 mt-1">Padrón de nodos y enlaces institucionales — Delegación Nayarit</p>
                </div>
                <div className="flex items-center gap-3">
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
                            <TooltipContent>Refrescar datos</TooltipContent>
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

            {/* Pestañas de estatus rápidas */}
            <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl w-fit border border-slate-200/50">
                <button
                    onClick={() => handleFiltroChange({ target: { name: 'tipoAtencion', value: '' } })}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                        !filtros.tipoAtencion
                            ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50'
                            : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                    Todos los Nodos 
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        !filtros.tipoAtencion ? 'bg-emerald-800 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                        {totalRegistros}
                    </span>
                </button>
                <button
                    onClick={() => handleFiltroChange({ target: { name: 'tipoAtencion', value: 'mantenimiento' } })}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                        filtros.tipoAtencion === 'mantenimiento'
                            ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50'
                            : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                    Requieren Mantenimiento
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        filtros.tipoAtencion === 'mantenimiento' ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                        {totalFaltantes}
                    </span>
                </button>
                <button
                    onClick={() => handleFiltroChange({ target: { name: 'tipoAtencion', value: 'uno' } })}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                        filtros.tipoAtencion === 'uno'
                            ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50'
                            : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                    Mantenimiento Resuelto
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        filtros.tipoAtencion === 'uno' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                        {totalAtendidos}
                    </span>
                </button>
            </div>

            {/* Contenedor Principal (Tarjeta estilo Screenshot) */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
                {/* Buscador y Filtros */}
                <div className="flex flex-col md:flex-row gap-3 items-center">
                    <div className="relative w-full md:flex-1">
                        <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                        <Input
                            type="text"
                            placeholder="Buscar por ubicación, ip switch, puerto o resguardo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 h-10 w-full bg-white border border-slate-200 rounded-lg shadow-2xs text-sm focus-visible:ring-emerald-600"
                        />
                    </div>
                    
                    <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
                        <Select 
                            value={filtros.tipoAtencion || "all"} 
                            onValueChange={(val) => handleFiltroChange({target: {name: 'tipoAtencion', value: val === 'all' ? '' : val}})}
                        >
                            <SelectTrigger className="w-full sm:w-[180px] h-10 bg-white border border-slate-200 text-sm">
                                <SelectValue placeholder="Todos los estatus">
                                    {filtros.tipoAtencion ? (
                                        filtros.tipoAtencion === 'uno' ? 'Mantenimiento Resuelto' :
                                        filtros.tipoAtencion === 'mantenimiento' ? 'Requieren Mantenimiento' :
                                        filtros.tipoAtencion === 'otraAtencion' ? 'Requieren Otra Atención' :
                                        filtros.tipoAtencion === 'ambos' ? 'Ambos tipos' :
                                        filtros.tipoAtencion === 'ninguno' ? 'Sin ningún reporte' :
                                        'Todos los estatus'
                                    ) : 'Todos los estatus'}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los estatus</SelectItem>
                                <SelectItem value="uno">Mantenimiento Resuelto</SelectItem>
                                <SelectItem value="mantenimiento">Requieren Mantenimiento</SelectItem>
                                <SelectItem value="otraAtencion">Requieren Otra Atención</SelectItem>
                                <SelectItem value="ambos">Ambos tipos</SelectItem>
                                <SelectItem value="ninguno">Sin ningún reporte</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select 
                            value={filtros.unidad || "all"} 
                            onValueChange={(val) => handleFiltroChange({target: {name: 'unidad', value: val === 'all' ? '' : val}})}
                        >
                            <SelectTrigger className="w-full sm:w-[180px] h-10 bg-white border border-slate-200 text-sm">
                                <SelectValue placeholder="Todas las Unidades">
                                    {filtros.unidad ? (unidades.find(u => u.ref === filtros.unidad)?.nombre || filtros.unidad) : 'Todas las Unidades'}
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
                                <SelectItem value="all">Todas las Unidades</SelectItem>
                                {unidadesFiltradasTable.map(u => (
                                    <SelectItem key={u.ref} value={u.ref}>
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

                <div className="text-xs text-slate-400 font-medium">
                    {datosAMostrar.length} registros encontrados
                </div>

                {/* Tabla de Nodos */}
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 hover:bg-slate-50">
                                <TableHead className="font-semibold text-slate-500 text-xs uppercase tracking-wider">PUERTO / SWITCH</TableHead>
                                <TableHead className="font-semibold text-slate-500 text-xs uppercase tracking-wider">UBICACIÓN / UNIDAD</TableHead>
                                <TableHead className="font-semibold text-slate-500 text-xs uppercase tracking-wider">OBSERVACIONES</TableHead>
                                <TableHead className="font-semibold text-slate-500 text-xs uppercase tracking-wider text-center">FALTANTES</TableHead>
                                <TableHead className="font-semibold text-slate-500 text-xs uppercase tracking-wider">ESTATUS / ATENCIÓN</TableHead>
                                <TableHead className="font-semibold text-slate-500 text-xs uppercase tracking-wider text-right pr-6">ACCIONES</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {datosAMostrar.map((nodoData, index) => {
                                const isSelected = selectedRowId === nodoData.Id;
                                const hasImages = nodoData.TieneImagenes;
                                
                                return (
                                    <TableRow 
                                        key={nodoData.Id}
                                        onClick={() => setSelectedRowId(nodoData.Id)}
                                        className={`cursor-pointer transition-colors border-b border-slate-100 ${
                                            isSelected 
                                                ? 'bg-emerald-50/40 hover:bg-emerald-50' 
                                                : !hasImages 
                                                    ? 'bg-red-50/20 hover:bg-red-50/40' 
                                                    : 'hover:bg-slate-50/80'
                                        }`}
                                    >
                                        <TableCell>
                                            <div className="space-y-1">
                                                <span className="inline-flex items-center px-2 py-0.5 text-xs font-mono font-medium bg-slate-100 text-slate-800 rounded border border-slate-200">
                                                    P: {nodoData.Puerto}
                                                </span>
                                                <div className="text-xs text-slate-400 font-mono">
                                                    IP: {nodoData.IpSwitch}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-0.5">
                                                <div className="font-semibold text-slate-900 text-sm">{nodoData.Ubicacion}</div>
                                                <div className="text-xs text-slate-500">{nodoData.Unidad}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-[220px] truncate text-slate-600 text-sm">
                                            {nodoData.Observaciones || 'Sin observaciones'}
                                        </TableCell>
                                        <TableCell className="text-center font-medium text-slate-700 text-sm">
                                            {nodoData.Nodos_faltantes || '0'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1.5 justify-center">
                                                {nodoData.Atencion ? (
                                                    <Badge 
                                                        variant="destructive" 
                                                        className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200 text-xs px-2.5 py-1 rounded-full font-medium cursor-pointer w-fit"
                                                        onClick={(e) => { e.stopPropagation(); handleAtencionClick(nodoData); }}
                                                    >
                                                        <span className="w-1.5 h-1.5 rounded-full bg-red-600 mr-1.5 animate-pulse"></span>
                                                        Req. Mantenimiento
                                                    </Badge>
                                                ) : nodoData.Atendido ? (
                                                    <Badge 
                                                        variant="outline" 
                                                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 text-xs px-2.5 py-1 rounded-full font-medium cursor-pointer w-fit"
                                                        onClick={(e) => { e.stopPropagation(); handleAtencionClick(nodoData); }}
                                                    >
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5"></span>
                                                        Manto. Resuelto
                                                    </Badge>
                                                ) : null}

                                                {nodoData.OtraAtencion ? (
                                                    <Badge 
                                                        variant="destructive" 
                                                        className="bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 text-xs px-2.5 py-1 rounded-full font-medium cursor-pointer w-fit"
                                                        onClick={(e) => { e.stopPropagation(); handleOtherAtencionClick(nodoData); }}
                                                    >
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mr-1.5 animate-pulse"></span>
                                                        Req. Otra Atención
                                                    </Badge>
                                                ) : nodoData.OtroAtendido ? (
                                                    <Badge 
                                                        variant="outline" 
                                                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 text-xs px-2.5 py-1 rounded-full font-medium cursor-pointer w-fit"
                                                        onClick={(e) => { e.stopPropagation(); handleOtherAtencionClick(nodoData); }}
                                                    >
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5"></span>
                                                        Atención Resuelta
                                                    </Badge>
                                                ) : null}
                                                
                                                {!nodoData.Atencion && !nodoData.Atendido && !nodoData.OtraAtencion && !nodoData.OtroAtendido && (
                                                    <Badge 
                                                        variant="outline" 
                                                        className="bg-slate-50 text-slate-600 border-slate-200 text-xs px-2.5 py-1 rounded-full font-medium w-fit"
                                                    >
                                                        Activo / Sin Reporte
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button 
                                                                size="icon" 
                                                                variant="ghost" 
                                                                onClick={(e) => { e.stopPropagation(); handleDetailsClick(nodoData); }}
                                                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                                            >
                                                                <i className="fas fa-eye text-sm"></i>
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Ver Detalles</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>

                                                {user?.role === 'administrador' && (
                                                    <>
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button 
                                                                        size="icon" 
                                                                        variant="ghost" 
                                                                        onClick={(e) => { e.stopPropagation(); handleEditClick(nodoData); }}
                                                                        className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                                                                    >
                                                                        <i className="fas fa-edit text-sm"></i>
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Editar Nodo</TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>

                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button 
                                                                        size="icon" 
                                                                        variant="ghost" 
                                                                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(nodoData); }}
                                                                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                                                    >
                                                                        <i className="fas fa-trash text-sm"></i>
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Eliminar Nodo</TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {!isLoading && datosAMostrar.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                                        No se encontraron nodos registrados que coincidan.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Paginación */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                    <div className="text-sm text-slate-500">
                        Página {pageNode + 1} de {Math.max(1, Math.ceil(totalRegistros / rowsPerPageNode))}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-slate-500">Nodos por página:</span>
                            <select 
                                className="border rounded p-1 text-sm bg-white border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                                value={rowsPerPageNode}
                                onChange={(e) => {
                                    setRowsPerPageNode(parseInt(e.target.value, 10));
                                    setPageNode(0);
                                }}
                            >
                                {[5, 10, 25, 50].map(val => (
                                    <option key={val} value={val}>{val}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="flex space-x-2">
                            <Button 
                                variant="outline" 
                                size="sm"
                                disabled={pageNode === 0}
                                onClick={() => setPageNode(prev => prev - 1)}
                                className="h-8 shadow-2xs border-slate-200"
                            >
                                Anterior
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm"
                                disabled={(pageNode + 1) * rowsPerPageNode >= totalRegistros}
                                onClick={() => setPageNode(prev => prev + 1)}
                                className="h-8 shadow-2xs border-slate-200"
                            >
                                Siguiente
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
            />

            <NodeAttentionModal 
                nodo={selectedSinOtherAtencionNodo}
                title="Este nodo no requiere otras atenciones"
                onClose={handleCloseModal}
                handleImageClick={handleImageClick}
                showActions={false}
                historialLabel="Historial de otras atenciones"
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
                        alert('Error al guardar los cambios');
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
                        alert(`${tipoAtencion === 'Atencion' ? 'Mantenimiento' : 'Otra atención'} eliminada`);
                        setNewImageFiles([]);
                        handleCloseModal();
                        fetchNewNodos();
                    } catch (error) {
                        console.error(`Error al eliminar ${tipoAtencion}:`, error);
                        alert(`Error al eliminar ${tipoAtencion === 'Atencion' ? 'el mantenimiento' : 'otra atención'}`);
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
                        alert(`${tipoAtencion === 'Atencion' ? 'Mantenimiento parcialmente solucionado' : 'Otra atención parcialmente solucionada'}`);
                        setNewImageFiles([]);
                        fetchNewNodos();
                        handleCloseModal();
                    } catch (error) {
                        console.error(`Error al solventar parcialmente:`, error);
                        alert(`Error al solventar parcialmente`);
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
