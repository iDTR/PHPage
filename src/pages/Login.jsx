import React, { useState } from 'react';
import { User, Lock, ArrowRight } from 'lucide-react';
import { getStoredUsers, setSession } from '../utils/storage';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    const users = getStoredUsers();
    const foundUser = users.find(u => u.email === email && u.password === password);

    if (foundUser) {
      if (foundUser.status === 'Inactivo') {
        setError('ID Deshabilitado. Contacte al administrador.');
        return;
      }
      setSession(foundUser);
      onLoginSuccess(foundUser);
    } else {
      setError('Credenciales no válidas.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white w-full max-w-sm shadow-xl border-t-4 border-honeywell-red p-8 rounded-sm">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">HONEY<span className="text-honeywell-red">WELL</span></h1>
          <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">Enterprise Access</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Usuario ID</label>
            <div className="relative group">
              <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 group-focus-within:text-honeywell-red transition-colors" />
              <input type="email" className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-honeywell-red focus:ring-1 focus:ring-honeywell-red transition-all" placeholder="nombre@dominio.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Contraseña</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 group-focus-within:text-honeywell-red transition-colors" />
              <input type="password" className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-honeywell-red focus:ring-1 focus:ring-honeywell-red transition-all" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          </div>
          {error && <div className="bg-red-50 text-red-700 text-xs font-medium p-3 rounded-sm border-l-2 border-honeywell-red">{error}</div>}
          <button type="submit" className="w-full bg-honeywell-red hover:bg-red-700 text-white font-bold py-3 rounded-sm transition-colors uppercase text-xs tracking-wider flex items-center justify-center">Ingresar <ArrowRight className="ml-2 w-4 h-4" /></button>
        </form>
      </div>
    </div>
  );
}