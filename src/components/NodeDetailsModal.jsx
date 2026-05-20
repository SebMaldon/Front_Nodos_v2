import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function NodeDetailsModal({ selectedNodo, onClose, handleImageClick }) {
    if (!selectedNodo) return null;
    
    return (
        <Dialog open={!!selectedNodo} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white p-8 rounded-xl border border-slate-200 shadow-xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-800 border-b pb-4 mb-4">
                        <i className="fas fa-info-circle text-emerald-600"></i> Detalles del Nodo
                    </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6 mt-2">
                    {/* Sección: Información General */}
                    <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-200/60 space-y-4">
                        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 border-b border-slate-200/50 pb-2">
                            <i className="fas fa-map-marker-alt text-emerald-600"></i> Ubicación y Unidad
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ubicación</p>
                                <p className="font-bold text-slate-800 text-base">{selectedNodo.Ubicacion}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Unidad</p>
                                <p className="font-bold text-slate-800 text-base">{selectedNodo.Unidad}</p>
                            </div>
                        </div>
                    </div>

                    {/* Sección: Red e IP */}
                    <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-200/60 space-y-4">
                        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 border-b border-slate-200/50 pb-2">
                            <i className="fas fa-network-wired text-emerald-600"></i> Red e IP del Switch
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">IP del Switch</p>
                                <p className="font-mono font-bold text-slate-800 text-base">{selectedNodo.IpSwitch}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Puerto</p>
                                <p className="font-mono font-bold text-slate-800 text-base">{selectedNodo.Puerto}</p>
                            </div>
                        </div>
                    </div>

                    {/* Sección: Especificaciones del Cable */}
                    <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-200/60 space-y-4">
                        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 border-b border-slate-200/50 pb-2">
                            <i className="fas fa-ethernet text-emerald-600"></i> Especificaciones Físicas
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Longitud</p>
                                <p className="font-bold text-slate-800">{selectedNodo.Longitud ? `${selectedNodo.Longitud} m` : 'No especificada'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Categoría de Cable</p>
                                <p className="font-bold text-slate-800">{selectedNodo.CategoriaCable || 'No especificada'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nodos Faltantes</p>
                                <p className="font-bold text-slate-800">{selectedNodo.Nodos_faltantes ?? 0}</p>
                            </div>
                        </div>
                    </div>

                    {/* Sección: Observaciones */}
                    <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-200/60 space-y-3">
                        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 border-b border-slate-200/50 pb-2">
                            <i className="fas fa-comment-alt text-emerald-600"></i> Observaciones
                        </h3>
                        <div className="bg-white p-4 rounded-lg border border-slate-200 text-slate-700 text-sm leading-relaxed min-h-[50px]">
                            {selectedNodo.Observaciones || <span className="text-slate-400 italic">Sin observaciones</span>}
                        </div>
                    </div>

                    {/* Sección: Estatus y Reportes */}
                    <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-200/60 space-y-4">
                        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 border-b border-slate-200/50 pb-2">
                            <i className="fas fa-tasks text-emerald-600"></i> Estado de Atención
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {selectedNodo.Atencion ? (
                                <Badge variant="destructive" className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200 text-xs px-2.5 py-1 rounded-full font-medium">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 mr-1.5 animate-pulse"></span>
                                    Req. Mantenimiento
                                </Badge>
                            ) : selectedNodo.Atendido ? (
                                <Badge variant="outline" className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 text-xs px-2.5 py-1 rounded-full font-medium">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5"></span>
                                    Manto. Resuelto
                                </Badge>
                            ) : null}

                            {selectedNodo.OtraAtencion ? (
                                <Badge variant="destructive" className="bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 text-xs px-2.5 py-1 rounded-full font-medium">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mr-1.5 animate-pulse"></span>
                                    Req. Otra Atención
                                </Badge>
                            ) : selectedNodo.OtroAtendido ? (
                                <Badge variant="outline" className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 text-xs px-2.5 py-1 rounded-full font-medium">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5"></span>
                                    Atención Resuelta
                                </Badge>
                            ) : null}

                            {!selectedNodo.Atencion && !selectedNodo.Atendido && !selectedNodo.OtraAtencion && !selectedNodo.OtroAtendido && (
                                <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 text-xs px-2.5 py-1 rounded-full font-medium">
                                    Activo / Sin Reporte
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Sección: Evidencia Fotográfica */}
                    {selectedNodo.images && selectedNodo.images.length > 0 && (
                        <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-200/60 space-y-4">
                            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 border-b border-slate-200/50 pb-2">
                                <i className="fas fa-camera text-emerald-600"></i> Evidencia Fotográfica ({selectedNodo.images.length})
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {selectedNodo.images.map((img) => (
                                    <div key={img.Id} className="relative group rounded-lg overflow-hidden border border-slate-200 bg-white shadow-2xs">
                                        <img 
                                            src={`${import.meta.env.VITE_API_URL || 'http://localhost:5090'}${img.ImagenURL}`} 
                                            alt="Evidencia del Nodo" 
                                            className="w-full h-24 object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                                            onClick={() => handleImageClick(img.ImagenURL)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
