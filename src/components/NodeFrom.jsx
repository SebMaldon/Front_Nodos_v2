import { useState, useEffect } from 'react'; // Importar las funciones useState y useEffect
import axios from 'axios'; // Importar axios para realizar peticiones HTTP
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const API_URL = 'http://localhost:5090';


const NodeFrom = ({ onAddNodo, onClose }) => {
    const { user } = useContext(AuthContext);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({ // Estado para almacenar los datos del formulario
        Ubicacion: '',
        Unidad: '',
        CategoriaCable: '',
        AnioInstalacion: '',
        EstadoCable: '',
        Puerto: '',
        Area: '',
        Longitud: '',
        IpSwitch: '',
        Observaciones: '',
        Atencion: false, // Valor inicial del checkbox
        OtraAtencion: false, // Valor inicial del checkbox
        Referencia: '',
        Nodos_faltantes: '',
    });
    const [materialesSeleccionados, setMaterialesSeleccionados] = useState([]);
    const [materialActual, setMaterialActual] = useState({
        id: '',
        cantidad: 1
    });
    const [materiales, setMateriales] = useState([]);
    const [imageFiles, setImageFiles] = useState([]); // Estado para almacenar los archivos de imágenes
    const [unidades, setUnidades] = useState([]); // Estado para almacenar las unidades
    const [searchUnidadForm, setSearchUnidadForm] = useState("");
    const unidadesFiltradasForm = unidades.filter(u => u.nombre.toLowerCase().includes(searchUnidadForm.toLowerCase()));
    const [showObservacionesModal, setShowObservacionesModal] = useState(false); // 
    const [showMaterialesModal, setShowMaterialesModal] = useState(false); // 
    const [observacionesUsuario, setObservacionesUsuario] = useState(''); // 
    const [campoCambiado, setCampoCambiado] = useState(''); // Para saber si el cambio fue en Atencion o OtraAtencion
    const [showObservacionesDestinoModal, setShowObservacionesDestinoModal] = useState(false);
    const [observacionDestino, setObservacionDestino] = useState(''); // 'mantenimiento', 'otro', 'ambos'
    const [observacionEditada, setObservacionEditada] = useState(false);
    const [observacionAnterior, setObservacionAnterior] = useState('');

    const fetchUnidades = async () => {
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
                    setFormData(prev => ({ 
                        ...prev, 
                        Unidad: unidadAsignada.nombre,
                        Referencia: unidadAsignada.ref 
                    }));
                }
            }
        } catch (error) {
            console.error('Error al obtener las unidades:', error);
        }
    };

    // Obtener las unidades al cargar el componente
    useEffect(() => {

        const fetchMateriales = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/nodos/materiales`); // Hacer una petición GET a la API

                setMateriales(response.data.materiales || response.data); // Almacenar los materiales en el estado
            } catch (error) {
                console.log('Error al obtener los materiales: ', error);
            }
        };

        fetchMateriales(); // Llamar a la función para obtener los materiales
        fetchUnidades(); // Llamar a la función para obtener las unidades
    }, []);

    // Manejar cambio de material seleccionado
    const handleMaterialChange = (e) => {
        setMaterialActual({
            ...materialActual,
            id: e.target.value
        });
    };

    // Manejar cambio de cantidad
    const handleCantidadChange = (e) => {
        const materialSeleccionado = materiales.find(m => m.Id === materialActual.id);
        const esPiezas = materialSeleccionado?.UnidadMedida === 'piezas';
        let valor = e.target.value;

        // Validar que si es piezas, sea número entero
        if (esPiezas) {
            valor = Math.floor(Number(valor)); // Forzar número entero
            if (valor < 1) valor = 1; // Mínimo 1 pieza
        }

        setMaterialActual({
            ...materialActual,
            cantidad: valor
        });
    };

    // Añadir material a la lista
    const agregarMaterial = () => {
        if (!materialActual.id) return;

        const material = materiales.find(m => m.Id === materialActual.id);
        if (!material) return;

        // Verificar si el material ya está en la lista
        const existe = materialesSeleccionados.some(m => m.id === materialActual.id);
        if (existe) {
            alert('Este material ya fue agregado');
            return;
        }

        // Validar cantidad para piezas
        if (material.UnidadMedida === 'piezas' && !Number.isInteger(Number(materialActual.cantidad))) {
            alert('Para materiales en piezas, la cantidad debe ser un número entero');
            return;
        }

        setMaterialesSeleccionados([
            ...materialesSeleccionados,
            {
                id: materialActual.id,
                nombre: material.Nombre,
                cantidad: materialActual.cantidad,
                unidad: material.UnidadMedida
            }
        ]);

        // Resetear selección
        setMaterialActual({
            id: '',
            cantidad: 1
        });
    };

    // Eliminar material de la lista
    const eliminarMaterial = (id) => {
        setMaterialesSeleccionados(
            materialesSeleccionados.filter(m => m.id !== id)
        );
    };


    // Manejar cambios en los campos del formulario
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target; // Obtener el nombre, valor y tipo del campo
        if (name === 'Unidad') {
            const unidadSeleccionada = unidades.find(u => u.nombre === value); // Almacena los datos de la unidad almacenada
            setFormData({
                ...formData, // Datos del formulario
                Unidad: value, // Registra el nombre de la unidad
                Referencia: unidadSeleccionada ? unidadSeleccionada.ref : '' // Registra la referencia de la unidad
            });
            return;
        }

        // Si el campo es Atencion o OtraAtencion, mostrar la modal de observaciones
        if (type === 'checkbox' && checked) { //corroborar que el checkbox este seleccionado (true)
            if (name === 'Atencion' || name === 'OtraAtencion') {
                setCampoCambiado(name); // Guardar el campo que se está cambiando
                setShowObservacionesModal(true); // Mostrar la modal de observaciones
            }
        }

        // Para el campo Observaciones
        if (name === 'Observaciones') {
            // Si el campo está siendo editado (no es la primera vez)
            if (observacionEditada && value === '') {
                // Si el usuario borra todas las observaciones, resetear los campos relacionados
                setFormData({
                    ...formData,
                    Observaciones: '',
                    Atencion: false,
                    OtraAtencion: false,
                    ObservacionesUsuarioAtencion: '',
                    ObservacionesUsuarioOtraAtencion: ''
                });
                setObservacionEditada(false);
                return;
            }

            // Actualizar el valor normalmente
            setFormData({
                ...formData,
                [name]: value
            });

            return;
        }

        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value, // Actualizar el valor del checkbox
        });
    };

    // Manejar cuando el campo Observaciones pierde el foco
    const handleObservacionesBlur = () => {
        // Solo mostrar el modal si hay texto y no es una edición de texto existente
        if (formData.Observaciones.trim() !== '' && !observacionEditada) {
            setObservacionesUsuario(formData.Observaciones);
            setObservacionAnterior(formData.Observaciones);
            setShowObservacionesDestinoModal(true);
            setObservacionEditada(true);
        }
    };

    // Función para manejar la selección de destino de las observaciones
    const handleObservacionDestino = (destino) => {
        // Actualizar el estado del formulario según el destino seleccionado
        const newFormData = { ...formData };

        if (destino === 'mantenimiento') {
            newFormData.Atencion = true;
            newFormData.ObservacionesUsuarioAtencion = observacionesUsuario;
        } else if (destino === 'otro') {
            newFormData.OtraAtencion = true;
            newFormData.ObservacionesUsuarioOtraAtencion = observacionesUsuario;
        } else if (destino === 'ambos') {
            newFormData.Atencion = true;
            newFormData.OtraAtencion = true;
            newFormData.ObservacionesUsuarioAtencion = observacionesUsuario;
            newFormData.ObservacionesUsuarioOtraAtencion = observacionesUsuario;
        }

        setFormData(newFormData);
        setShowObservacionesDestinoModal(false);
    };

    // Manejar cambios en la selección de archivos
    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);

        // Filtrar archivos duplicados por nombre y tamaño
        const uniqueFiles = files.reduce((acc, file) => {
            const isDuplicate = acc.some(
                f => f.name === file.name && f.size === file.size
            );
            if (!isDuplicate) {
                acc.push(file);
            }
            return acc;
        }, []);

        setImageFiles(uniqueFiles);
    };

    // Manejar el envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const longitud = parseFloat(formData.Longitud) || 0; // Convertir a valor decimal
        const nodosFaltantes = parseInt(formData.Nodos_faltantes) || 0; // Convertir a valor entero

        // Validar si Atencion y OtraAtencion es true
        const atencionValue = formData.Atencion ? 1 : 0; // Convertir el valor del checkbox a 1 o 0
        const otherAtencionValue = formData.OtraAtencion ? 1 : 0; // Convertir el valor del checkbox a 1 o 0
        // Crear un FormData para enviar los datos y las imágenes
        const formDataToSend = new FormData(); // Crear un nuevo FormData
        formDataToSend.append('Ubicacion', formData.Ubicacion); // Agregar los datos del formulario al FormData
        formDataToSend.append('Unidad', formData.Unidad); // Agregar los datos del formulario al FormData
        formDataToSend.append('CategoriaCable', formData.CategoriaCable); // Agregar los datos del formulario al FormData
        formDataToSend.append('AnioInstalacion', formData.AnioInstalacion); // Agregar los datos del formulario al FormData
        formDataToSend.append('EstadoCable', formData.EstadoCable); // Agregar los datos del formulario al FormData
        formDataToSend.append('Puerto', formData.Puerto); // Agregar los datos del formulario al FormData
        formDataToSend.append('Area', formData.Area); // Agregar los datos del formulario al FormData
        formDataToSend.append('Longitud', longitud); // Agregar los datos del formulario al FormData
        formDataToSend.append('IpSwitch', formData.IpSwitch); // Agregar los datos del formulario al FormData
        formDataToSend.append('Observaciones', formData.Observaciones); // Agregar los datos del formulario al FormData
        formDataToSend.append('Atencion', atencionValue); // Enviar el valor correcto del checkbox
        formDataToSend.append('OtraAtencion', otherAtencionValue); // Enviar el valor correcto del checkbox
        formDataToSend.append('Referencia', formData.Referencia); // Agregar los datos del formulario al FormData
        formDataToSend.append('Nodos_faltantes', nodosFaltantes); // Agregar los datos del formulario al FormData
        // Agregar las observaciones del usuario (si existen)
        if (formData.ObservacionesUsuarioAtencion) {
            formDataToSend.append('ObservacionesUsuarioAtencion', formData.ObservacionesUsuarioAtencion);
        }
        if (formData.ObservacionesUsuarioOtraAtencion) {
            formDataToSend.append('ObservacionesUsuarioOtraAtencion', formData.ObservacionesUsuarioOtraAtencion);
        }

        // Agregar materiales al FormData
        materialesSeleccionados.forEach((material, index) => {
            formDataToSend.append(`materialesUtilizados[${index}][id]`, material.id);
            formDataToSend.append(`materialesUtilizados[${index}][necesarios]`, material.cantidad);
        });

        // Agregar las imágenes al FormData (si hay imágenes seleccionadas)
        if (imageFiles.length > 0) {
            imageFiles.forEach((file) => {
                formDataToSend.append('images', file); // 'images' es el nombre del campo que Multer espera
            });
        }

        try {
            // Enviar los datos al backend
            const response = await axios.post(`${API_URL}/api/nodos`, formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data', // Especificar el tipo de contenido
                },
            });
            alert('Nodo registrado'); // Mostrar un mensaje de éxito

            // Limpiar el formulario
            setFormData({
                Ubicacion: '',
                Unidad: '',
                CategoriaCable: '',
                AnioInstalacion: '',
                EstadoCable: '',
                Puerto: '',
                Area: '',
                Longitud: '',
                IpSwitch: '',
                Observaciones: '',
                Atencion: false, // Reiniciar el checkbox
                OtraAtencion: false, // Reiniciar el checkbox
                Referencia: '',
                Nodos_faltantes: '',
            });
            setMaterialActual({ id: '', cantidad: 1 });
            setMaterialesSeleccionados([]);
            setObservacionesUsuario(''); //Limpiar las observaciones
            setImageFiles([]); // Limpiar las imágenes seleccionadas

            // Actualizar la lista de nodos
            if (onAddNodo) {
                await onAddNodo(); // Asegúrate de esperar la actualización
            }
            if (onClose) {
                onClose();
            }
        } catch (error) {
            console.error('Error al crear el nodo:', error);
            alert('Error al crear el nodo');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Función para verificar si un campo (array) está vacío
    const EstaVacio = (dato) => {
        // console.log(dato,' - ',dato.length);
        if (dato.length == 0) {
            return true;
        } else {
            return false;
        }
    };

    return (
        <div className="w-full">
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* SECCIÓN 1: Ubicación y Unidad */}
                <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-200/60 space-y-4">
                    <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 border-b border-slate-200/50 pb-2">
                        <i className="fas fa-map-marker-alt text-emerald-600"></i> Información de Ubicación
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label className="text-slate-600 font-medium">Unidad:</Label>
                            <Select
                                value={formData.Unidad || ''}
                                onValueChange={(value) => handleChange({ target: { name: 'Unidad', value, type: 'text' } })}
                                disabled={!!(user?.id_unidad && user.id_unidad !== 0)}
                            >
                                <SelectTrigger className="w-full bg-white border border-slate-200">
                                    <SelectValue placeholder="Seleccione una unidad">
                                        {formData.Unidad || 'Seleccione una unidad'}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <div className="p-2 sticky top-0 bg-white z-10 border-b border-slate-100">
                                        <Input
                                            placeholder="Buscar unidad..."
                                            value={searchUnidadForm}
                                            onChange={(e) => setSearchUnidadForm(e.target.value)}
                                            onKeyDown={(e) => e.stopPropagation()}
                                            className="h-8 text-xs bg-slate-50 focus-visible:ring-emerald-500"
                                        />
                                    </div>
                                    {(!user?.id_unidad || user.id_unidad === 0) && (
                                        <SelectItem value=" ">Seleccione una unidad</SelectItem>
                                    )}
                                    {unidadesFiltradasForm.map((unidad) => (
                                        <SelectItem key={unidad.nombre} value={unidad.nombre}>
                                            {unidad.nombre}
                                        </SelectItem>
                                    ))}
                                    {unidadesFiltradasForm.length === 0 && (
                                        <div className="py-4 text-center text-xs text-slate-500">No se encontraron unidades</div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-600 font-medium">Ubicación:</Label>
                            <Input
                                name="Ubicacion"
                                value={formData.Ubicacion}
                                onChange={handleChange}
                                placeholder="Ej: Pasillo principal, sótano"
                                className="bg-white border border-slate-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-600 font-medium">Área:</Label>
                            <Input
                                name="Area"
                                value={formData.Area}
                                onChange={handleChange}
                                placeholder="Ej: Archivos Clínicos, Farmacia"
                                className="bg-white border border-slate-200"
                            />
                        </div>
                    </div>
                </div>

                {/* SECCIÓN 2: Conectividad y Switch */}
                <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-200/60 space-y-4">
                    <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 border-b border-slate-200/50 pb-2">
                        <i className="fas fa-server text-emerald-600"></i> Red y Conectividad
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-slate-600 font-medium">IP del Switch:</Label>
                            <Input
                                name="IpSwitch"
                                value={formData.IpSwitch}
                                onChange={handleChange}
                                required
                                placeholder="Ej: 172.19.45.253"
                                className="bg-white border border-slate-200 font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-600 font-medium">Puerto:</Label>
                            <Input
                                name="Puerto"
                                value={formData.Puerto}
                                onChange={handleChange}
                                required
                                placeholder="Ej: Gi1/0/24 o 15"
                                className="bg-white border border-slate-200 font-mono"
                            />
                        </div>
                    </div>
                </div>

                {/* SECCIÓN 3: Especificaciones e Infraestructura */}
                <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-200/60 space-y-4">
                    <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 border-b border-slate-200/50 pb-2">
                        <i className="fas fa-ethernet text-emerald-600"></i> Especificaciones del Cable
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label className="text-slate-600 font-medium">Categoría del Cable:</Label>
                            <Select
                                value={formData.CategoriaCable || ''}
                                onValueChange={(value) => handleChange({ target: { name: 'CategoriaCable', value, type: 'text' } })}
                                required
                            >
                                <SelectTrigger className="bg-white border border-slate-200">
                                    <SelectValue placeholder="Seleccione categoría">
                                        {formData.CategoriaCable && formData.CategoriaCable !== 'Sin categoría' 
                                            ? (formData.CategoriaCable.startsWith('Categoría') ? formData.CategoriaCable : `Categoría ${formData.CategoriaCable}`) 
                                            : 'Seleccione categoría'}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Sin categoría">Seleccione una categoría</SelectItem>
                                    <SelectItem value="5">Categoría 5</SelectItem>
                                    <SelectItem value="5e">Categoría 5e</SelectItem>
                                    <SelectItem value="6">Categoría 6</SelectItem>
                                    <SelectItem value="6A">Categoría 6A</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-600 font-medium">Longitud (m):</Label>
                            <Input
                                name="Longitud"
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.Longitud || '0'}
                                onChange={handleChange}
                                placeholder="Longitud en metros"
                                className="bg-white border border-slate-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-600 font-medium">Año de Instalación:</Label>
                            <Input
                                name="AnioInstalacion"
                                type="number"
                                min="0"
                                max={new Date().getFullYear().toString()}
                                value={formData.AnioInstalacion || '0'}
                                onChange={handleChange}
                                placeholder="Año de instalación"
                                className="bg-white border border-slate-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-600 font-medium">Estado del Cable:</Label>
                            <Select
                                value={formData.EstadoCable || ''}
                                onValueChange={(value) => handleChange({ target: { name: 'EstadoCable', value, type: 'text' } })}
                                required
                            >
                                <SelectTrigger className="bg-white border border-slate-200">
                                    <SelectValue placeholder="Seleccione un estado">
                                        {formData.EstadoCable && formData.EstadoCable !== 'Sin estado' ? formData.EstadoCable : 'Seleccione un estado'}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Sin estado">Seleccione un estado</SelectItem>
                                    <SelectItem value="Bueno">Bueno</SelectItem>
                                    <SelectItem value="Regular">Regular</SelectItem>
                                    <SelectItem value="Malo">Malo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* SECCIÓN 4: Inventario y Observaciones */}
                <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-200/60 space-y-4">
                    <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 border-b border-slate-200/50 pb-2">
                        <i className="fas fa-list text-emerald-600"></i> Inventario y Observaciones
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2 sm:col-span-1">
                            <Label className="text-slate-600 font-medium">Nodos faltantes:</Label>
                            <Input
                                name="Nodos_faltantes"
                                type="number"
                                min="0"
                                max="99999"
                                value={formData.Nodos_faltantes || '0'}
                                onChange={handleChange}
                                required
                                placeholder="Nodos requeridos"
                                className="bg-white border border-slate-200"
                            />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label className="text-slate-600 font-medium">Observaciones:</Label>
                            <Textarea
                                name="Observaciones"
                                value={formData.Observaciones}
                                onChange={handleChange}
                                onBlur={handleObservacionesBlur}
                                className="resize-none h-10 bg-white border border-slate-200 min-h-[40px] focus:min-h-[80px] transition-all duration-200"
                                placeholder="Ingrese observaciones o detalles adicionales sobre este nodo"
                            />
                        </div>
                    </div>
                </div>

                {/* SECCIÓN 5: Reporte de Incidencias / Mantenimiento */}
                <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-200/60 space-y-4">
                    <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 border-b border-slate-200/50 pb-2">
                        <i className="fas fa-exclamation-triangle text-emerald-600"></i> Reporte y Estatus de Atención
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                            formData.Atencion 
                                ? 'bg-red-50/40 border-red-200 text-red-900 shadow-2xs' 
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50/80'
                        }`}>
                            <input
                                type="checkbox"
                                name="Atencion"
                                checked={formData.Atencion}
                                onChange={(e) => handleChange({ target: { name: 'Atencion', value: e.target.checked, type: 'checkbox', checked: e.target.checked } })}
                                className="h-5 w-5 rounded border-slate-300 text-red-600 focus:ring-red-500 mt-0.5 transition-colors"
                            />
                            <div>
                                <span className="text-sm font-semibold block">Requiere Mantenimiento</span>
                                <span className="text-xs text-slate-500 block mt-0.5">Activar si el nodo presenta daño físico, falsos contactos o requiere mantenimiento correctivo.</span>
                            </div>
                        </label>

                        <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                            formData.OtraAtencion 
                                ? 'bg-amber-50/40 border-amber-200 text-amber-900 shadow-2xs' 
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50/80'
                        }`}>
                            <input
                                type="checkbox"
                                name="OtraAtencion"
                                checked={formData.OtraAtencion}
                                onChange={(e) => handleChange({ target: { name: 'OtraAtencion', value: e.target.checked, type: 'checkbox', checked: e.target.checked } })}
                                className="h-5 w-5 rounded border-slate-300 text-amber-600 focus:ring-amber-500 mt-0.5 transition-colors"
                            />
                            <div>
                                <span className="text-sm font-semibold block">Requiere Otra Atención</span>
                                <span className="text-xs text-slate-500 block mt-0.5">Activar si requiere reubicación, cambios de velocidad, asignaciones de VLAN u otro tipo de atención administrativa.</span>
                            </div>
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        {/* Botón de Materiales */}
                        <div className="space-y-3">
                            <Label className="text-slate-700 font-semibold text-sm block">Materiales Requeridos:</Label>
                            <div className="flex flex-col gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2 h-10 px-4 rounded-lg shadow-2xs font-medium transition-all w-full sm:w-fit"
                                    onClick={() => setShowMaterialesModal(true)}
                                >
                                    <i className="fas fa-tools text-emerald-600"></i>
                                    <span>Gestionar Materiales</span>
                                </Button>
                                {materialesSeleccionados.length > 0 ? (
                                    <div className="p-3 bg-emerald-50/40 border border-emerald-100 rounded-lg">
                                        <h4 className="font-bold text-xs text-emerald-800 uppercase tracking-wider mb-2">Materiales seleccionados:</h4>
                                        <ul className="space-y-1 text-xs text-emerald-700">
                                            {materialesSeleccionados.map(material => (
                                                <li key={material.id} className="flex justify-between items-center py-1 border-b border-emerald-100/50 last:border-0">
                                                    <span>{material.nombre} ({material.cantidad} {material.unidad})</span>
                                                    <button type="button" onClick={() => eliminarMaterial(material.id)} className="text-red-500 hover:text-red-700 ml-2">
                                                        <i className="fas fa-times-circle"></i>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic">No se han registrado materiales para este nodo.</p>
                                )}
                            </div>
                        </div>

                        {/* Evidencia Fotográfica */}
                        <div className="space-y-3">
                            <Label className="text-slate-700 font-semibold text-sm block">Evidencia Fotográfica (Imágenes):</Label>
                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 bg-white hover:bg-slate-50/50 transition-colors flex flex-col items-center justify-center cursor-pointer relative group min-h-[90px]">
                                <input
                                    type="file"
                                    name="images"
                                    multiple
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="text-center space-y-1 flex flex-col items-center">
                                    <div className="h-8 w-8 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-slate-500 group-hover:border-slate-300 shadow-2xs transition-all mb-1">
                                        <i className="fas fa-cloud-upload-alt text-xs"></i>
                                    </div>
                                    <p className="text-xs font-semibold text-slate-700">Subir imágenes de evidencia</p>
                                    <p className="text-[10px] text-slate-400">Haga clic o arrastre archivos aquí</p>
                                </div>
                            </div>
                            {!EstaVacio(imageFiles) && (
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                                    <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Imágenes seleccionadas ({imageFiles.length}):</h5>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {imageFiles.map((file, index) => {
                                            const url = URL.createObjectURL(file);
                                            return (
                                                <div key={index} className="relative group rounded-lg overflow-hidden border border-slate-200 shadow-2xs bg-white">
                                                    <img 
                                                        src={url} 
                                                        className="w-full h-20 object-cover" 
                                                        onLoad={() => URL.revokeObjectURL(url)}
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <span className="text-[9px] text-white text-center px-1 truncate w-full">{file.name}</span>
                                                    </div>
                                                    <Button 
                                                        type="button"
                                                        size="icon" 
                                                        variant="destructive" 
                                                        className="absolute top-1 right-1 h-5 w-5 rounded-full shadow-md bg-red-600 hover:bg-red-700 text-white animate-fade-in" 
                                                        onClick={() => {
                                                            const newFiles = [...imageFiles];
                                                            newFiles.splice(index, 1);
                                                            setImageFiles(newFiles);
                                                        }}
                                                    >
                                                        <i className="fas fa-times text-[10px]"></i>
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* BOTONES DE ACCIÓN PRINCIPALES */}
                <div className="pt-6 flex justify-end gap-3 border-t border-slate-200">
                    {onClose && (
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={onClose}
                            className="h-10 px-5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg font-medium"
                        >
                            Cancelar
                        </Button>
                    )}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    type="submit" 
                                    disabled={isSubmitting} 
                                    className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-sm transition-all flex items-center gap-2"
                                >
                                    <i className="fas fa-save"></i> Registrar Nodo
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Registrar nuevo nodo en el sistema</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                
                {/* Modales incrustados temporales */}
                <Dialog open={showObservacionesDestinoModal} onOpenChange={(val) => {
                    if (!val) {
                        setShowObservacionesDestinoModal(false);
                        setFormData({...formData, Observaciones: observacionAnterior});
                    }
                }}>
                    <DialogContent className="max-w-md bg-white p-6 rounded-xl border shadow-lg">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-bold">¿A qué tipo de atención corresponde esta observación?</DialogTitle>
                        </DialogHeader>
                        <div className="py-2">
                            <p className="text-slate-600 mb-6 p-3 bg-slate-100 rounded-lg border text-sm">{observacionesUsuario}</p>
                            <div className="flex flex-col gap-3 mb-6">
                                <Button variant="outline" className="border-blue-200 hover:bg-blue-50 text-left justify-start" onClick={() => handleObservacionDestino('mantenimiento')}>Solo mantenimiento</Button>
                                <Button variant="outline" className="border-amber-200 hover:bg-amber-50 text-left justify-start" onClick={() => handleObservacionDestino('otro')}>Solo otro tipo de atención</Button>
                                <Button variant="outline" className="border-purple-200 hover:bg-purple-50 text-left justify-start" onClick={() => handleObservacionDestino('ambos')}>Ambos tipos de atención</Button>
                            </div>
                            <div className="flex justify-end">
                                <Button variant="ghost" onClick={() => {
                                    setShowObservacionesDestinoModal(false);
                                    setFormData({...formData, Observaciones: observacionAnterior});
                                }}>Cancelar</Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                <Dialog open={showObservacionesModal} onOpenChange={(val) => {
                    if (!val) {
                        setFormData((prev) => ({...prev, [campoCambiado]: false}));
                        setShowObservacionesModal(false);
                        setObservacionesUsuario('');
                    }
                }}>
                    <DialogContent className="max-w-md bg-white p-6 rounded-xl border shadow-lg">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-bold">Observaciones adicionales</DialogTitle>
                        </DialogHeader>
                        <div className="py-2">
                            <Textarea
                                placeholder="Ingrese las observaciones del cambio..."
                                value={observacionesUsuario}
                                onChange={(e) => setObservacionesUsuario(e.target.value)}
                                className="mb-6 h-32"
                            />
                            <div className="flex justify-end gap-3">
                                <Button variant="ghost" onClick={() => {
                                    setFormData((prev) => ({...prev, [campoCambiado]: false}));
                                    setShowObservacionesModal(false);
                                    setObservacionesUsuario('');
                                }}>Cancelar</Button>
                                <Button className="bg-emerald-700 hover:bg-emerald-800 text-white" onClick={() => {
                                    if (campoCambiado === 'Atencion') {
                                        setFormData({...formData, ObservacionesUsuarioAtencion: observacionesUsuario});
                                    } else if (campoCambiado === 'OtraAtencion') {
                                        setFormData({...formData, ObservacionesUsuarioOtraAtencion: observacionesUsuario});
                                    }
                                    setShowObservacionesModal(false);
                                    setObservacionesUsuario('');
                                }}>Aceptar</Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                <Dialog open={showMaterialesModal} onOpenChange={setShowMaterialesModal}>
                    <DialogContent className="max-w-lg bg-white p-6 rounded-xl border shadow-lg">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-bold">Agregar Materiales Necesarios</DialogTitle>
                        </DialogHeader>
                        <div className="py-2">
                            <div className="flex gap-2 items-end mb-6">
                                <div className="flex-1 space-y-2">
                                    <Label>Material</Label>
                                    <Select value={materialActual.id} onValueChange={(value) => handleMaterialChange({target: {value}})}>
                                        <SelectTrigger className="bg-white">
                                            <SelectValue placeholder="Seleccione un material" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value=" ">Seleccione un material</SelectItem>
                                            {materiales.map(material => (
                                                <SelectItem key={material.Id} value={material.Id}>
                                                    {material.Nombre} ({material.UnidadMedida})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="w-24 space-y-2">
                                    <Label>Cantidad</Label>
                                    <Input
                                        type="number"
                                        value={materialActual.cantidad}
                                        onChange={(e) => handleCantidadChange({target: {value: e.target.value}})}
                                        className="bg-white"
                                    />
                                </div>
                                <Button type="button" onClick={agregarMaterial} disabled={!materialActual.id} className="bg-blue-600 hover:bg-blue-700 text-white">Agregar</Button>
                            </div>
                            
                            <div className="max-h-60 overflow-y-auto mb-6 bg-slate-50 rounded-lg p-2 border">
                                {materialesSeleccionados.length === 0 ? (
                                    <p className="text-center text-slate-500 py-4 text-sm">No hay materiales seleccionados</p>
                                ) : (
                                    <ul className="space-y-2">
                                        {materialesSeleccionados.map(material => (
                                            <li key={material.id} className="flex justify-between items-center p-3 border bg-white rounded shadow-sm">
                                                <div>
                                                    <p className="font-medium text-sm">{material.nombre}</p>
                                                    <p className="text-xs text-slate-500">{material.cantidad} {material.unidad}</p>
                                                </div>
                                                <Button type="button" variant="destructive" size="sm" onClick={() => eliminarMaterial(material.id)}>
                                                    <i className="fas fa-trash"></i>
                                                </Button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button variant="outline" onClick={() => {
                                    setMaterialesSeleccionados([]);
                                    setShowMaterialesModal(false);
                                }}>Cancelar</Button>
                                <Button type="button" onClick={() => setShowMaterialesModal(false)} className="bg-emerald-700 hover:bg-emerald-800 text-white">Guardar Selección</Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </form>
        </div>
    );
};

export default NodeFrom;
