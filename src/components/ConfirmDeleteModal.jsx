import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
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
