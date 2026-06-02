import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const API_URL = 'http://localhost:5090';

export default function UnidadesModal({ open, onClose, onUnidadesChange }) {
    const { user } = useContext(AuthContext);
    const { success, error: toastError, warn, confirm } = useNotifications();

    const esAdminGlobal = !user?.id_unidad || user.id_unidad === 0;
    const esDeUnidadEspecifica = !esAdminGlobal;
    
    const [unidades, setUnidades] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Pagination
    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);

    // Editor state
    const [isEditing, setIsEditing] = useState(false);
    const [currentOldData, setCurrentOldData] = useState(null);
    const [formData, setFormData] = useState({
        ref: '',
        nombre: '',
        ip: '',
        tipo_unidad: 'Médica',
        vlan: '',
        zona: ''
    });

    const [selectedUnidad, setSelectedUnidad] = useState(null);

    const fetchUnidadesDetalle = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${API_URL}/api/nodos/unidades/detalle`, {
                params: {
                    page: page + 1,
                    limit: limit
                }
            });
            setUnidades(response.data.unidades || []);
            setTotal(response.data.total || 0);
            setSelectedUnidad(null);
        } catch (error) {
            console.error('Error al obtener el detalle de las unidades:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchUnidadesDetalle();
            resetForm();
        }
    }, [open, page, limit]);

    const resetForm = () => {
        setFormData({
            ref: '',
            nombre: '',
            ip: '',
            tipo_unidad: 'Médica',
            vlan: '',
            zona: ''
        });
        setIsEditing(false);
        setCurrentOldData(null);
        setSelectedUnidad(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSelectRow = (unidad) => {
        if (esDeUnidadEspecifica) {
            const esUnidadPropia = String(unidad.id_unidad) === String(user.id_unidad);
            if (!esUnidadPropia) return;
        }
        if (selectedUnidad && selectedUnidad.ref === unidad.ref && selectedUnidad.ip === unidad.ip && selectedUnidad.vlan === unidad.vlan) {
            setSelectedUnidad(null);
            resetForm();
        } else {
            setSelectedUnidad(unidad);
        }
    };

    const onClickEditar = () => {
        if (!selectedUnidad) return;
        setIsEditing(true);
        setCurrentOldData({
            ref: selectedUnidad.ref,
            ip: selectedUnidad.ip,
            vlan: selectedUnidad.vlan
        });
        setFormData({
            ref: selectedUnidad.ref || '',
            nombre: selectedUnidad.nombre || '',
            ip: selectedUnidad.ip || '',
            tipo_unidad: selectedUnidad.tipo_unidad || 'Médica',
            vlan: selectedUnidad.vlan || '',
            zona: selectedUnidad.zona !== null && selectedUnidad.zona !== undefined ? selectedUnidad.zona : ''
        });
    };

    const onClickEliminar = async () => {
        if (!selectedUnidad) return;
        if (!await confirm(`¿Estás seguro que deseas eliminar el segmento ${selectedUnidad.ref} (${selectedUnidad.ip} - VLAN: ${selectedUnidad.vlan})?`)) return;

        try {
            await axios.delete(`${API_URL}/api/nodos/unidades`, {
                params: {
                    ref: selectedUnidad.ref,
                    ip: selectedUnidad.ip,
                    vlan: selectedUnidad.vlan
                }
            });
            success('Unidad eliminada correctamente.');
            fetchUnidadesDetalle();
            if (onUnidadesChange) onUnidadesChange();
            resetForm();
        } catch (error) {
            console.error('Error al eliminar la unidad:', error);
            toastError('Error al intentar eliminar la unidad.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.ref || !formData.nombre || !formData.ip || !formData.vlan) {
            warn('Por favor, completa todos los campos requeridos.');
            return;
        }

        if (formData.zona !== '' && formData.zona !== null && parseInt(formData.zona, 10) < 0) {
            warn('La zona no puede ser un número negativo.');
            return;
        }

        try {
            if (isEditing) {
                await axios.put(`${API_URL}/api/nodos/unidades`, {
                    oldData: currentOldData,
                    newData: {
                        ...formData,
                        vlan: parseInt(formData.vlan, 10),
                        zona: formData.zona === '' || formData.zona === null ? null : parseInt(formData.zona, 10)
                    }
                });
                success('Unidad actualizada correctamente.');
            } else {
                await axios.post(`${API_URL}/api/nodos/unidades`, {
                    ref: formData.ref,
                    nombre: formData.nombre,
                    ip: formData.ip,
                    tipo_unidad: formData.tipo_unidad,
                    vlan: parseInt(formData.vlan, 10),
                    zona: formData.zona === '' || formData.zona === null ? null : parseInt(formData.zona, 10)
                });
                success('Unidad registrada correctamente.');
            }

            resetForm();
            fetchUnidadesDetalle();
            if (onUnidadesChange) onUnidadesChange();
        } catch (error) {
            console.error('Error al guardar la unidad:', error);
            toastError(error.response?.data?.message || 'Error al intentar guardar la unidad. Verifica los datos e intenta nuevamente.');
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white p-6 rounded-xl border shadow-lg">
                <DialogHeader className="border-b pb-4">
                    <DialogTitle className="text-xl font-bold text-slate-900">Administrar Unidades</DialogTitle>
                    <DialogDescription className="text-sm text-slate-500 mt-1">
                        Crea, edita o elimina los segmentos de red y unidades de atención del sistema.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
                    {/* Formulario */}
                    {(esAdminGlobal || isEditing) ? (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                            <div>
                                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
                                    {isEditing ? 'Editar Registro' : 'Nuevo Registro'}
                                </h4>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="ref" className="text-xs font-semibold text-slate-600">Referencia (ref) *</Label>
                                        <Input
                                            id="ref"
                                            name="ref"
                                            value={formData.ref}
                                            onChange={handleChange}
                                            required
                                            disabled={isEditing && esDeUnidadEspecifica}
                                            placeholder="Ej. UMF24"
                                            className="h-9 bg-white"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="nombre" className="text-xs font-semibold text-slate-600">Nombre *</Label>
                                        <Input
                                            id="nombre"
                                            name="nombre"
                                            value={formData.nombre}
                                            onChange={handleChange}
                                            required
                                            placeholder="Nombre de la unidad"
                                            className="h-9 bg-white"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="ip" className="text-xs font-semibold text-slate-600">IP Segmento *</Label>
                                        <Input
                                            id="ip"
                                            name="ip"
                                            value={formData.ip}
                                            onChange={handleChange}
                                            required
                                            placeholder="Ej. 10.12.24.0"
                                            className="h-9 bg-white"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <Label htmlFor="vlan" className="text-xs font-semibold text-slate-600">VLAN *</Label>
                                            <Input
                                                id="vlan"
                                                name="vlan"
                                                type="number"
                                                value={formData.vlan}
                                                onChange={handleChange}
                                                required
                                                placeholder="Ej. 100"
                                                className="h-9 bg-white"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="zona" className="text-xs font-semibold text-slate-600">Zona</Label>
                                            <Input
                                                id="zona"
                                                name="zona"
                                                type="number"
                                                value={formData.zona}
                                                onChange={handleChange}
                                                placeholder="Ej. 1"
                                                min="0"
                                                className="h-9 bg-white"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="tipo_unidad" className="text-xs font-semibold text-slate-600">Tipo de Unidad *</Label>
                                        <Select
                                            value={formData.tipo_unidad}
                                            onValueChange={(val) => handleChange({ target: { name: 'tipo_unidad', value: val } })}
                                        >
                                            <SelectTrigger id="tipo_unidad" className="h-9 bg-white">
                                                <SelectValue placeholder="Seleccione tipo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Médica">Médica</SelectItem>
                                                <SelectItem value="Administrativa">Administrativa</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    <div className="flex gap-2 pt-2">
                                        <Button type="submit" className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white h-9">
                                            <i className="fas fa-save mr-2"></i> {isEditing ? 'Guardar' : 'Agregar'}
                                        </Button>
                                        {isEditing && (
                                            <Button type="button" variant="outline" onClick={resetForm} className="h-9">
                                                Cancelar
                                            </Button>
                                        )}
                                    </div>
                                </form>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200/80 shadow-xs flex flex-col items-center justify-center text-center">
                            <i className="fas fa-info-circle text-slate-400 text-3xl mb-3"></i>
                            <p className="text-sm font-semibold text-slate-600">Sección restringida</p>
                            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                                Seleccione una fila de su unidad asignada en la tabla para editar sus parámetros.
                            </p>
                        </div>
                    )}

                    {/* Tabla y Controles */}
                    <div className="lg:col-span-2 flex flex-col justify-between space-y-4">
                        {/* Botones de acción principales */}
                        <div className="flex gap-2 justify-end">
                            <Button
                                variant="outline"
                                onClick={onClickEditar}
                                disabled={!selectedUnidad}
                                className="h-9 border-slate-200 shadow-xs gap-1.5"
                            >
                                <i className="fas fa-edit text-slate-500"></i>
                                <span>Editar</span>
                            </Button>
                            {esAdminGlobal && (
                                <Button
                                    variant="destructive"
                                    onClick={onClickEliminar}
                                    disabled={!selectedUnidad}
                                    className="h-9 shadow-xs gap-1.5"
                                >
                                    <i className="fas fa-trash"></i>
                                    <span>Eliminar</span>
                                </Button>
                            )}
                        </div>

                        {/* Contenedor de la tabla */}
                        <div className="border rounded-lg overflow-hidden bg-white shadow-xs">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                                        <TableHead className="font-semibold text-slate-700">Ref</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Nombre</TableHead>
                                        <TableHead className="font-semibold text-slate-700">IP Segmento</TableHead>
                                        <TableHead className="font-semibold text-slate-700 text-center">VLAN</TableHead>
                                        <TableHead className="font-semibold text-slate-700 text-center">Zona</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Tipo</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                                                Cargando unidades...
                                            </TableCell>
                                        </TableRow>
                                    ) : unidades.map((unidad, idx) => {
                                        const isSelected = selectedUnidad && selectedUnidad.ref === unidad.ref && selectedUnidad.ip === unidad.ip && selectedUnidad.vlan === unidad.vlan;
                                        const esSeleccionable = esAdminGlobal || String(unidad.id_unidad) === String(user?.id_unidad);
                                        return (
                                            <TableRow
                                                key={`${unidad.ref}-${unidad.ip}-${unidad.vlan}-${idx}`}
                                                onClick={() => handleSelectRow(unidad)}
                                                className={`transition-colors cursor-pointer ${
                                                    isSelected 
                                                        ? 'bg-emerald-50/80 hover:bg-emerald-50 font-medium' 
                                                        : esSeleccionable 
                                                            ? 'hover:bg-slate-50' 
                                                            : 'opacity-40 cursor-default hover:bg-transparent'
                                                }`}
                                            >
                                                <TableCell className="font-medium text-slate-900">{unidad.ref}</TableCell>
                                                <TableCell className="max-w-[150px] truncate">{unidad.nombre}</TableCell>
                                                <TableCell className="font-mono text-xs">{unidad.ip}</TableCell>
                                                <TableCell className="text-center">{unidad.vlan}</TableCell>
                                                <TableCell className="text-center">{unidad.zona !== null ? unidad.zona : '-'}</TableCell>
                                                <TableCell>{unidad.tipo_unidad}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {!isLoading && unidades.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                                                No se encontraron unidades registradas.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Paginación */}
                        <div className="flex items-center justify-between pt-2 border-t text-sm text-slate-500">
                            <div>
                                Página {page + 1} de {Math.max(1, Math.ceil(total / limit))}
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === 0}
                                    onClick={() => setPage(prev => prev - 1)}
                                    className="h-8 py-0 px-3"
                                >
                                    Anterior
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={(page + 1) * limit >= total}
                                    onClick={() => setPage(prev => prev + 1)}
                                    className="h-8 py-0 px-3"
                                >
                                    Siguiente
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="border-t pt-4 mt-2 flex justify-end">
                    <Button type="button" onClick={onClose} className="bg-slate-800 hover:bg-slate-900 text-white shadow-xs">
                        Cerrar Ventana
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
