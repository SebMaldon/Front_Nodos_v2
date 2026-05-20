import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function NodeAttentionModal({ nodo, title, onClose, onSolventarParcialmente, onSolventarCompletamente, handleImageClick, showActions = true, completeActionText = "Solventar" }) {
    if (!nodo) return null;
    return (
        <Dialog open={!!nodo} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white p-8 rounded-xl border border-slate-200 shadow-xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-800 border-b pb-4 mb-4">
                        <i className="fas fa-check-circle text-emerald-600"></i> {title}
                    </DialogTitle>
                </DialogHeader>
                <div className="py-2 space-y-4">
                    <p className="text-sm font-semibold text-slate-700">Imágenes de Atención Registradas:</p>
                    {nodo.imagesSolventadas && nodo.imagesSolventadas.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50/50 p-4 rounded-xl border border-slate-200/60">
                            {nodo.imagesSolventadas.map(img => (
                                <div key={img.Id} className="relative group rounded-lg overflow-hidden border border-slate-200 bg-white shadow-2xs">
                                    <img 
                                        src={`${import.meta.env.VITE_API_URL || 'http://localhost:5090'}${img.ImagenURL}`}
                                        alt="Evidencia Solventada"
                                        className="w-full h-24 object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                                        onClick={() => handleImageClick(img.ImagenURL)}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 border-dashed text-center">
                            <i className="fas fa-image text-slate-300 text-3xl mb-2 block"></i>
                            <p className="text-sm text-slate-400 italic">No hay imágenes de evidencia registradas.</p>
                        </div>
                    )}
                </div>
                <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end mt-6 border-t border-slate-200 pt-6">
                    <Button 
                        variant="outline" 
                        onClick={onClose}
                        className="h-10 px-5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg font-medium"
                    >
                        Cerrar
                    </Button>
                    {showActions && (
                        <>
                            <Button 
                                variant="secondary" 
                                onClick={onSolventarParcialmente}
                                className="h-10 px-5 bg-slate-100 text-slate-700 hover:bg-slate-200 border-none font-medium rounded-lg"
                            >
                                Solución Parcial
                            </Button>
                            <Button 
                                onClick={onSolventarCompletamente}
                                className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-sm transition-all"
                            >
                                {completeActionText}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
