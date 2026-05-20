import re

with open('src/components/NodeFrom.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace VITE_API_URL
content = content.replace("import.meta.env.VITE_API_URL", "'http://localhost:5090'")

# Replace MUI imports
content = re.sub(
    r"import \{ Button, Tooltip, TextField, ListItemText, ListItem, List, Select, MenuItem \} from '@mui/material';",
    """import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";""",
    content
)

# Remove the renderCantidadInput function which is no longer needed
render_cantidad_start = content.find('    // Modificar el TextField de cantidad para que cambie según la unidad\n    const renderCantidadInput = () => {')
if render_cantidad_start != -1:
    render_cantidad_end = content.find('    };\n', render_cantidad_start) + 7
    content = content[:render_cantidad_start] + content[render_cantidad_end:]

# Now find the main render block
render_start_str = '    return (\n        <>\n            <form onSubmit={handleSubmit}>'
render_start = content.find(render_start_str)

if render_start == -1:
    print("Could not find render start")
    exit(1)

render_end = content.rfind('    );\n};\n\nexport default NodeFrom;')

if render_end == -1:
    print("Could not find render end")
    exit(1)

# Define the new render function (Using the Shadcn layout previously generated)
new_render = """    return (
        <Card className="w-full max-w-4xl mx-auto mt-6 border-none shadow-sm bg-white dark:bg-slate-950">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <CardTitle className="text-2xl font-bold">Registrar Nuevo Nodo</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Unidad:</Label>
                        <div className="flex gap-2 items-center">
                            <Select
                                value={formData.Unidad || ''}
                                onValueChange={(value) => handleChange({ target: { name: 'Unidad', value, type: 'text' } })}
                                disabled={!!(user?.id_unidad && user.id_unidad !== 0)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Seleccione una unidad" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(!user?.id_unidad || user.id_unidad === 0) && (
                                        <SelectItem value=" ">Seleccione una unidad</SelectItem>
                                    )}
                                    {unidades.map((unidad) => (
                                        <SelectItem key={unidad.nombre} value={unidad.nombre}>
                                            {unidad.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button type="button" variant="outline" size="sm" onClick={() => setShowUnidadesModal(true)}>
                                Gestionar
                            </Button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Ubicación:</Label>
                        <Input
                            name="Ubicacion"
                            value={formData.Ubicacion}
                            onChange={handleChange}
                            placeholder="Ingresa la ubicación del nodo"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>IP del Switch:</Label>
                        <Input
                            name="IpSwitch"
                            value={formData.IpSwitch}
                            onChange={handleChange}
                            required
                            placeholder="Ingresa la dirección IP del Switch"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Puerto:</Label>
                        <Input
                            name="Puerto"
                            value={formData.Puerto}
                            onChange={handleChange}
                            required
                            placeholder="Ingresa el puerto al que esta conectado el cable"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Longitud:</Label>
                        <Input
                            name="Longitud"
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.Longitud || '0'}
                            onChange={handleChange}
                            placeholder="Ingresa la longitud de su cable"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Área:</Label>
                        <Input
                            name="Area"
                            value={formData.Area}
                            onChange={handleChange}
                            placeholder="Ingresa el área del nodo"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Categoría del Cable:</Label>
                        <Select
                            value={formData.CategoriaCable || ''}
                            onValueChange={(value) => handleChange({ target: { name: 'CategoriaCable', value, type: 'text' } })}
                            required
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccione una categoría" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Sin categoría">Seleccione una categoría</SelectItem>
                                <SelectItem value="5">Categoría 5</SelectItem>
                                <SelectItem value="5e">Categoría 5e</SelectItem>
                                <SelectItem value="6">Categoría 6</SelectItem>
                                <SelectItem value="6A">Categoría 6A</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Año de Instalación:</Label>
                        <Input
                            name="AnioInstalacion"
                            type="number"
                            min="0"
                            max={new Date().getFullYear().toString()}
                            value={formData.AnioInstalacion || '0'}
                            onChange={handleChange}
                            placeholder="Ingresa el año de instalación del nodo"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Estado del Cable:</Label>
                        <Select
                            value={formData.EstadoCable || ''}
                            onValueChange={(value) => handleChange({ target: { name: 'EstadoCable', value, type: 'text' } })}
                            required
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccione un estado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Sin estado">Seleccione un estado</SelectItem>
                                <SelectItem value="Bueno">Bueno</SelectItem>
                                <SelectItem value="Regular">Regular</SelectItem>
                                <SelectItem value="Malo">Malo</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Nodos faltantes:</Label>
                        <Input
                            name="Nodos_faltantes"
                            type="number"
                            min="0"
                            max="99999"
                            value={formData.Nodos_faltantes || '0'}
                            onChange={handleChange}
                            required
                            placeholder="Ingresa el número de nodos faltantes"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Observaciones:</Label>
                    <Textarea
                        name="Observaciones"
                        value={formData.Observaciones}
                        onChange={handleChange}
                        onBlur={handleObservacionesBlur}
                        className="resize-none h-20"
                        placeholder="Ingresa las observaciones del nodo"
                    />
                </div>

                <div className="flex flex-wrap gap-6 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            name="Atencion"
                            checked={formData.Atencion}
                            onChange={(e) => handleChange({ target: { name: 'Atencion', value: e.target.checked, type: 'checkbox', checked: e.target.checked } })}
                            className="h-5 w-5 rounded border-gray-300 text-imss-green focus:ring-imss-green transition-colors"
                        />
                        <span className="text-sm font-medium">Requiere mantenimiento</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            name="OtraAtencion"
                            checked={formData.OtraAtencion}
                            onChange={(e) => handleChange({ target: { name: 'OtraAtencion', value: e.target.checked, type: 'checkbox', checked: e.target.checked } })}
                            className="h-5 w-5 rounded border-gray-300 text-imss-green focus:ring-imss-green transition-colors"
                        />
                        <span className="text-sm font-medium">Requiere otro tipo de atención</span>
                    </label>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="border-imss-green text-imss-green hover:bg-imss-green/10"
                                    onClick={() => setShowMaterialesModal(true)}
                                >
                                    Agregar materiales necesarios
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Registrar materiales para el nodo</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {materialesSeleccionados.length > 0 && (
                        <div className="mt-4 p-4 border rounded-md bg-slate-50 dark:bg-slate-800/50">
                            <h4 className="font-semibold mb-2">Materiales a solicitar:</h4>
                            <ul className="space-y-2">
                                {materialesSeleccionados.map(material => (
                                    <li key={material.id} className="flex justify-between items-center p-2 bg-white dark:bg-slate-900 rounded border shadow-sm">
                                        <div>
                                            <p className="font-medium">{material.nombre}</p>
                                            <p className="text-sm text-slate-500">{material.cantidad} {material.unidad}</p>
                                        </div>
                                        <Button type="button" variant="destructive" size="sm" onClick={() => eliminarMaterial(material.id)}>
                                            Eliminar
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <Label>Imágenes:</Label>
                    <Input
                        type="file"
                        name="images"
                        multiple
                        onChange={handleFileChange}
                        className="cursor-pointer file:cursor-pointer"
                    />
                    {!EstaVacio(imageFiles) && (
                        <div className="mt-2">
                            <h4 className="font-medium text-sm mb-1">Imágenes Seleccionadas:</h4>
                            <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-400">
                                {imageFiles.map((file, index) => (
                                    <li key={index}>{file.name}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="pt-6 flex justify-end">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-imss-green hover:bg-imss-green/90 text-white shadow-md">
                                    <i className="fas fa-save mr-2"></i> Registrar Nodo
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Registrar nuevo nodo en el sistema</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                
                {/* Modales incrustados temporales */}
                {showObservacionesDestinoModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/70 fade-in" onClick={() => {
                            setShowObservacionesDestinoModal(false);
                            setFormData({...formData, Observaciones: observacionAnterior});
                        }}>
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden scale-in" onClick={(e) => e.stopPropagation()}>
                            <div className="p-6 bg-slate-50 border-b">
                                <h3 className="text-lg font-bold">¿A qué tipo de atención corresponde esta observación?</h3>
                            </div>
                            <div className="p-6">
                                <p className="text-slate-600 mb-6 p-3 bg-slate-100 rounded-lg border">{observacionesUsuario}</p>
                                <div className="flex flex-col gap-3 mb-6">
                                    <Button variant="outline" className="border-blue-200 hover:bg-blue-50" onClick={() => handleObservacionDestino('mantenimiento')}>Solo mantenimiento</Button>
                                    <Button variant="outline" className="border-amber-200 hover:bg-amber-50" onClick={() => handleObservacionDestino('otro')}>Solo otro tipo de atención</Button>
                                    <Button variant="outline" className="border-purple-200 hover:bg-purple-50" onClick={() => handleObservacionDestino('ambos')}>Ambos tipos de atención</Button>
                                </div>
                                <div className="flex justify-end">
                                    <Button variant="ghost" onClick={() => {
                                        setShowObservacionesDestinoModal(false);
                                        setFormData({...formData, Observaciones: observacionAnterior});
                                    }}>Cancelar</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showObservacionesModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/70 fade-in" onClick={() => {
                            setFormData((prev) => ({...prev, [campoCambiado]: false}));
                            setShowObservacionesModal(false);
                            setObservacionesUsuario('');
                        }}>
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden scale-in" onClick={(e) => e.stopPropagation()}>
                            <div className="p-6 bg-slate-50 border-b">
                                <h3 className="text-lg font-bold">Observaciones adicionales</h3>
                            </div>
                            <div className="p-6">
                                <Textarea
                                    placeholder="Ingrese las observaciones del cambio..."
                                    value={observacionesUsuario}
                                    onChange={(e) => setObservacionesUsuario(e.target.value)}
                                    className="mb-6 h-32"
                                />
                                <div className="flex gap-3 justify-end">
                                    <Button variant="outline" onClick={() => {
                                        setFormData((prev) => ({...prev, [campoCambiado]: false}));
                                        setShowObservacionesModal(false);
                                        setObservacionesUsuario('');
                                    }}>Cancelar</Button>
                                    <Button onClick={() => {
                                        if (campoCambiado === 'Atencion') {
                                            setFormData({...formData, ObservacionesUsuarioAtencion: observacionesUsuario});
                                        } else if (campoCambiado === 'OtraAtencion') {
                                            setFormData({...formData, ObservacionesUsuarioOtraAtencion: observacionesUsuario});
                                        }
                                        setShowObservacionesModal(false);
                                        setObservacionesUsuario('');
                                    }}>Aceptar</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showMaterialesModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/70 fade-in" onClick={() => setShowMaterialesModal(false)}>
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden scale-in" onClick={(e) => e.stopPropagation()}>
                            <div className="p-6 bg-slate-50 border-b">
                                <h3 className="text-lg font-bold">Agregar Materiales Necesarios</h3>
                            </div>
                            <div className="p-6">
                                <div className="flex gap-2 items-end mb-6">
                                    <div className="flex-1 space-y-2">
                                        <Label>Material</Label>
                                        <Select value={materialActual.id} onValueChange={(value) => handleMaterialChange({target: {value}})}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccione un material" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value=" ">Seleccione un material</SelectItem>
                                                {materiales.map(material => (
                                                    <SelectItem key={material.Id} value={material.Id}>
                                                        {material.Nombre} ({material.UnidadMedida})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="w-24 space-y-2">
                                        <Label>Cantidad</Label>
                                        <Input
                                            type="number"
                                            value={materialActual.cantidad}
                                            onChange={(e) => handleCantidadChange({target: {value: e.target.value}})}
                                        />
                                    </div>
                                    <Button type="button" onClick={agregarMaterial} disabled={!materialActual.id} className="bg-blue-600 hover:bg-blue-700">Agregar</Button>
                                </div>
                                
                                <div className="max-h-60 overflow-y-auto mb-6 bg-slate-50 rounded-lg p-2 border">
                                    {materialesSeleccionados.length === 0 ? (
                                        <p className="text-center text-slate-500 py-4 text-sm">No hay materiales seleccionados</p>
                                    ) : (
                                        <ul className="space-y-2">
                                            {materialesSeleccionados.map(material => (
                                                <li key={material.id} className="flex justify-between items-center p-3 border bg-white rounded shadow-sm">
                                                    <div>
                                                        <p className="font-medium text-sm">{material.nombre}</p>
                                                        <p className="text-xs text-slate-500">{material.cantidad} {material.unidad}</p>
                                                    </div>
                                                    <Button type="button" variant="destructive" size="sm" onClick={() => eliminarMaterial(material.id)}>
                                                        <i className="fas fa-trash"></i>
                                                    </Button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <Button variant="outline" onClick={() => {
                                        setMaterialesSeleccionados([]);
                                        setShowMaterialesModal(false);
                                    }}>Cancelar</Button>
                                    <Button type="button" onClick={() => setShowMaterialesModal(false)} className="bg-imss-green hover:bg-imss-green/90 text-white">Guardar Selección</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </form>
            </CardContent>
        </Card>
        <UnidadesModal
            open={showUnidadesModal}
            onClose={() => setShowUnidadesModal(false)}
            onUnidadesChange={fetchUnidades}
        />
    );"""

content = content[:render_start] + new_render + '\n};\n\nexport default NodeFrom;\n'

with open('src/components/NodeFrom.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully replaced NodeFrom render method.")
