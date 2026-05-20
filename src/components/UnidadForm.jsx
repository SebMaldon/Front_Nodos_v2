import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const UnidadForm = ({ onAddUnidad, onClose }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        ref: '',
        nombre: '',
        tipo_unidad: '',
        ip: '',
        bits: '',
        ipinit: '',
        vlan: '',
        proveedor: '',
        fecha_migracion: '',
        velocidad: '',
        tipo_enlace: '',
        zona: '',
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validar obligatorios visuales
        if (!formData.ref || !formData.nombre || !formData.tipo_unidad) {
            alert('Por favor, completa los campos obligatorios: Referencia, Nombre y Tipo de Unidad.');
            return;
        }

        if (formData.zona !== '' && formData.zona !== null && parseInt(formData.zona, 10) < 0) {
            alert('La zona no puede ser un número negativo.');
            return;
        }

        setIsSubmitting(true);
        try {
            const submitData = {
                ...formData,
                vlan: formData.vlan === '' ? null : parseInt(formData.vlan, 10),
                zona: formData.zona === '' ? null : parseInt(formData.zona, 10),
                bits: formData.bits === '' ? null : parseInt(formData.bits, 10),
            };
            
            await onAddUnidad(submitData);
            setFormData({
                ref: '', nombre: '', tipo_unidad: '', ip: '', bits: '', ipinit: '', vlan: '',
                proveedor: '', fecha_migracion: '', velocidad: '', tipo_enlace: '', zona: ''
            });
            onClose();
        } catch (error) {
            console.error('Error al agregar unidad:', error);
            alert(error.response?.data || 'Ocurrió un error al guardar la unidad.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[95vw] sm:max-w-3xl md:max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-xl">
                <DialogHeader className="mb-4">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-800 border-b border-slate-200 pb-3">
                        <i className="fas fa-plus-circle text-emerald-600"></i> Registrar Nueva Unidad
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Tarjeta 1: Información Principal */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-2">
                            <i className="fas fa-building text-emerald-600"></i> Información Principal (Obligatoria)
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-600 font-medium">Referencia *</Label>
                                <Input
                                    name="ref"
                                    value={formData.ref}
                                    onChange={handleChange}
                                    placeholder="Ej: UMF24"
                                    required
                                    className="bg-white border-slate-200"
                                />
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                                <Label className="text-slate-600 font-medium">Nombre *</Label>
                                <Input
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleChange}
                                    placeholder="Nombre completo de la unidad"
                                    required
                                    className="bg-white border-slate-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-600 font-medium">Tipo de Unidad *</Label>
                                <Select
                                    value={formData.tipo_unidad}
                                    onValueChange={(value) => handleChange({ target: { name: 'tipo_unidad', value } })}
                                    required
                                >
                                    <SelectTrigger className="w-full bg-white border border-slate-200">
                                        <SelectValue placeholder="Seleccione tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Médica">Médica</SelectItem>
                                        <SelectItem value="Administrativa">Administrativa</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-600 font-medium">Zona (Opcional)</Label>
                                <Input
                                    name="zona"
                                    type="number"
                                    value={formData.zona}
                                    onChange={handleChange}
                                    placeholder="Ej: 1"
                                    min="0"
                                    className="bg-white border-slate-200"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tarjeta 2: Red e IP */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-2">
                            <i className="fas fa-network-wired text-emerald-600"></i> Parámetros de Red
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-600 font-medium">IP Segmento</Label>
                                <Input
                                    name="ip"
                                    value={formData.ip}
                                    onChange={handleChange}
                                    placeholder="Ej: 10.12.24.0"
                                    className="bg-white border-slate-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-600 font-medium">IP Inicial</Label>
                                <Input
                                    name="ipinit"
                                    value={formData.ipinit}
                                    onChange={handleChange}
                                    placeholder="Ej: 10.12.24.1"
                                    className="bg-white border-slate-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-600 font-medium">VLAN</Label>
                                <Input
                                    name="vlan"
                                    type="number"
                                    value={formData.vlan}
                                    onChange={handleChange}
                                    placeholder="Ej: 100"
                                    className="bg-white border-slate-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-600 font-medium">Bits</Label>
                                <Input
                                    name="bits"
                                    type="number"
                                    value={formData.bits}
                                    onChange={handleChange}
                                    placeholder="Ej: 24"
                                    className="bg-white border-slate-200"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tarjeta 3: Conectividad y Proveedor */}
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-2">
                            <i className="fas fa-wifi text-emerald-600"></i> Conectividad y Proveedor
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2 lg:col-span-2">
                                <Label className="text-slate-600 font-medium">Proveedor</Label>
                                <Input
                                    name="proveedor"
                                    value={formData.proveedor}
                                    onChange={handleChange}
                                    placeholder="Proveedor de servicio"
                                    className="bg-white border-slate-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-600 font-medium">Tipo de Enlace</Label>
                                <Input
                                    name="tipo_enlace"
                                    value={formData.tipo_enlace}
                                    onChange={handleChange}
                                    placeholder="Ej: Fibra Óptica, Satelital"
                                    className="bg-white border-slate-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-600 font-medium">Velocidad</Label>
                                <Input
                                    name="velocidad"
                                    value={formData.velocidad}
                                    onChange={handleChange}
                                    placeholder="Ej: 100 Mbps"
                                    className="bg-white border-slate-200"
                                />
                            </div>
                            <div className="space-y-2 lg:col-span-2">
                                <Label className="text-slate-600 font-medium">Fecha de Migración</Label>
                                <Input
                                    name="fecha_migracion"
                                    type="date"
                                    value={formData.fecha_migracion}
                                    onChange={handleChange}
                                    className="bg-white border-slate-200"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={onClose} 
                            disabled={isSubmitting}
                            className="bg-white"
                        >
                            Cancelar
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {isSubmitting ? (
                                <><i className="fas fa-spinner fa-spin mr-2"></i> Guardando...</>
                            ) : (
                                <><i className="fas fa-save mr-2"></i> Registrar Unidad</>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default UnidadForm;
