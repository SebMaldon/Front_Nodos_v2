import os

def create_modal(filename, content):
    with open(f"src/components/{filename}", "w", encoding="utf-8") as f:
        f.write(content)

# 1. ImageModal.jsx
image_modal = """import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function ImageModal({ selectedImage, onClose }) {
    return (
        <Dialog open={!!selectedImage} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none shadow-none">
                {selectedImage && (
                    <img 
                        src={selectedImage} 
                        alt="Vista ampliada" 
                        className="w-full h-auto max-h-[85vh] object-contain rounded-md"
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
"""
create_modal("ImageModal.jsx", image_modal)

# 2. ConfirmDeleteModal.jsx
confirm_delete_modal = """import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function ConfirmDeleteModal({ nodoToDelete, onClose, onConfirm }) {
    return (
        <Dialog open={!!nodoToDelete} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-red-600 flex items-center gap-2">
                        <i className="fas fa-exclamation-triangle"></i> Confirmar Eliminación
                    </DialogTitle>
                    <DialogDescription>
                        ¿Estás seguro de que deseas eliminar este nodo permanentemente? Esta acción no se puede deshacer.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex gap-2 sm:justify-end mt-4">
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button variant="destructive" onClick={onConfirm}>Eliminar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
"""
create_modal("ConfirmDeleteModal.jsx", confirm_delete_modal)

# 3. NodeDetailsModal.jsx
node_details_modal = """import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function NodeDetailsModal({ selectedNodo, onClose, handleImageClick }) {
    if (!selectedNodo) return null;
    
    return (
        <Dialog open={!!selectedNodo} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl">Detalles del Nodo</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-500">Ubicación</p>
                        <p className="font-semibold">{selectedNodo.Ubicacion}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-500">Unidad</p>
                        <p className="font-semibold">{selectedNodo.Unidad}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-500">IP del Switch</p>
                        <p className="font-semibold">{selectedNodo.IpSwitch}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-500">Puerto</p>
                        <p className="font-semibold">{selectedNodo.Puerto}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-500">Longitud</p>
                        <p className="font-semibold">{selectedNodo.Longitud} m</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-500">Categoría del Cable</p>
                        <p className="font-semibold">{selectedNodo.CategoriaCable}</p>
                    </div>
                    <div className="col-span-2 space-y-1 mt-2">
                        <p className="text-sm font-medium text-slate-500">Observaciones</p>
                        <p className="bg-slate-50 p-3 rounded-md text-sm">{selectedNodo.Observaciones || 'Sin observaciones'}</p>
                    </div>
                    
                    <div className="col-span-2 flex gap-4 mt-2">
                        {selectedNodo.Atencion && <Badge variant="destructive">Requiere Mantenimiento</Badge>}
                        {selectedNodo.OtraAtencion && <Badge variant="destructive" className="bg-amber-500 hover:bg-amber-600">Requiere Otra Atención</Badge>}
                        {!selectedNodo.Atencion && selectedNodo.Atendido && <Badge variant="outline" className="text-green-700 bg-green-50 border-green-200">Mantenimiento Resuelto</Badge>}
                        {!selectedNodo.OtraAtencion && selectedNodo.OtroAtendido && <Badge variant="outline" className="text-green-700 bg-green-50 border-green-200">Otra Atención Resuelta</Badge>}
                    </div>

                    {selectedNodo.images && selectedNodo.images.length > 0 && (
                        <div className="col-span-2 mt-4">
                            <p className="text-sm font-medium text-slate-500 mb-2">Imágenes ({selectedNodo.images.length})</p>
                            <div className="grid grid-cols-3 gap-2">
                                {selectedNodo.images.map((img) => (
                                    <img 
                                        key={img.Id} 
                                        src={`http://localhost:5090${img.Url}`} 
                                        alt="Nodo" 
                                        className="w-full h-24 object-cover rounded-md cursor-pointer hover:opacity-80 transition"
                                        onClick={() => handleImageClick(img.Url)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
"""
create_modal("NodeDetailsModal.jsx", node_details_modal)

# 4. ObservationModal.jsx
observation_modal = """import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ObservationModal({ isOpen, title, observacionesUsuario, setObservacionesUsuario, onFileChange, onCancel, onConfirm, placeholder = "Ingrese los motivos..." }) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Observaciones</Label>
                        <Textarea 
                            value={observacionesUsuario}
                            onChange={(e) => setObservacionesUsuario(e.target.value)}
                            placeholder={placeholder}
                            className="h-24 resize-none"
                        />
                    </div>
                    {onFileChange && (
                        <div className="space-y-2">
                            <Label>Evidencia Fotográfica (Opcional)</Label>
                            <Input type="file" multiple onChange={onFileChange} className="cursor-pointer file:cursor-pointer" />
                        </div>
                    )}
                </div>
                <DialogFooter className="flex gap-2 sm:justify-end mt-2">
                    <Button variant="outline" onClick={onCancel}>Cancelar</Button>
                    <Button onClick={onConfirm} className="bg-imss-green hover:bg-imss-green/90 text-white">Aceptar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
"""
create_modal("ObservationModal.jsx", observation_modal)

# 5. NodeAttentionModal.jsx
attention_modal = """import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function NodeAttentionModal({ nodo, title, onClose, onSolventarParcialmente, onSolventarCompletamente, handleImageClick, showActions = True, completeActionText = "Solventar" }) {
    if (!nodo) return null;
    return (
        <Dialog open={!!nodo} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <p className="text-sm font-medium mb-2">Imágenes de Atención Registradas:</p>
                    {nodo.imagesSolventadas && nodo.imagesSolventadas.length > 0 ? (
                        <div className="grid grid-cols-3 gap-3">
                            {nodo.imagesSolventadas.map(img => (
                                <img 
                                    key={img.Id}
                                    src={`http://localhost:5090${img.Url}`}
                                    alt="Evidencia"
                                    className="w-full h-24 object-cover rounded cursor-pointer border"
                                    onClick={() => handleImageClick(img.Url)}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 italic">No hay imágenes de evidencia registradas.</p>
                    )}
                </div>
                <DialogFooter className="flex gap-2 sm:justify-end mt-4">
                    <Button variant="outline" onClick={onClose}>Cerrar</Button>
                    {showActions && (
                        <>
                            <Button variant="secondary" onClick={onSolventarParcialmente}>Solución Parcial</Button>
                            <Button className="bg-imss-green hover:bg-imss-green/90 text-white" onClick={onSolventarCompletamente}>{completeActionText}</Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
"""
create_modal("NodeAttentionModal.jsx", attention_modal)

# 6. EditNodeModal.jsx
edit_node_modal = """import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function EditNodeModal({ nodoToEdit, editFormData, unidades, handleEditFormChange, handleFileChange, handleDeleteImage, handleSaveChanges, handleCloseModal, handleOpenMaterialesModal, handleImageClick }) {
    if (!nodoToEdit) return null;
    return (
        <Dialog open={!!nodoToEdit} onOpenChange={(open) => !open && handleCloseModal()}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Editar Nodo</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                        <Label>Ubicación</Label>
                        <Input name="Ubicacion" value={editFormData.Ubicacion || ''} onChange={handleEditFormChange} />
                    </div>
                    <div className="space-y-2">
                        <Label>Unidad</Label>
                        <Select value={editFormData.Unidad || ''} onValueChange={(val) => handleEditFormChange({target: {name: 'Unidad', value: val}})}>
                            <SelectTrigger><SelectValue placeholder="Unidad" /></SelectTrigger>
                            <SelectContent>
                                {unidades.map(u => <SelectItem key={u.ref} value={u.nombre}>{u.nombre}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Puerto</Label>
                        <Input name="Puerto" value={editFormData.Puerto || ''} onChange={handleEditFormChange} />
                    </div>
                    <div className="space-y-2">
                        <Label>IP del Switch</Label>
                        <Input name="IpSwitch" value={editFormData.IpSwitch || ''} onChange={handleEditFormChange} />
                    </div>
                    <div className="space-y-2">
                        <Label>Longitud</Label>
                        <Input name="Longitud" type="number" step="0.01" value={editFormData.Longitud || ''} onChange={handleEditFormChange} />
                    </div>
                    <div className="space-y-2">
                        <Label>Nodos Faltantes</Label>
                        <Input name="Nodos_faltantes" type="number" value={editFormData.Nodos_faltantes || ''} onChange={handleEditFormChange} />
                    </div>
                    
                    <div className="col-span-2 space-y-2 mt-2">
                        <Label>Observaciones</Label>
                        <Textarea name="Observaciones" value={editFormData.Observaciones || ''} onChange={handleEditFormChange} className="h-20 resize-none" />
                    </div>
                    
                    <div className="col-span-2 flex gap-6 py-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" name="Atencion" checked={!!editFormData.Atencion} onChange={handleEditFormChange} className="h-4 w-4" />
                            <span className="text-sm font-medium">Requiere Mantenimiento</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" name="OtraAtencion" checked={!!editFormData.OtraAtencion} onChange={handleEditFormChange} className="h-4 w-4" />
                            <span className="text-sm font-medium">Requiere Otra Atención</span>
                        </label>
                    </div>
                    
                    <div className="col-span-2 py-2">
                        <Button type="button" variant="outline" onClick={handleOpenMaterialesModal}>Gestionar Materiales</Button>
                    </div>

                    <div className="col-span-2 py-2 space-y-2 border-t pt-4">
                        <Label>Agregar Nuevas Imágenes</Label>
                        <Input type="file" multiple onChange={handleFileChange} />
                    </div>

                    {editFormData.images && editFormData.images.length > 0 && (
                        <div className="col-span-2 pt-2 pb-4">
                            <Label className="mb-2 block">Imágenes Existentes</Label>
                            <div className="grid grid-cols-4 gap-2">
                                {editFormData.images.map(img => (
                                    <div key={img.Id} className="relative group">
                                        <img src={`http://localhost:5090${img.Url}`} className="w-full h-20 object-cover rounded cursor-pointer" onClick={() => handleImageClick(img.Url)} />
                                        <Button size="icon" variant="destructive" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition" onClick={() => handleDeleteImage(img.Id)}>
                                            <i className="fas fa-times text-xs"></i>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-2 mt-4 border-t pt-4">
                    <Button variant="outline" onClick={handleCloseModal}>Cancelar</Button>
                    <Button onClick={handleSaveChanges} className="bg-imss-green hover:bg-imss-green/90 text-white">Guardar Cambios</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
"""
create_modal("EditNodeModal.jsx", edit_node_modal)

# 7. NodeMaterialsModal.jsx
materials_modal = """import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NodeMaterialsModal({ showMaterialesModal, setShowMaterialesModal, filteredMaterials, handleMaterialChange, handleSaveMateriales }) {
    return (
        <Dialog open={showMaterialesModal} onOpenChange={(open) => !open && setShowMaterialesModal(false)}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Materiales del Nodo</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {filteredMaterials && filteredMaterials.length > 0 ? (
                        <div className="space-y-3">
                            {filteredMaterials.map(mat => (
                                <div key={mat.Id} className="flex items-center justify-between p-3 bg-slate-50 rounded border">
                                    <div>
                                        <p className="font-medium text-sm">{mat.Nombre}</p>
                                        <p className="text-xs text-slate-500">{mat.UnidadMedida}</p>
                                    </div>
                                    <div className="flex gap-4 items-center">
                                        <div className="space-y-1">
                                            <label className="text-xs text-slate-500 block">Necesarios</label>
                                            <Input 
                                                type="number" 
                                                className="w-20 h-8" 
                                                value={mat.Necesarios || 0} 
                                                onChange={(e) => handleMaterialChange(mat.Id, 'Necesarios', e.target.value, mat.UnidadMedida)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-slate-500 block">Utilizados</label>
                                            <Input 
                                                type="number" 
                                                className="w-20 h-8" 
                                                value={mat.Utilizados || 0} 
                                                onChange={(e) => handleMaterialChange(mat.Id, 'Utilizados', e.target.value, mat.UnidadMedida)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 text-center py-8">No hay materiales disponibles</p>
                    )}
                </div>
                <DialogFooter className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowMaterialesModal(false)}>Cancelar</Button>
                    <Button onClick={handleSaveMateriales} className="bg-imss-green hover:bg-imss-green/90 text-white">Guardar Materiales</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
"""
create_modal("NodeMaterialsModal.jsx", materials_modal)

print("Modals created successfully.")
