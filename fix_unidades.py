import re

with open('src/components/UnidadesModal.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove MUI import
content = re.sub(r"import \{ TablePagination \} from '@mui/material';\n", "", content)

# Replace TablePagination component with custom Tailwind pagination
pagination_ui = """
                        <div className="flex items-center justify-between px-2 py-4 border-t">
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

# Use regex to replace the <TablePagination ... /> block
content = re.sub(r'<TablePagination[^>]*/>', pagination_ui, content, flags=re.DOTALL)

with open('src/components/UnidadesModal.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
