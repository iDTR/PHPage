// src/utils/storage.js

const INITIAL_USERS = [
  { id: 1, name: 'Admin General', email: 'admin@honeywell.com', role: 'Administrador', status: 'Activo', password: '123' },
  { id: 2, name: 'Supervisor Turno A', email: 'sup@honeywell.com', role: 'Supervisor', status: 'Activo', password: '123' },
  { id: 3, name: 'Técnico Mantenimiento', email: 'mant@honeywell.com', role: 'Mantenimiento', status: 'Activo', password: '123' },
];

const INITIAL_MOLDS = [
  { id: 'M-101', name: 'Molde Carcasa A1', type: 'Inyección' },
  { id: 'M-102', name: 'Molde Sensor B2', type: 'Presión' },
  { id: 'M-103', name: 'Molde Lente C3', type: 'Óptico' },
  { id: 'M-104', name: 'Molde Base D4', type: 'Metal' },
];

// --- GESTIÓN DE USUARIOS ---
export const getStoredUsers = () => {
  const users = localStorage.getItem('hw_users');
  return users ? JSON.parse(users) : INITIAL_USERS;
};

export const saveStoredUsers = (users) => {
  localStorage.setItem('hw_users', JSON.stringify(users));
};

// --- NUEVO: CAMBIAR CONTRASEÑA ---
export const updateUserPassword = (userId, newPassword) => {
  const users = getStoredUsers();
  // Actualizamos la lista de usuarios
  const updatedUsers = users.map(u => 
    u.id === userId ? { ...u, password: newPassword } : u
  );
  saveStoredUsers(updatedUsers);

  // Si es el usuario actual, actualizamos también la sesión
  const session = getSession();
  if (session && session.id === userId) {
    const updatedSession = { ...session, password: newPassword };
    setSession(updatedSession);
  }
};

// --- GESTIÓN DE SESIÓN ---
export const getSession = () => {
  const session = localStorage.getItem('hw_session');
  return session ? JSON.parse(session) : null;
};

export const setSession = (user) => {
  localStorage.setItem('hw_session', JSON.stringify(user));
};

export const clearSession = () => {
  localStorage.removeItem('hw_session');
};

// --- GESTIÓN DE MOLDES ---
export const getStoredMolds = () => {
  return INITIAL_MOLDS;
};

export const getMoves = () => {
  const moves = localStorage.getItem('hw_moves');
  return moves ? JSON.parse(moves) : [];
};

export const saveMoves = (moves) => {
  localStorage.setItem('hw_moves', JSON.stringify(moves));
};