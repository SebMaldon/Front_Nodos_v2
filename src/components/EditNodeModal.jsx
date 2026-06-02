import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function EditNodeModal({ nodoToEdit, editFormData, unidades, handleEditFormChange, handleFileChange, handleDeleteImage, handleSaveChanges, handleCloseModal, handleOpenMaterialesModal, handleImageClick, newImageFiles, setNewImageFiles }) {
    const [searchUnidadEdit, setSearchUnidadEdit] = useState("");
    if (!nodoToEdit) return null;
    
    const unidadesFiltradasEdit = unidades.filter(u => u.nombre.toLowerCase().includes(searchUnidadEdit.toLowerCase()));
    
    return (
        <Dialog open={!!nodoToEdit} onOpenChange={(open) => !open && handleCloseModal()}>
            <DialogContent className="max-w-[95vw] sm:max-w-3xl md:max-w-4xl max-h-[90vh] overflow-y-auto bg-white p-8 rounded-xl border border-slate-200 shadow-xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-800 border-b pb-4 mb-4">
                        <i className="fas fa-edit text-emerald-600"></i> Editar Nodo
                    </DialogTitle>
                </DialogHeader>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                    {/* Columna Izquierda */}
                    <div className="space-y-6">
                        {/* SECCIÓN 1: Ubicación y Unidad */}
                        <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-200/60 space-y-4">
                            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 border-b border-slate-200/50 pb-2">
                                <i className="fas fa-map-marker-alt text-emerald-600"></i> Ubicación del Nodo
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-600 font-medium">Ubicación</Label>
                                    <Input 
                                        name="Ubicacion" 
                                        value={editFormData.Ubicacion || ''} 
                                        onChange={handleEditFormChange} 
                                        className="bg-white border border-slate-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-600 font-medium">Unidad</Label>
                                    <Select value={editFormData.Unidad || ''} onValueChange={(val) => handleEditFormChange({target: {name: 'Unidad', value: val}})}>
                                        <SelectTrigger className="bg-white border border-slate-200">
                                            <SelectValue placeholder="Unidad">
                                                {editFormData.Unidad || 'Unidad'}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <div className="p-2 sticky top-0 bg-white z-10 border-b border-slate-100">
                                                <Input
                                                    placeholder="Buscar unidad..."
                                                    value={searchUnidadEdit}
                                                    onChange={(e) => setSearchUnidadEdit(e.target.value)}
                                                    onKeyDown={(e) => e.stopPropagation()}
                                                    className="h-8 text-xs bg-slate-50 focus-visible:ring-emerald-500"
                                                />
                                            </div>
                                            {unidadesFiltradasEdit.map(u => <SelectItem key={u.ref} value={u.nombre}>{u.nombre}</SelectItem>)}
                                            {unidadesFiltradasEdit.length === 0 && (
                                                <div className="py-4 text-center text-xs text-slate-500">No se encontraron unidades</div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* SECCIÓN 2: Conectividad y Switch */}
                        <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-200/60 space-y-4">
                            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 border-b border-slate-200/50 pb-2">
                                <i className="fas fa-server text-emerald-600"></i> Conectividad y Red
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-600 font-medium">Puerto</Label>
                                    <Input 
                                        name="Puerto" 
                                        value={editFormData.Puerto || ''} 
                                        onChange={handleEditFormChange} 
                                        className="bg-white border border-slate-200 font-mono"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-600 font-medium">IP del Switch</Label>
                                    <Input 
                                        name="IpSwitch" 
                                        value={editFormData.IpSwitch || ''} 
                                        onChange={handleEditFormChange} 
                                        className="bg-white border border-slate-200 font-mono"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* SECCIÓN 3: Especificaciones de Cable */}
                        <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-200/60 space-y-4">
                            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 border-b border-slate-200/50 pb-2">
                                <i className="fas fa-ethernet text-emerald-600"></i> Especificaciones del Cable
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-600 font-medium">Longitud (m)</Label>
                                    <Input 
                                        name="Longitud" 
                                        type="number" 
                                        step="0.01" 
                                        value={editFormData.Longitud || ''} 
                                        onChange={handleEditFormChange} 
                                        className="bg-white border border-slate-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-600 font-medium">Nodos Faltantes</Label>
                                    <Input 
                                        name="Nodos_faltantes" 
                                        type="number" 
                                        value={editFormData.Nodos_faltantes || ''} 
                                        onChange={handleEditFormChange} 
                                        className="bg-white border border-slate-200"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* SECCIÓN 4: Observaciones */}
                        <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-200/60 space-y-4">
                            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 border-b border-slate-200/50 pb-2">
                                <i className="fas fa-list text-emerald-600"></i> Detalles Adicionales
                            </h3>
                            <div className="space-y-2">
                                <Label className="text-slate-600 font-medium">Observaciones</Label>
                                <Textarea 
                                    name="Observaciones" 
                                    value={editFormData.Observaciones || ''} 
                                    onChange={handleEditFormChange} 
                                    className="h-20 resize-none bg-white border border-slate-200" 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Columna Derecha */}
                    <div className="space-y-6">
                        {/* SECCIÓN 5: Reportes y Estatus */}
                        <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-200/60 space-y-4">
                            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 border-b border-slate-200/50 pb-2">
                                <i className="fas fa-exclamation-triangle text-emerald-600"></i> Reporte y Atención
                            </h3>
                            
                            <div className="grid grid-cols-1 gap-4">
                                <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                                    editFormData.Atencion 
                                        ? 'bg-red-50/40 border-red-200 text-red-900 shadow-2xs' 
                                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50/80'
                                }`}>
                                    <input 
                                        type="checkbox" 
                                        name="Atencion" 
                                        checked={!!editFormData.Atencion} 
                                        onChange={handleEditFormChange} 
                                        className="h-5 w-5 rounded border-slate-300 text-red-600 focus:ring-red-500 mt-0.5 transition-colors" 
                                    />
                                    <div>
                                        <span className="text-sm font-semibold block">Requiere Mantenimiento</span>
                                        <span className="text-xs text-slate-500 block mt-0.5">Activar si el nodo presenta daño físico o requiere mantenimiento correctivo.</span>
                                    </div>
                                </label>

                                <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                                    editFormData.OtraAtencion 
                                        ? 'bg-amber-50/40 border-amber-200 text-amber-900 shadow-2xs' 
                                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50/80'
                                }`}>
                                    <input 
                                        type="checkbox" 
                                        name="OtraAtencion" 
                                        checked={!!editFormData.OtraAtencion} 
                                        onChange={handleEditFormChange} 
                                        className="h-5 w-5 rounded border-slate-300 text-amber-600 focus:ring-amber-500 mt-0.5 transition-colors" 
                                    />
                                    <div>
                                        <span className="text-sm font-semibold block">Requiere Otra Atención</span>
                                        <span className="text-xs text-slate-500 block mt-0.5">Activar si requiere reubicación, cambios de velocidad o VLAN.</span>
                                    </div>
                                </label>
                            </div>

                            <div className="grid grid-cols-1 gap-6 pt-2">
                                {/* Materiales */}
                                <div className="space-y-3">
                                    <Label className="text-slate-700 font-semibold text-sm block">Materiales Requeridos:</Label>
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        onClick={handleOpenMaterialesModal}
                                        className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2 h-10 px-4 rounded-lg shadow-2xs font-medium transition-all w-full"
                                    >
                                        <i className="fas fa-tools text-emerald-600"></i>
                                        <span>Gestionar Materiales</span>
                                    </Button>
                                </div>

                                {/* Evidencia Fotográfica */}
                                <div className="space-y-3">
                                    <Label className="text-slate-700 font-semibold text-sm block font-medium">Agregar Nuevas Imágenes:</Label>
                                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 bg-white hover:bg-slate-50/50 transition-colors flex flex-col items-center justify-center cursor-pointer relative group min-h-[90px]">
                                        <input 
                                            type="file" 
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
                                    {newImageFiles && newImageFiles.length > 0 && (
                                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 mt-2">
                                            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Nuevas imágenes seleccionadas ({newImageFiles.length}):</h5>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                {newImageFiles.map((file, index) => {
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
                                                                className="absolute top-1 right-1 h-5 w-5 rounded-full shadow-md bg-red-600 hover:bg-red-700 text-white" 
                                                                onClick={() => {
                                                                    const newFiles = [...newImageFiles];
                                                                    newFiles.splice(index, 1);
                                                                    setNewImageFiles(newFiles);
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

                            {/* Imágenes Existentes */}
                            {editFormData.images && editFormData.images.length > 0 && (
                                <div className="pt-4 border-t border-slate-200/60 mt-4">
                                    <Label className="text-slate-700 font-semibold text-sm mb-3 block">Imágenes Existentes</Label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {editFormData.images.map(img => (
                                            <div key={img.Id} className="relative group rounded-lg overflow-hidden border border-slate-200 shadow-2xs">
                                                <img 
                                                    src={`${import.meta.env.VITE_API_URL || 'http://localhost:5090'}${img.ImagenURL}`} 
                                                    className="w-full h-24 object-cover cursor-pointer hover:scale-105 transition-transform duration-200" 
                                                    onClick={() => handleImageClick(img.ImagenURL)} 
                                                />
                                                <Button 
                                                    size="icon" 
                                                    variant="destructive" 
                                                    className="absolute top-1.5 right-1.5 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full shadow-md bg-red-600 hover:bg-red-700 text-white" 
                                                    onClick={() => handleDeleteImage(img.Id)}
                                                >
                                                    <i className="fas fa-times text-xs"></i>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 border-t border-slate-200 pt-6">
                    <Button 
                        variant="outline" 
                        onClick={handleCloseModal}
                        className="h-10 px-5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg font-medium"
                    >
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleSaveChanges} 
                        className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-sm transition-all"
                    >
                        Guardar Cambios
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
