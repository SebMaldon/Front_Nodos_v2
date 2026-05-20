import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
