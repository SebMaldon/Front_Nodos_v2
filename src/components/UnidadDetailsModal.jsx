import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function UnidadDetailsModal({ selectedUnidad, onClose }) {
    if (!selectedUnidad) return null;

    const ENLACE_MAP = {
        1: 'Fibra Óptica',
        2: 'Cobre',
        3: 'Satelital',
        4: 'Punto a punto',
        5: 'Otro'
    };
    
    return (
        <Dialog open={!!selectedUnidad} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white p-8 rounded-xl border border-slate-200 shadow-xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-800 border-b pb-4 mb-4">
                        <i className="fas fa-building text-emerald-600"></i> Detalles de la Unidad
                    </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6 mt-2">
                    {/* Sección: Información General */}
                    <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-200/60 space-y-4">
                        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 border-b border-slate-200/50 pb-2">
                            <i className="fas fa-info-circle text-emerald-600"></i> Información General
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Referencia</p>
                                <p className="font-bold text-slate-800 text-base">{selectedUnidad.ref}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nombre</p>
                                <p className="font-bold text-slate-800 text-base">{selectedUnidad.nombre}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tipo de Unidad</p>
                                <p className="font-bold text-slate-800 text-base">{selectedUnidad.tipo_unidad || 'No especificado'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Zona</p>
                                <p className="font-bold text-slate-800 text-base">{selectedUnidad.zona !== null ? selectedUnidad.zona : 'No especificada'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Sección: Red e IP */}
                    <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-200/60 space-y-4">
                        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 border-b border-slate-200/50 pb-2">
                            <i className="fas fa-network-wired text-emerald-600"></i> Parámetros de Red
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">IP Segmento</p>
                                <p className="font-mono font-bold text-slate-800 text-base">{selectedUnidad.ip || 'No especificada'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">IP Inicial</p>
                                <p className="font-mono font-bold text-slate-800 text-base">{selectedUnidad.ipinit || 'No especificada'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">VLAN</p>
                                <p className="font-bold text-slate-800 text-base">{selectedUnidad.vlan !== null ? selectedUnidad.vlan : 'No especificada'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Sección: Enlace y Proveedor */}
                    <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-200/60 space-y-4">
                        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 border-b border-slate-200/50 pb-2">
                            <i className="fas fa-wifi text-emerald-600"></i> Conectividad y Proveedor
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Proveedor</p>
                                <p className="font-bold text-slate-800">{selectedUnidad.proveedor || 'No especificado'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tipo de Enlace</p>
                                <p className="font-bold text-slate-800">{ENLACE_MAP[selectedUnidad.tipo_enlace] || selectedUnidad.tipo_enlace || 'No especificado'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Velocidad</p>
                                <p className="font-bold text-slate-800">{selectedUnidad.velocidad || 'No especificada'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bits</p>
                                <p className="font-bold text-slate-800">{selectedUnidad.bits !== null ? selectedUnidad.bits : 'No especificado'}</p>
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fecha de Migración</p>
                                <p className="font-bold text-slate-800">{selectedUnidad.fecha_migracion || 'No especificada'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
