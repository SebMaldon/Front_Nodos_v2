import { Dialog, DialogContent } from "@/components/ui/dialog";

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
