import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function EditUnidadModal({ unidadToEdit, editFormData, handleEditFormChange, handleSaveChanges, handleCloseModal, isSubmitting, esAdminGlobal = true }) {
    if (!unidadToEdit) return null;

    const ENLACE_MAP = {
        1: 'Fibra Óptica',
        2: 'Cobre',
        3: 'Satelital',
        4: 'Punto a punto',
        5: 'Otro'
    };

    return (
        <Dialog open={!!unidadToEdit} onOpenChange={(open) => !open && handleCloseModal()}>
            <DialogContent className="max-w-[95vw] sm:max-w-3xl md:max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-xl">
                <DialogHeader className="mb-4">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-800 border-b border-slate-200 pb-3">
                        <i className="fas fa-edit text-emerald-600"></i> Editar Unidad
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
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
                                    value={editFormData.ref || ''}
                                    onChange={handleEditFormChange}
                                    placeholder="Ej: UMF24"
                                    required
                                    className="bg-white border-slate-200"
                                />
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                                <Label className="text-slate-600 font-medium">Nombre *</Label>
                                <Input
                                    name="nombre"
                                    value={editFormData.nombre || ''}
                                    onChange={handleEditFormChange}
                                    placeholder="Nombre completo de la unidad"
                                    required
                                    className="bg-white border-slate-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-600 font-medium">Tipo de Unidad *</Label>
                                <Select
                                    value={editFormData.tipo_unidad || ''}
                                    onValueChange={(value) => handleEditFormChange({ target: { name: 'tipo_unidad', value } })}
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
                                    value={editFormData.zona !== null ? editFormData.zona : ''}
                                    onChange={handleEditFormChange}
                                    placeholder="Ej: 1"
                                    min="0"
                                    className={`bg-white border-slate-200 ${!esAdminGlobal ? 'opacity-70 cursor-not-allowed bg-slate-50' : ''}`}
                                    disabled={!esAdminGlobal}
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
                                    value={editFormData.ip || ''}
                                    onChange={handleEditFormChange}
                                    placeholder="Ej: 10.12.24.0"
                                    className="bg-white border-slate-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-600 font-medium">IP Inicial</Label>
                                <Input
                                    name="ipinit"
                                    value={editFormData.ipinit || ''}
                                    onChange={handleEditFormChange}
                                    placeholder="Ej: 10.12.24.1"
                                    className="bg-white border-slate-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-600 font-medium">VLAN</Label>
                                <Input
                                    name="vlan"
                                    type="number"
                                    value={editFormData.vlan !== null ? editFormData.vlan : ''}
                                    onChange={handleEditFormChange}
                                    placeholder="Ej: 100"
                                    className="bg-white border-slate-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-600 font-medium">Bits</Label>
                                <Input
                                    name="bits"
                                    type="number"
                                    value={editFormData.bits !== null ? editFormData.bits : ''}
                                    onChange={handleEditFormChange}
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
                                    value={editFormData.proveedor || ''}
                                    onChange={handleEditFormChange}
                                    placeholder="Proveedor de servicio"
                                    className="bg-white border-slate-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-600 font-medium">Tipo de Enlace</Label>
                                <Select
                                    value={editFormData.tipo_enlace ? String(editFormData.tipo_enlace) : ''}
                                    onValueChange={(value) => handleEditFormChange({ target: { name: 'tipo_enlace', value: value === 'Ninguno' ? '' : parseInt(value, 10) } })}
                                >
                                    <SelectTrigger className="w-full bg-white border border-slate-200">
                                        <SelectValue placeholder="Seleccione tipo">
                                            {editFormData.tipo_enlace ? ENLACE_MAP[editFormData.tipo_enlace] || editFormData.tipo_enlace : 'Seleccione tipo'}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Ninguno">Ninguno</SelectItem>
                                        <SelectItem value="1">Fibra Óptica</SelectItem>
                                        <SelectItem value="2">Cobre</SelectItem>
                                        <SelectItem value="3">Satelital</SelectItem>
                                        <SelectItem value="4">Punto a punto</SelectItem>
                                        <SelectItem value="5">Otro</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-600 font-medium">Velocidad</Label>
                                <Input
                                    name="velocidad"
                                    value={editFormData.velocidad || ''}
                                    onChange={handleEditFormChange}
                                    placeholder="Ej: 100 Mbps"
                                    className="bg-white border-slate-200"
                                />
                            </div>
                            <div className="space-y-2 lg:col-span-2">
                                <Label className="text-slate-600 font-medium">Fecha de Migración</Label>
                                <Input
                                    name="fecha_migracion"
                                    type="date"
                                    value={editFormData.fecha_migracion || ''}
                                    onChange={handleEditFormChange}
                                    className="bg-white border-slate-200"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={handleCloseModal} 
                            disabled={isSubmitting}
                            className="bg-white"
                        >
                            Cancelar
                        </Button>
                        <Button 
                            type="button" 
                            onClick={handleSaveChanges}
                            disabled={isSubmitting}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {isSubmitting ? (
                                <><i className="fas fa-spinner fa-spin mr-2"></i> Guardando...</>
                            ) : (
                                <><i className="fas fa-save mr-2"></i> Guardar Cambios</>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
