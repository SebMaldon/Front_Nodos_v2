const fs = require('fs');

const nodeTablePath = 'c:\\Users\\smmse\\OneDrive\\Documents\\AppsServicio\\NODOS-GIT\\Front_Nodos_v2\\src\\components\\NodeTable.jsx';
let content = fs.readFileSync(nodeTablePath, 'utf8');

// 1. Add imports at the top
const importsToAdd = `
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import NodeDetailsModal from './NodeDetailsModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import ImageModal from './ImageModal';
import EditNodeModal from './EditNodeModal';
import NodeMaterialsModal from './NodeMaterialsModal';
import NodeAttentionModal from './NodeAttentionModal';
import ObservationModal from './ObservationModal';
`;

// Insert after the last import
const importMatch = content.match(/import.*?;/g);
if (importMatch) {
    const lastImport = importMatch[importMatch.length - 1];
    content = content.replace(lastImport, lastImport + '\n' + importsToAdd);
}

// 2. Replace the return statement
const returnIndex = content.indexOf('    return ( // Renderiza la tabla con los nodos');
if (returnIndex !== -1) {
    const newReturn = `    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold tracking-tight">Nodos Registrados</h2>
                <div className="flex items-center space-x-2">
                    <Select value={filtros.tipoAtencion || ""} onValueChange={(val) => handleFiltroChange({target: {name: 'tipoAtencion', value: val}})}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Filtro de atención" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value=" ">Ninguno</SelectItem>
                            <SelectItem value="uno">Recibieron atención</SelectItem>
                            <SelectItem value="mantenimiento">Requieren mantenimiento</SelectItem>
                            <SelectItem value="otraAtencion">Requieren otro tipo de atención</SelectItem>
                            <SelectItem value="ambos">Ambos tipos</SelectItem>
                            <SelectItem value="ninguno">Sin ningún tipo</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={filtros.unidad || ""} onValueChange={(val) => handleFiltroChange({target: {name: 'unidad', value: val}})} disabled={false}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Unidad" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value=" ">Todas</SelectItem>
                            {unidades.map(u => <SelectItem key={u.ref} value={u.ref}>{u.nombre}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button onClick={fetchNewNodos} size="icon" variant="outline" className="bg-green-50 text-green-600 hover:bg-green-100 border-green-200">
                                    <i className="fas fa-sync-alt"></i>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Refrescar datos</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 items-center">
                <Button 
                    onClick={() => handleDetailsClick(datosAMostrar.find(n => n.Id === selectedRowId))} 
                    disabled={!selectedRowId}
                    variant="secondary"
                >
                    <i className="fas fa-eye mr-2"></i> Detalles
                </Button>
                
                {usuario?.role === 'administrador' && (
                    <>
                        <Button 
                            onClick={() => handleEditClick(datosAMostrar.find(n => n.Id === selectedRowId))} 
                            disabled={!selectedRowId}
                            className="bg-orange-500 hover:bg-orange-600 text-white"
                        >
                            <i className="fas fa-edit mr-2"></i> Editar
                        </Button>
                        <Button 
                            onClick={() => handleDeleteClick(datosAMostrar.find(n => n.Id === selectedRowId))} 
                            disabled={!selectedRowId}
                            variant="destructive"
                        >
                            <i className="fas fa-trash mr-2"></i> Eliminar
                        </Button>
                    </>
                )}
                
                <div className="ml-auto text-sm text-slate-500 flex space-x-4">
                    <span>Total: <span className="font-medium text-slate-900 dark:text-slate-100">{totalRegistros}</span></span>
                    <span>Faltantes: <span className="font-medium text-slate-900 dark:text-slate-100">{totalFaltantes || '0'}</span></span>
                    <span>Atendidos: <span className="font-medium text-slate-900 dark:text-slate-100">{totalAtendidos || '0'}</span></span>
                </div>
            </div>

            {/* Table */}
            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                            <TableHead>Ubicación</TableHead>
                            <TableHead>Unidad</TableHead>
                            <TableHead className="text-center">Puerto</TableHead>
                            <TableHead className="text-center">IP del Switch</TableHead>
                            <TableHead>Observaciones</TableHead>
                            <TableHead className="text-center">Faltantes</TableHead>
                            <TableHead className="text-center">M</TableHead>
                            <TableHead className="text-center">OA</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {datosAMostrar.map((nodoData, index) => {
                            const isSelected = selectedRowId === nodoData.Id;
                            const hasImages = nodoData.TieneImagenes;
                            
                            return (
                                <TableRow 
                                    key={nodoData.Id}
                                    onClick={() => setSelectedRowId(nodoData.Id)}
                                    className={\`cursor-pointer transition-colors \${
                                        isSelected ? 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30' : 
                                        (!hasImages ? 'bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20' : '')
                                    }\`}
                                >
                                    <TableCell className="font-medium">{nodoData.Ubicacion}</TableCell>
                                    <TableCell>{nodoData.Unidad}</TableCell>
                                    <TableCell className="text-center">{nodoData.Puerto}</TableCell>
                                    <TableCell className="text-center">{nodoData.IpSwitch}</TableCell>
                                    <TableCell className="max-w-[200px] truncate">{nodoData.Observaciones}</TableCell>
                                    <TableCell className="text-center">{nodoData.Nodos_faltantes || '0'}</TableCell>
                                    <TableCell 
                                        className="text-center cursor-pointer" 
                                        onClick={(e) => { e.stopPropagation(); handleAtencionClick(nodoData); }}
                                    >
                                        <span className="text-lg">{nodoData.Atencion ? '⚠️' : (nodoData.Atendido ? '✅' : '')}</span>
                                    </TableCell>
                                    <TableCell 
                                        className="text-center cursor-pointer" 
                                        onClick={(e) => { e.stopPropagation(); handleOtherAtencionClick(nodoData); }}
                                    >
                                        <span className="text-lg">{nodoData.OtraAtencion ? '🔴' : (nodoData.OtroAtendido ? '🟢' : '')}</span>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4 mt-2">
                <div className="text-sm text-slate-500">
                    Página {pageNode + 1} de {Math.max(1, Math.ceil(totalRegistros / rowsPerPageNode))}
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-500">Nodos por página:</span>
                    <select 
                        className="border rounded p-1 text-sm bg-white dark:bg-slate-900 dark:border-slate-700"
                        value={rowsPerPageNode}
                        onChange={(e) => {
                            setRowsPerPageNode(parseInt(e.target.value, 10));
                            setPageNode(0);
                        }}
                    >
                        {[5, 10, 25, 50].map(val => (
                            <option key={val} value={val}>{val}</option>
                        ))}
                    </select>
                </div>
                <div className="flex space-x-2">
                    <Button 
                        variant="outline" 
                        size="sm"
                        disabled={pageNode === 0}
                        onClick={() => setPageNode(prev => prev - 1)}
                    >
                        Anterior
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm"
                        disabled={(pageNode + 1) * rowsPerPageNode >= totalRegistros}
                        onClick={() => setPageNode(prev => prev + 1)}
                    >
                        Siguiente
                    </Button>
                </div>
            </div>

            {/* MODALS */}
            <NodeDetailsModal 
                selectedNodo={selectedNodo} 
                onClose={handleCloseModal} 
                handleImageClick={handleImageClick} 
            />

            <ConfirmDeleteModal 
                nodoToDelete={nodoToDelete} 
                onClose={handleCloseModal} 
                onConfirm={handleConfirmDelete} 
            />

            <ImageModal 
                selectedImage={selectedImage} 
                onClose={() => setSelectedImage(null)} 
            />

            <EditNodeModal 
                nodoToEdit={nodoToEdit}
                editFormData={editFormData}
                unidades={unidades}
                handleEditFormChange={handleEditFormChange}
                handleFileChange={handleFileChange}
                handleDeleteImage={handleDeleteImage}
                handleSaveChanges={handleSaveChanges}
                handleCloseModal={handleCloseModal}
                handleOpenMaterialesModal={handleOpenMaterialesModal}
                handleImageClick={handleImageClick}
            />

            <NodeMaterialsModal 
                showMaterialesModal={showMaterialesModal}
                nodoToEdit={nodoToEdit}
                setShowMaterialesModal={setShowMaterialesModal}
                pagination={pagination}
                setPagination={setPagination}
                filteredMaterials={filteredMaterials}
                paginatedMaterials={paginatedMaterials}
                handleMaterialChange={handleMaterialChange}
                handleSaveMateriales={handleSaveMateriales}
            />

            {/* Attention Modals */}
            <NodeAttentionModal 
                nodo={selectedAtencionNodo}
                title="¿Estás seguro de que este nodo ya no requiere mantenimiento?"
                onClose={handleCloseModal}
                onSolventarParcialmente={handleParcialAtencion}
                onSolventarCompletamente={handleDeleteAtencion}
                handleImageClick={handleImageClick}
                completeActionText="Ya no requiere mantenimiento"
            />

            <NodeAttentionModal 
                nodo={selectedSinAtencionNodo}
                title="Este nodo no requiere mantenimiento"
                onClose={handleCloseModal}
                handleImageClick={handleImageClick}
                showActions={false}
            />

            <NodeAttentionModal 
                nodo={selectedOtherAtencionNodo}
                title="¿Estás seguro de que este nodo ya no requiere de otra atención?"
                onClose={handleCloseModal}
                onSolventarParcialmente={handleParcialOtherAtencion}
                onSolventarCompletamente={handleDeleteOtherAtencion}
                handleImageClick={handleImageClick}
                completeActionText="Ya no requiere atención"
                historialLabel="Historial de otras atenciones"
            />

            <NodeAttentionModal 
                nodo={selectedSinOtherAtencionNodo}
                title="Este nodo no requiere otras atenciones"
                onClose={handleCloseModal}
                handleImageClick={handleImageClick}
                showActions={false}
                historialLabel="Historial de otras atenciones"
            />

            {/* Observation Modals */}
            <ObservationModal 
                isOpen={showObservacionesModal}
                title="Motivos del cambio del estado"
                observacionesUsuario={observacionesUsuario}
                setObservacionesUsuario={setObservacionesUsuario}
                onFileChange={(e) => {
                    const files = Array.from(e.target.files);
                    const uniqueFiles = files.reduce((acc, file) => {
                        const isDuplicate = acc.some(f => f.name === file.name && f.size === file.size);
                        if (!isDuplicate) acc.push(file);
                        return acc;
                    }, []);
                    setNewImageFilesAtencion(uniqueFiles);
                }}
                onCancel={() => {
                    setEditFormData(prev => ({
                        ...prev,
                        [campoCambiado]: !prev[campoCambiado],
                    }));
                    setShowObservacionesModal(false);
                }}
                onConfirm={async () => {
                    const formData = new FormData();
                    formData.append('Ubicacion', editFormData.Ubicacion);
                    formData.append('Unidad', editFormData.Unidad);
                    formData.append('atencion', editFormData.Atencion ? 1 : 0);
                    formData.append('otraAtencion', editFormData.OtraAtencion ? 1 : 0);
                    formData.append('observacionesUsuario', observacionesUsuario);
                    formData.append('esAtencionParcialMante', false);
                    formData.append('esAtencionParcialOtro', false);
                    newImageFilesAtencion.forEach((file) => formData.append('newImagesAtencion', file));

                    try {
                        await axios.put(\`\${API_URL}/api/nodos/updateAtencion/\${nodoToEdit.Id}\`, formData, {
                            headers: { 'Content-Type': 'multipart/form-data' },
                        });
                        setNewImageFilesAtencion([]);
                        setShowObservacionesModal(false);
                    } catch (error) {
                        console.error('Error al guardar los cambios:', error);
                        alert('Error al guardar los cambios');
                    }
                }}
            />

            <ObservationModal 
                isOpen={showObservacionesModalTable}
                title="Motivos del cambio"
                observacionesUsuario={observacionesUsuario}
                setObservacionesUsuario={setObservacionesUsuario}
                onFileChange={handleFileChange}
                onCancel={() => setShowObservacionesModalTable(false)}
                onConfirm={async () => {
                    const formData = new FormData();
                    formData.append('esAtencionParcialMante', false);
                    formData.append('esAtencionParcialOtro', false);
                    
                    const nodoReferencia = tipoAtencion === 'Atencion' ? selectedAtencionNodo : selectedOtherAtencionNodo;
                    formData.append('Ubicacion', nodoReferencia.Ubicacion);
                    formData.append('Unidad', nodoReferencia.Unidad);
                    formData.append('observacionesUsuario', observacionesUsuario);
                    newImageFiles.forEach((file) => formData.append('newImages', file));

                    const endpoint = tipoAtencion === 'Atencion'
                        ? \`\${API_URL}/api/nodos/atencion/\${nodoReferencia.Id}\`
                        : \`\${API_URL}/api/nodos/otraAtencion/\${nodoReferencia.Id}\`;

                    try {
                        await axios.put(endpoint, formData, {
                            headers: { 'Content-Type': 'multipart/form-data' },
                        });
                        alert(\`\${tipoAtencion === 'Atencion' ? 'Mantenimiento' : 'Otra atención'} eliminada\`);
                        setNewImageFiles([]);
                        handleCloseModal();
                        fetchNewNodos();
                    } catch (error) {
                        console.error(\`Error al eliminar \${tipoAtencion}:\`, error);
                        alert(\`Error al eliminar \${tipoAtencion === 'Atencion' ? 'el mantenimiento' : 'otra atención'}\`);
                    }
                }}
            />

            <ObservationModal 
                isOpen={showObservacionesModalParcialTable}
                title="Solventado Parcialmente"
                placeholder="Ingrese los cambios solventados en el nodo..."
                observacionesUsuario={observacionesUsuario}
                setObservacionesUsuario={setObservacionesUsuario}
                onFileChange={handleFileChange}
                onCancel={() => setShowObservacionesModalParcialTable(false)}
                onConfirm={async () => {
                    const formData = new FormData();
                    const nodoReferencia = tipoAtencion === 'Atencion' ? selectedAtencionNodo : selectedOtherAtencionNodo;
                    
                    formData.append('Ubicacion', nodoReferencia.Ubicacion);
                    formData.append('Unidad', nodoReferencia.Unidad);
                    formData.append('observacionesUsuario', observacionesUsuario);
                    newImageFiles.forEach((file) => formData.append('newImagesAtencion', file));
                    
                    if (tipoAtencion === 'Atencion') {
                        formData.append('atencion', 1);
                        formData.append('otraAtencion', nodoReferencia.OtraAtencion ? 1 : 0);
                        formData.append('esAtencionParcialMante', true);
                        formData.append('esAtencionParcialOtro', false);
                    } else {
                        formData.append('atencion', nodoReferencia.Atencion ? 1 : 0);
                        formData.append('otraAtencion', 1);
                        formData.append('esAtencionParcialMante', false);
                        formData.append('esAtencionParcialOtro', true);
                    }

                    try {
                        await axios.put(\`\${API_URL}/api/nodos/updateAtencion/\${nodoReferencia.Id}\`, formData, {
                            headers: { 'Content-Type': 'multipart/form-data' },
                        });
                        alert(\`\${tipoAtencion === 'Atencion' ? 'Mantenimiento parcialmente solucionado' : 'Otra atención parcialmente solucionada'}\`);
                        setNewImageFiles([]);
                        fetchNewNodos();
                        handleCloseModal();
                    } catch (error) {
                        console.error(\`Error al solventar parcialmente:\`, error);
                        alert(\`Error al solventar parcialmente\`);
                    }
                }}
            />

        </div>
    );
};
export default NodeTable;
`;
    content = content.substring(0, returnIndex) + newReturn;
}

fs.writeFileSync(nodeTablePath, content);
console.log("Updated NodeTable.jsx successfully!");
