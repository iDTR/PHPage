import React, { useState } from 'react';
import { LayoutDashboard, Users, LogOut, Wrench, Lock, X, CheckCircle, FileText } from 'lucide-react';
import { updateUserPassword } from '../utils/storage';

export default function Layout({ children, user, onLogout, currentView, setView }) {
  // Estado para el Modal de Contraseña
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [passForm, setPassForm] = useState({ current: '', new: '', confirm: '' });
  const [msg, setMsg] = useState({ text: '', type: '' });

  const NavItem = ({ viewName, label, icon: Icon }) => (
    <button
      onClick={() => setView(viewName)}
      className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-all duration-200 border-l-4 
      ${currentView === viewName 
        ? 'border-honeywell-red bg-white text-honeywell-red shadow-sm' 
        : 'border-transparent text-gray-400 hover:text-white hover:bg-white/10'}`}
    >
      <Icon className="w-5 h-5 mr-3" />
      {label}
    </button>
  );

  // Lógica de Cambio de Contraseña
  const handleChangePassword = (e) => {
    e.preventDefault();
    setMsg({ text: '', type: '' });

    // 1. Validar actual
    if (passForm.current !== user.password) {
      setMsg({ text: 'La contraseña actual es incorrecta.', type: 'error' });
      return;
    }
    // 2. Validar coincidencia
    if (passForm.new !== passForm.confirm) {
      setMsg({ text: 'las contraseñas nuevas no coinciden.', type: 'error' });
      return;
    }
    // 3. Validar longitud
    if (passForm.new.length < 3) {
      setMsg({ text: 'La contraseña es muy corta.', type: 'error' });
      return;
    }

    // Guardar
    updateUserPassword(user.id, passForm.new);
    
    setMsg({ text: 'Contraseña actualizada correctamente.', type: 'success' });
    setPassForm({ current: '', new: '', confirm: '' });
    
    // Cerrar modal después de 1.5 segundos
    setTimeout(() => {
        setIsPassModalOpen(false);
        setMsg({ text: '', type: '' });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-honeywell-gray flex font-sans">
      {/* Sidebar Industrial Oscuro */}
      <aside className="w-64 bg-honeywell-dark text-white flex flex-col shadow-xl z-20">
        <div className="h-16 flex items-center px-6 bg-black/20 border-b border-white/10">
          <h1 className="text-xl font-bold tracking-tight text-white">
            HONEY<span className="text-honeywell-red">WELL</span>
          </h1>
        </div>

        <nav className="flex-1 py-6 space-y-1">
          <NavItem viewName="dashboard" label="Panel de Control" icon={LayoutDashboard} />
          
          {user.role === 'Administrador' && (
             <NavItem viewName="users" label="Gestión de Usuarios" icon={Users} />
          )}

          <NavItem viewName="molds" label="Movimiento Moldes" icon={Wrench} />

          <NavItem viewName="history" label="Historial Global" icon={FileText} />
        </nav>

        {/* Footer del Sidebar con Usuario */}
        <div className="p-4 border-t border-white/10 bg-black/20">
          <div className="flex items-center mb-3 justify-between">
            <div className="flex items-center overflow-hidden">
                <div className="w-8 h-8 rounded-sm bg-honeywell-red flex-shrink-0 flex items-center justify-center font-bold text-white text-xs">
                {user.name.charAt(0)}
                </div>
                <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium truncate w-24">{user.name}</p>
                <p className="text-xs text-gray-400 truncate">{user.role}</p>
                </div>
            </div>
            {/* Botón de Cambiar Password (Candado) */}
            <button 
                onClick={() => setIsPassModalOpen(true)}
                className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
                title="Cambiar Contraseña"
            >
                <Lock className="w-4 h-4" />
            </button>
          </div>
          
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center px-3 py-2 text-xs font-bold text-gray-300 border border-gray-600 hover:border-honeywell-red hover:text-honeywell-red rounded-sm transition-colors uppercase tracking-wider"
          >
            <LogOut className="w-4 h-4 mr-2" /> Desconectar
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm">
          <h2 className="text-lg font-bold text-gray-700 uppercase tracking-wide">
            {currentView === 'dashboard' ? 'Resumen Operativo' : 
             currentView === 'users' ? 'Administración de Personal' :
             'Sistema de Moldes'}
          </h2>
          <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-3 py-1 rounded-sm">
            v1.1.0 SECURITY UPDATE
          </span>
        </header>

        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>

      {/* MODAL DE CAMBIO DE CONTRASEÑA */}
      {isPassModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white w-full max-w-sm rounded-sm shadow-2xl border-t-4 border-honeywell-red">
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800 uppercase text-sm flex items-center">
                        <Lock className="w-4 h-4 mr-2 text-honeywell-red"/> Seguridad de Cuenta
                    </h3>
                    <button onClick={() => setIsPassModalOpen(false)} className="text-gray-400 hover:text-red-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <form onSubmit={handleChangePassword} className="p-6 space-y-4">
                    {msg.text && (
                        <div className={`p-3 text-xs font-bold rounded-sm flex items-center ${msg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                            {msg.type === 'success' && <CheckCircle className="w-3 h-3 mr-2"/>}
                            {msg.text}
                        </div>
                    )}

                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Contraseña Actual</label>
                        <input 
                            type="password" 
                            className="w-full border border-gray-300 p-2 rounded-sm focus:border-honeywell-red focus:outline-none text-sm"
                            value={passForm.current}
                            onChange={e => setPassForm({...passForm, current: e.target.value})}
                            required
                        />
                    </div>
                    <div className="border-t border-gray-100 pt-2"></div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nueva Contraseña</label>
                        <input 
                            type="password" 
                            className="w-full border border-gray-300 p-2 rounded-sm focus:border-honeywell-red focus:outline-none text-sm"
                            value={passForm.new}
                            onChange={e => setPassForm({...passForm, new: e.target.value})}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Confirmar Nueva Contraseña</label>
                        <input 
                            type="password" 
                            className="w-full border border-gray-300 p-2 rounded-sm focus:border-honeywell-red focus:outline-none text-sm"
                            value={passForm.confirm}
                            onChange={e => setPassForm({...passForm, confirm: e.target.value})}
                            required
                        />
                    </div>

                    <div className="pt-4 flex justify-end space-x-2">
                        <button type="button" onClick={() => setIsPassModalOpen(false)} className="px-4 py-2 text-gray-600 font-bold text-xs uppercase hover:bg-gray-100 rounded-sm">
                            Cancelar
                        </button>
                        <button type="submit" className="px-4 py-2 bg-honeywell-red text-white font-bold text-xs uppercase rounded-sm hover:bg-red-700 transition-colors">
                            Actualizar
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}