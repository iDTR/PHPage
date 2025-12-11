import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, BarChart2, Calendar, CheckCircle } from 'lucide-react';
import { getStoredUsers, saveStoredUsers, getMoves } from '../utils/storage';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  
  // Estado para el usuario seleccionado y sus estadísticas
  const [selectedUser, setSelectedUser] = useState(null);
  const [userStats, setUserStats] = useState({ day: 0, week: 0, month: 0, total: 0 });

  const [formData, setFormData] = useState({ id: null, name: '', email: '', role: 'Operador', status: 'Activo', password: '123' });

  useEffect(() => {
    setUsers(getStoredUsers());
  }, []);

  // --- LÓGICA DE ESTADÍSTICAS ---
  const calculateStats = (user) => {
    const moves = getMoves();
    const userName = user.name;
    
    // Filtrar solo los trabajos terminados por este usuario
    const completedJobs = moves.filter(m => m.status === 'Listo' && m.completedBy === userName);

    const now = new Date();
    
    // 1. Inicio del Día (00:00 hrs de hoy)
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    // 2. Inicio de la Semana (Domingo pasado)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0,0,0,0);
    const startOfWeekTime = startOfWeek.getTime();

    // 3. Inicio del Mes (Día 1 del mes actual)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    setUserStats({
      day: completedJobs.filter(m => m.endTime >= startOfDay).length,
      week: completedJobs.filter(m => m.endTime >= startOfWeekTime).length,
      month: completedJobs.filter(m => m.endTime >= startOfMonth).length,
      total: completedJobs.length
    });

    setSelectedUser(user);
    setIsStatsModalOpen(true);
  };

  // --- CRUD DE USUARIOS ---
  const handleSave = (e) => {
    e.preventDefault();
    let newUsers;
    if (formData.id) {
      newUsers = users.map(u => u.id === formData.id ? formData : u);
    } else {
      newUsers = [...users, { ...formData, id: Date.now() }];
    }
    setUsers(newUsers);
    saveStoredUsers(newUsers);
    closeModal();
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Confirma eliminación de registro? Esta acción es irreversible.')) {
      const newUsers = users.filter(u => u.id !== id);
      setUsers(newUsers);
      saveStoredUsers(newUsers);
    }
  };

  const openModal = (user = null) => {
    if (user) setFormData(user);
    else setFormData({ id: null, name: '', email: '', role: 'Mantenimiento', status: 'Activo', password: '123' });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsStatsModalOpen(false);
  };

  return (
    <div>
      {/* Barra de Herramientas */}
      <div className="bg-white p-4 rounded-sm shadow-sm border border-gray-200 mb-6 flex justify-between items-center">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar personal..." 
            className="pl-9 pr-4 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-honeywell-red w-64"
          />
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-honeywell-red hover:bg-red-700 text-white text-sm font-bold py-2 px-4 rounded-sm flex items-center transition-colors uppercase"
        >
          <Plus className="w-4 h-4 mr-2" /> Nuevo Usuario
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-sm shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-4">Usuario</th>
              <th className="px-6 py-4">Rol</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4 text-center">Rendimiento</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-800 text-sm">{user.name}</span>
                    <span className="text-xs text-gray-500">{user.email}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">{user.role}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-sm ${user.status === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  {/* Botón de Estadísticas (Solo útil para mantenimiento/supervisores) */}
                  <button 
                    onClick={() => calculateStats(user)}
                    className="text-honeywell-red hover:bg-red-50 p-2 rounded-sm transition-colors group"
                    title="Ver Estadísticas"
                  >
                    <BarChart2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </button>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => openModal(user)} className="text-gray-400 hover:text-blue-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(user.id)} className="text-gray-400 hover:text-red-700 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL DE EDICIÓN / CREACIÓN */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-sm shadow-2xl border-t-4 border-honeywell-red">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-bold text-gray-800 uppercase text-sm">
                {formData.id ? 'Editar Registro' : 'Nuevo Registro'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-red-600"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Nombre Completo</label>
                <input type="text" className="w-full border border-gray-300 p-2 rounded-sm focus:border-honeywell-red focus:outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Email</label>
                <input type="email" className="w-full border border-gray-300 p-2 rounded-sm focus:border-honeywell-red focus:outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Rol</label>
                  <select className="w-full border border-gray-300 p-2 rounded-sm focus:border-honeywell-red focus:outline-none bg-white" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                    <option>Administrador</option>
                    <option>Mantenimiento</option>
                    <option>Supervisor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Estado</label>
                  <select className="w-full border border-gray-300 p-2 rounded-sm focus:border-honeywell-red focus:outline-none bg-white" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option>Activo</option>
                    <option>Inactivo</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex justify-end space-x-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 border border-gray-300 text-gray-700 font-bold text-xs uppercase rounded-sm hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-honeywell-red text-white font-bold text-xs uppercase rounded-sm hover:bg-red-700">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE ESTADÍSTICAS (KPIs) */}
      {isStatsModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 font-sans">
          <div className="bg-white w-full max-w-lg rounded-sm shadow-2xl">
            {/* Header del Reporte */}
            <div className="p-6 bg-gray-900 text-white flex justify-between items-start border-b-4 border-honeywell-red">
                <div>
                    <h2 className="text-xl font-bold uppercase tracking-wide">Reporte de Rendimiento</h2>
                    <p className="text-sm text-gray-400 mt-1">{selectedUser.name}</p>
                    <span className="text-[10px] uppercase bg-gray-700 px-2 py-0.5 rounded mt-2 inline-block text-gray-300">{selectedUser.role}</span>
                </div>
                <button onClick={closeModal} className="text-gray-400 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Cuerpo de Estadísticas */}
            <div className="p-8 bg-gray-50">
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {/* Card: DÍA */}
                    <div className="bg-white p-4 rounded-sm shadow-sm border border-gray-200 text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Hoy</p>
                        <p className="text-3xl font-bold text-honeywell-red">{userStats.day}</p>
                        <p className="text-[10px] text-gray-400">Moldes</p>
                    </div>
                    {/* Card: SEMANA */}
                    <div className="bg-white p-4 rounded-sm shadow-sm border border-gray-200 text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Esta Semana</p>
                        <p className="text-3xl font-bold text-gray-800">{userStats.week}</p>
                        <p className="text-[10px] text-gray-400">Moldes</p>
                    </div>
                    {/* Card: MES */}
                    <div className="bg-white p-4 rounded-sm shadow-sm border border-gray-200 text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Este Mes</p>
                        <p className="text-3xl font-bold text-gray-800">{userStats.month}</p>
                        <p className="text-[10px] text-gray-400">Moldes</p>
                    </div>
                </div>

                {/* Resumen Total */}
                <div className="bg-white border border-gray-200 p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center">
                        <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase">Total Histórico</p>
                            <p className="text-sm text-gray-400">Configuraciones completadas</p>
                        </div>
                    </div>
                    <span className="text-2xl font-bold text-gray-800">{userStats.total}</span>
                </div>
            </div>
            
            <div className="p-4 bg-gray-100 text-center border-t border-gray-200">
                <p className="text-[10px] text-gray-400 uppercase">Sistema de Métricas Honeywell v1.2</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}