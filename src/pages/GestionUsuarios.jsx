import React, { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Users, Plus, Pencil, Trash2, Search, ShieldCheck, User, CheckCircle2, X, AlertTriangle, UserX, UserCheck } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

const EMPTY_FORM = { id: '', usuario: '', role: 'usuario', estatus: 'activo', zona: '' };

export default function GestionUsuarios() {
  const { user: authUser } = useContext(AuthContext);
  const { success, error: toastError, confirm } = useNotifications();

  const [users, setUsers]           = useState([]);
  const [zones, setZones]           = useState([]);
  const [isLoading, setIsLoading]   = useState(false);
  const [search, setSearch]         = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [editingUser, setEditingUser] = useState(null); // null = crear
  const [form, setForm]             = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Password Reset state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resettingUser, setResettingUser] = useState(null);
  const [adminPassword, setAdminPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [newUserId, setNewUserId] = useState('');

  // Status Modal state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusUser, setStatusUser] = useState(null);

  // Filtro de estatus (todos, activos, inactivos)
  const [statusFilter, setStatusFilter] = useState('todos');
  
  // Filtro de rol (todos, administrador, usuario)
  const [roleFilter, setRoleFilter] = useState('todos');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/usuarios?t=${Date.now()}`);
      setUsers(data);
    } catch (e) {
      toastError('Error al cargar usuarios');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchZones = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/usuarios/zonas`);
      setZones(data);
    } catch {}
  };

  useEffect(() => { fetchUsers(); fetchZones(); }, []);

  const openCreate = () => {
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditingUser(u);
    setForm({ id: u.id, usuario: u.usuario, role: u.role, estatus: u.estatus ?? 'activo', zona: u.zona ?? '' });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingUser(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.id || !form.usuario.trim() || !form.role) return;

    setIsSubmitting(true);
    try {
      const matriculaId = parseInt(form.id, 10);
      if (isNaN(matriculaId)) {
        toastError('La matrícula debe ser un número válido');
        setIsSubmitting(false);
        return;
      }

      const payload = {
        id: matriculaId,
        usuario: form.usuario.trim(),
        role: form.role,
        estatus: form.estatus,
        zona: form.zona !== '' ? parseInt(form.zona, 10) : null,
      };

      if (editingUser) {
        await axios.put(`${API_URL}/api/usuarios/${editingUser.id}`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        success('Usuario actualizado exitosamente');
      } else {
        await axios.post(`${API_URL}/api/usuarios`, payload);
        setNewUserId(matriculaId);
        setShowSuccessModal(true);
      }
      setShowModal(false);
      fetchUsers();
    } catch (e) {
      toastError(e?.response?.data?.error || 'Error al guardar usuario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (u) => {
    const ok = await confirm(`¿Eliminar usuario "${u.usuario}"? Esta acción no se puede deshacer.`);
    if (!ok) return;
    try {
      await axios.delete(`${API_URL}/api/usuarios/${u.id}`);
      success('Usuario eliminado');
      fetchUsers();
    } catch (e) {
      toastError(e?.response?.data?.error || 'Error al eliminar usuario');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!adminPassword.trim()) {
      toastError('Ingresa tu contraseña de administrador para confirmar');
      return;
    }
    setIsResetting(true);
    try {
      const { data } = await axios.post(
        `${API_URL}/api/usuarios/${resettingUser.id}/reset-password`,
        { adminPassword },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      success(`Contraseña reseteada. Nueva contraseña: ${data.newPassword}`);
      setShowResetModal(false);
      setAdminPassword('');
      setResettingUser(null);
    } catch (e) {
      toastError(e?.response?.data?.error || 'Error al resetear contraseña');
    } finally {
      setIsResetting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!statusUser) return;
    setIsSubmitting(true);
    const currentStatus = statusUser.estatus?.trim().toLowerCase();
    const newStatus = currentStatus !== 'inactivo' ? 'inactivo' : 'activo';
    try {
      await axios.put(`${API_URL}/api/usuarios/${statusUser.id}`, {
        usuario: statusUser.usuario,
        role: statusUser.role,
        zona: statusUser.zona,
        estatus: newStatus
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      success(`Usuario ${newStatus === 'activo' ? 'activado' : 'desactivado'}`);
      
      // Actualización optimista del UI
      setUsers(prev => prev.map(u => 
        u.id === statusUser.id ? { ...u, estatus: newStatus } : u
      ));
      
      setShowStatusModal(false);
      setStatusUser(null);
      fetchUsers();
    } catch (e) {
      toastError(e?.response?.data?.error || 'Error al cambiar estatus');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = users.filter(u => {
    const matchesSearch = String(u.id).includes(search) ||
                          u.usuario.toLowerCase().includes(search.toLowerCase()) ||
                          u.role.toLowerCase().includes(search.toLowerCase());
    const isActivo = u.estatus?.trim().toLowerCase() !== 'inactivo';
    const matchesStatus = statusFilter === 'todos' ? true : statusFilter === 'activos' ? isActivo : !isActivo;
    const matchesRole = roleFilter === 'todos' ? true : roleFilter === u.role;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, roleFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const currentUsers = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Gestión de Usuarios
          </h1>
          <p className="text-sm text-slate-500 font-medium">Administración de accesos y roles</p>
        </div>
        <Button
          id="btn-crear-usuario"
          onClick={openCreate}
          className="bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-2 rounded-xl shadow-sm px-5 py-2.5 h-auto transition-all"
        >
          <Plus size={16} />
          Nuevo Usuario
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="col-span-2 lg:col-span-1 bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-center items-center">
          <div className="text-3xl font-bold text-slate-800">{users.length}</div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">Registros Totales</div>
          <div className="flex bg-slate-100 rounded-lg p-1 mt-4 w-full max-w-[200px]">
            <button 
              onClick={() => setStatusFilter('todos')} 
              className={`flex-1 text-center py-1.5 rounded-md text-xs font-semibold transition-all ${statusFilter === 'todos' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Todos
            </button>
            <button 
              onClick={() => setStatusFilter('activos')} 
              className={`flex-1 text-center py-1.5 rounded-md text-xs font-semibold transition-all ${statusFilter === 'activos' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {users.filter(u => u.estatus !== 'inactivo').length} Act.
            </button>
            <button 
              onClick={() => setStatusFilter('inactivos')} 
              className={`flex-1 text-center py-1.5 rounded-md text-xs font-semibold transition-all ${statusFilter === 'inactivos' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {users.filter(u => u.estatus === 'inactivo').length} Inact.
            </button>
          </div>
        </div>
        
        <button 
          onClick={() => setRoleFilter(roleFilter === 'administrador' ? 'todos' : 'administrador')}
          className={`bg-white rounded-xl border p-4 shadow-sm flex flex-col items-center justify-center transition-all hover:border-emerald-200 ${roleFilter === 'administrador' ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/10' : 'border-slate-200'}`}
        >
          <div className={`text-2xl font-semibold ${roleFilter === 'administrador' ? 'text-emerald-600' : 'text-slate-400'}`}>
            {users.filter(u => u.role === 'administrador').length}
          </div>
          <div className={`text-[10px] font-bold uppercase tracking-widest mt-2 ${roleFilter === 'administrador' ? 'text-emerald-700' : 'text-slate-500'}`}>
            Administrador
          </div>
        </button>
        
        <button 
          onClick={() => setRoleFilter(roleFilter === 'maestro' ? 'todos' : 'maestro')}
          className={`bg-white rounded-xl border p-4 shadow-sm flex flex-col items-center justify-center transition-all hover:border-emerald-200 ${roleFilter === 'maestro' ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/10' : 'border-slate-200'}`}
        >
          <div className={`text-2xl font-semibold ${roleFilter === 'maestro' ? 'text-emerald-600' : 'text-slate-400'}`}>
            {users.filter(u => u.role === 'maestro').length}
          </div>
          <div className={`text-[10px] font-bold uppercase tracking-widest mt-2 ${roleFilter === 'maestro' ? 'text-emerald-700' : 'text-slate-500'}`}>
            Maestro
          </div>
        </button>

        <button 
          onClick={() => setRoleFilter(roleFilter === 'usuario' ? 'todos' : 'usuario')}
          className={`bg-white rounded-xl border p-4 shadow-sm flex flex-col items-center justify-center transition-all hover:border-emerald-200 ${roleFilter === 'usuario' ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/10' : 'border-slate-200'}`}
        >
          <div className={`text-2xl font-semibold ${roleFilter === 'usuario' ? 'text-emerald-600' : 'text-slate-400'}`}>
            {users.filter(u => u.role === 'usuario').length}
          </div>
          <div className={`text-[10px] font-bold uppercase tracking-widest mt-2 text-center ${roleFilter === 'usuario' ? 'text-emerald-700' : 'text-slate-500'}`}>
            Usuario Estándar
          </div>
        </button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            id="input-buscar-usuario"
            placeholder="Buscar por nombre, matrícula o rol..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 h-11 bg-white border-slate-200 rounded-xl shadow-sm text-sm w-full md:max-w-md"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="h-[340px] overflow-y-auto">
          <Table className="w-full text-sm text-left">
            <TableHeader className="sticky top-0 bg-white z-10">
              <TableRow className="border-b border-slate-100 hover:bg-transparent">
              <TableHead className="font-bold text-xs text-slate-500 py-4 px-6 uppercase tracking-wider">Usuario</TableHead>
              <TableHead className="font-bold text-xs text-slate-500 py-4 uppercase tracking-wider">Rol</TableHead>
              <TableHead className="font-bold text-xs text-slate-500 py-4 uppercase tracking-wider text-center">Estatus</TableHead>
              <TableHead className="font-bold text-xs text-slate-500 py-4 px-6 uppercase tracking-wider text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                  Cargando usuarios…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                  No se encontraron usuarios
                </TableCell>
              </TableRow>
            ) : currentUsers.map((u) => (
              <TableRow key={u.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 group">
                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-200 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-700 text-sm">{u.usuario}</span>
                      <span className="text-xs text-slate-400">{u.id}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <Badge className="bg-amber-100/50 text-amber-700 hover:bg-amber-100/80 border-0 rounded-full font-semibold px-3 capitalize">
                    {u.role}
                  </Badge>
                </TableCell>
                <TableCell className="py-4 text-center">
                  <button 
                    onClick={() => {
                      setStatusUser(u);
                      setShowStatusModal(true);
                    }}
                    className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                      u.estatus?.trim().toLowerCase() === 'inactivo' 
                        ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' 
                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                    }`}
                  >
                    {u.estatus?.trim().toLowerCase() === 'inactivo' ? (
                      <>
                        <UserX size={16} strokeWidth={2.5} />
                        Inactivo
                      </>
                    ) : (
                      <>
                        <UserCheck size={16} strokeWidth={2.5} />
                        Activo
                      </>
                    )}
                  </button>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openEdit(u)}
                      className="h-8 w-8 rounded-lg border border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700"
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setResettingUser(u);
                        setAdminPassword('');
                        setShowResetModal(true);
                      }}
                      className="h-8 w-8 rounded-lg border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                    >
                      <ShieldCheck size={14} />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(u)}
                      className="h-8 w-8 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {filtered.length > 0 && (
        <div className="mt-4 pb-8">
          <div className="flex items-center justify-between px-2 text-sm text-slate-600 font-medium">
            <div>Total: <span className="font-bold text-slate-800">{filtered.length}</span> usuarios registrados.</div>
            <div className="uppercase tracking-widest text-xs text-slate-400 font-bold">PÁG. {currentPage}/{totalPages === 0 ? 1 : totalPages}</div>
          </div>

          <div className="flex items-center justify-center mt-6 gap-1.5">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0 rounded-md bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            >
              &lt;
            </Button>
            
            {[...Array(totalPages)].map((_, i) => {
              const p = i + 1;
              if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
                return (
                  <Button
                    key={p}
                    variant={currentPage === p ? 'default' : 'outline'}
                    onClick={() => setCurrentPage(p)}
                    className={`h-8 w-8 p-0 rounded-md text-sm font-semibold transition-colors ${
                      currentPage === p 
                        ? 'bg-[#0f4d32] text-white hover:bg-[#0a3824] border-[#0f4d32]' 
                        : 'text-slate-600 bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </Button>
                );
              }
              if (p === 2 && currentPage > 3) {
                return <span key="dots1" className="px-1 text-slate-400 text-xs">...</span>;
              }
              if (p === totalPages - 1 && currentPage < totalPages - 2) {
                return <span key="dots2" className="px-1 text-slate-400 text-xs">...</span>;
              }
              return null;
            })}

            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0 rounded-md bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            >
              &gt;
            </Button>

            <div className="flex items-center gap-1.5 ml-4">
              <Input 
                placeholder="Ir a.." 
                className="h-8 w-16 text-xs text-center border-slate-200 shadow-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = parseInt(e.target.value);
                    if (val >= 1 && val <= totalPages) setCurrentPage(val);
                    e.target.value = '';
                  }
                }}
              />
              <Button 
                variant="outline" 
                className="h-8 px-3 rounded-md bg-emerald-50/50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 hover:text-emerald-700 text-xs font-semibold shadow-sm transition-colors"
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling;
                  const val = parseInt(input.value);
                  if (val >= 1 && val <= totalPages) setCurrentPage(val);
                  input.value = '';
                }}
              >
                Ir
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal crear/editar */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
          <div
            className="absolute inset-0 bg-slate-900/20 transition-opacity animate-in fade-in duration-200"
            onClick={closeModal}
          />
          <div className="relative z-10 bg-white rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] w-full max-w-md animate-in zoom-in-95 fade-in duration-200 border border-slate-100">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2.5">
                {editingUser ? (
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><Pencil size={18} /></div>
                ) : (
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><Plus size={18} /></div>
                )}
                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h2>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="modal-matricula" className="text-sm font-medium text-gray-700">Matrícula</label>
                <Input
                  id="modal-matricula"
                  type="number"
                  value={form.id}
                  onChange={e => setForm(f => ({ ...f, id: e.target.value }))}
                  placeholder="Ej. 99190315"
                  required
                  className="w-full h-11 bg-white border-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="modal-usuario" className="text-sm font-medium text-slate-700">Nombre de Usuario</label>
                <Input
                  id="modal-usuario"
                  value={form.usuario}
                  onChange={e => setForm(f => ({ ...f, usuario: e.target.value }))}
                  required
                  className="w-full h-11 bg-white border-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="modal-role" className="text-sm font-medium text-gray-700">Rol</label>
                <select
                  id="modal-role"
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full h-11 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                >
                  <option value="maestro">Maestro</option>
                  <option value="administrador">Administrador</option>
                  <option value="usuario">Usuario</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="modal-estatus" className="text-sm font-medium text-slate-700">Estatus</label>
                <select
                  id="modal-estatus"
                  value={form.estatus}
                  onChange={e => setForm(f => ({ ...f, estatus: e.target.value }))}
                  className="w-full h-11 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="modal-zona" className="text-sm font-medium text-slate-700">Zona</label>
                <select
                  id="modal-zona"
                  value={form.zona}
                  onChange={e => setForm(f => ({ ...f, zona: e.target.value }))}
                  className="w-full h-11 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                >
                  <option value="">Sin zona asignada</option>
                  {zones.map(z => (
                    <option key={z} value={z}>Zona {z}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={closeModal} 
                  disabled={isSubmitting}
                  className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </Button>
                <Button
                  id="btn-guardar-usuario"
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all"
                >
                  {isSubmitting ? 'Guardando…' : (editingUser ? 'Guardar Cambios' : 'Crear Usuario')}
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Reset Password */}
      {showResetModal && createPortal(
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-900/60 transition-opacity"
            onClick={() => setShowResetModal(false)}
          />
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden relative z-10">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <ShieldCheck className="h-5 w-5 text-amber-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-800">Confirmar Reseteo</h2>
              </div>
              <button 
                onClick={() => setShowResetModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-amber-50 text-amber-800 p-3 rounded-lg text-sm flex gap-3">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600" />
                <p>
                  Estás a punto de resetear la contraseña del usuario <span className="font-bold">{resettingUser?.usuario}</span>. 
                  La nueva contraseña será <span className="font-bold font-mono bg-amber-100 px-1 rounded">IMSS{resettingUser?.id}</span>
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Tu contraseña de Administrador</label>
                <Input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full h-11 bg-white border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setShowResetModal(false)}
                  className="border-slate-200 text-slate-600 hover:bg-slate-50"
                  disabled={isResetting}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleResetPassword}
                  className="bg-amber-500 hover:bg-amber-600 text-white border-0"
                  disabled={!adminPassword || isResetting}
                >
                  {isResetting ? 'Reseteando...' : 'Confirmar Reseteo'}
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showSuccessModal && createPortal(
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 transition-opacity" onClick={() => setShowSuccessModal(false)} />
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden relative z-10 p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-emerald-100 mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">¡Usuario Creado Exitosamente!</h3>
            <p className="text-sm text-slate-600 mb-4">
              El usuario ya tiene acceso al sistema. La contraseña por defecto ha sido generada automáticamente usando la palabra <strong>IMSS</strong> seguida de su matrícula.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-semibold">Ejemplo para la matrícula {newUserId}:</p>
              <div className="flex items-center justify-between">
                <span className="font-mono text-slate-800 font-bold text-lg tracking-wider">IMSS{newUserId}</span>
              </div>
            </div>
            <Button className="w-full bg-[#0f4d32] hover:bg-[#0a3824] h-11" onClick={() => setShowSuccessModal(false)}>
              Entendido
            </Button>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Confirmar Estatus */}
      {showStatusModal && createPortal(
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-900/60 transition-opacity"
            onClick={() => setShowStatusModal(false)}
          />
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden relative z-10">
            <div className={`p-6 text-white flex justify-between items-start ${
              statusUser?.estatus?.trim().toLowerCase() === 'inactivo' ? 'bg-[#0f4d32]' : 'bg-orange-500'
            }`}>
              <div>
                <h2 className="text-2xl font-bold">
                  {statusUser?.estatus?.trim().toLowerCase() === 'inactivo' ? 'Activar Usuario' : 'Desactivar Usuario'}
                </h2>
                <p className="opacity-90 mt-1">
                  {statusUser?.estatus?.trim().toLowerCase() === 'inactivo' 
                    ? 'Restaurar el acceso del usuario al sistema' 
                    : 'Revocar el acceso del usuario al sistema'}
                </p>
              </div>
              <button 
                onClick={() => setShowStatusModal(false)}
                className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className={`p-4 rounded-xl text-sm ${
                statusUser?.estatus?.trim().toLowerCase() === 'inactivo' 
                  ? 'bg-emerald-50 border border-emerald-100 text-emerald-800' 
                  : 'bg-orange-50 border border-orange-100 text-orange-800'
              }`}>
                <p className="font-bold text-lg mb-1">
                  ¿{statusUser?.estatus?.trim().toLowerCase() === 'inactivo' ? 'Activar a' : 'Desactivar a'} {statusUser?.usuario}?
                </p>
                <p>
                  {statusUser?.estatus?.trim().toLowerCase() === 'inactivo'
                    ? 'El usuario podrá volver a acceder al sistema con sus credenciales anteriores.'
                    : 'El usuario ya no podrá iniciar sesión en el sistema.'}
                </p>
              </div>

              <div className="border border-amber-200 bg-amber-50/30 rounded-xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex-shrink-0 flex items-center justify-center text-white">
                  <User size={24} />
                </div>
                <div className="text-slate-500 font-medium">
                  Matrícula: <span className="font-bold text-slate-700">{statusUser?.id}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowStatusModal(false)}
                  className="flex-1 h-12 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 font-bold"
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleToggleStatus}
                  disabled={isSubmitting}
                  className={`flex-1 h-12 rounded-xl font-bold text-white border-0 ${
                    statusUser?.estatus?.trim().toLowerCase() === 'inactivo' 
                      ? 'bg-[#00a845] hover:bg-[#008c3a]' 
                      : 'bg-orange-500 hover:bg-orange-600'
                  }`}
                >
                  {isSubmitting 
                    ? 'Procesando...' 
                    : (statusUser?.estatus?.trim().toLowerCase() === 'inactivo' ? 'Sí, activar' : 'Sí, desactivar')}
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
