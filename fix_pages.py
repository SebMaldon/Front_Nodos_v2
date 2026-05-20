import re

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add Shadcn imports
    content = re.sub(
        r"import \{ Button, Tooltip, TablePagination \} from '@mui/material';\n",
        """import { Button } from "@/components/ui/button";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";\n""",
        content
    )
    
    # Custom Tooltip wrapper to preserve API
    custom_tooltip = """
const CustomTooltip = ({ title, children }) => (
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>{children}</TooltipTrigger>
            <TooltipContent><p>{title}</p></TooltipContent>
        </Tooltip>
    </TooltipProvider>
);
"""
    # Replace `<Tooltip` with `<CustomTooltip` and `</Tooltip>` with `</CustomTooltip>`
    content = content.replace('<Tooltip', '<CustomTooltip')
    content = content.replace('</Tooltip>', '</CustomTooltip>')
    
    # Insert CustomTooltip definition before the component export
    func_def = re.search(r'const [A-Za-z0-9_]+ = \([^)]*\) => {', content)
    if func_def:
        content = content[:func_def.start()] + custom_tooltip + content[func_def.start():]

    pagination_ui = """
                        <div className="flex items-center justify-between px-2 py-4 border-t w-full">
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <span>Filas por página:</span>
                                <select 
                                    className="border rounded p-1 bg-white"
                                    value={limit}
                                    onChange={(e) => {
                                        setLimit(parseInt(e.target.value, 10));
                                        setPage(0);
                                    }}
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                                <span className="text-slate-500">
                                    {page * limit + 1}-{Math.min((page + 1) * limit, total)} de {total}
                                </span>
                                <div className="flex gap-1">
                                    <button 
                                        type="button"
                                        onClick={() => setPage(p => Math.max(0, p - 1))}
                                        disabled={page === 0}
                                        className="p-1 rounded border hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <i className="fas fa-chevron-left text-xs"></i>
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setPage(p => Math.min(Math.ceil(total / limit) - 1, p + 1))}
                                        disabled={(page + 1) * limit >= total}
                                        className="p-1 rounded border hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <i className="fas fa-chevron-right text-xs"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
"""
    content = re.sub(r'<TablePagination[^>]*/>', pagination_ui, content, flags=re.DOTALL)

    # Convert MUI Button variants
    content = content.replace('variant="contained"', 'className="bg-imss-green hover:bg-imss-green/90 text-white"')
    content = content.replace('variant="outlined"', 'variant="outline"')

    # Fix VITE_API_URL if needed
    content = content.replace("import.meta.env.VITE_API_URL", "'http://localhost:5090'")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

fix_file('src/pages/tablaRegistros.jsx')
fix_file('src/pages/NodosSustitucion.jsx')
