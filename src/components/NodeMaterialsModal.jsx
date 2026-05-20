import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
