import React, { useState, useEffect } from 'react';
import { ClipboardList, Wrench, CheckCircle, Clock, AlertTriangle, PlayCircle, Timer, ListChecks, X, MessageSquare, Send, ShieldAlert, AlertOctagon, Camera, Image as ImageIcon } from 'lucide-react';
import { getMoves, saveMoves, getStoredMolds, getSession } from '../utils/storage';

export default function MoldSystem() {
  const [user, setUser] = useState(getSession());
  const [moves, setMoves] = useState([]);
  const [molds, setMolds] = useState(getStoredMolds());
  
  // Estados formulario solicitud
  const [selectedMold, setSelectedMold] = useState('');
  const [priority, setPriority] = useState('3');

  // Estados para Checklist de Validación
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [finishingJobId, setFinishingJobId] = useState(null);
  const [checks, setChecks] = useState({
    cleaned: false,
    greased: false,
    connections: false,
    safety: false
  });

  // Estados para Chat (Bitácora)
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatJob, setChatJob] = useState(null);
  const [newMessage, setNewMessage] = useState('');

  // --- ESTADOS PARA REPORTE DE DAÑOS CON FOTO ---
  const [isDamageModalOpen, setIsDamageModalOpen] = useState(false);
  const [damageJobId, setDamageJobId] = useState(null);
  const [damageDescription, setDamageDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState(null); // Guardará la imagen en Base64

  useEffect(() => {
    setMoves(getMoves());
  }, []);

  const updateMoves = (newMoves) => {
    setMoves(newMoves);
    saveMoves(newMoves);
    if (chatJob) {
        const updatedJob = newMoves.find(m => m.id === chatJob.id);
        setChatJob(updatedJob);
    }
  };

  const formatDuration = (ms) => {
    if (!ms) return 'N/A';
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins} min`;
  };

  // --- LÓGICA DE SOLICITUD ---
  const handleRequest = (e) => {
    e.preventDefault();
    if (!selectedMold) return;
    
    const newMove = {
      id: Date.now(),
      mold: selectedMold,
      priority: parseInt(priority),
      status: 'Pendiente',
      requestedBy: user.name,
      requestDate: new Date().toLocaleString(),
      startTime: Date.now(),
      endTime: null,
      duration: null,
      completedBy: null,
      comments: [],
      damageReport: null
    };

    updateMoves([...moves, newMove]);
    alert('Solicitud enviada. El reloj ha iniciado.');
    setSelectedMold('');
  };

  // --- LÓGICA DE MANTENIMIENTO ---
  const handleStartJob = (id) => {
    const updated = moves.map(m => m.id === id ? { ...m, status: 'En Proceso' } : m);
    updateMoves(updated);
  };

  const openFinishChecklist = (id) => {
    setFinishingJobId(id);
    setChecks({ cleaned: false, greased: false, connections: false, safety: false });
    setIsChecklistOpen(true);
  };

  const confirmFinishJob = () => {
    const updated = moves.map(m => {
      if (m.id === finishingJobId) {
        const end = Date.now();
        return { 
            ...m, 
            status: 'Listo',
            endTime: end,
            duration: end - m.startTime,
            completedBy: user.name
        };
      }
      return m;
    });
    updateMoves(updated);
    setIsChecklistOpen(false);
  };

  const handleDelete = (id) => {
    if(window.confirm("¿Eliminar registro?")) updateMoves(moves.filter(m => m.id !== id));
  };

  // --- LÓGICA DE CHAT ---
  const openChat = (job) => {
    setChatJob(job);
    setNewMessage('');
    setIsChatOpen(true);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    addComment(chatJob.id, newMessage, user.name, user.role);
    setNewMessage('');
  };

  const addComment = (jobId, text, author, role, image = null) => {
    const comment = {
        id: Date.now(),
        author: author,
        role: role,
        text: text,
        image: image, // Guardamos la imagen si existe
        date: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) + ' ' + new Date().toLocaleDateString()
    };
    const updatedMoves = moves.map(m => {
        if (m.id === jobId) {
            const currentComments = m.comments || [];
            return { ...m, comments: [...currentComments, comment] };
        }
        return m;
    });
    updateMoves(updatedMoves);
  };

  // --- LÓGICA DE REPORTE DE DAÑO E IMAGEN ---
  const openDamageModal = (id) => {
    setDamageJobId(id);
    setDamageDescription('');
    setSelectedImage(null); // Limpiar imagen previa
    setIsDamageModalOpen(true);
  };

  // Función mágica para leer la imagen del input
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        if (!file.type.startsWith('image/')) {
            alert('Por favor selecciona solo archivos de imagen.');
            return;
        }
        // Límite de tamaño (ej. 2MB para no saturar localStorage)
        if (file.size > 2 * 1024 * 1024) {
            alert('La imagen es muy pesada. Intenta con una más pequeña (Max 2MB).');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setSelectedImage(reader.result); // Esto es la imagen en Base64
        };
        reader.readAsDataURL(file);
    }
  };


  const saveDamageReport = () => {
    if (!damageDescription.trim()) return;

    const updatedMoves = moves.map(m => {
        if (m.id === damageJobId) {
            return { 
                ...m, 
                damageReport: {
                    text: damageDescription,
                    hasImage: !!selectedImage, // Booleano para saber si hay foto
                    reportedBy: user.name,
                    date: new Date().toLocaleString()
                }
            };
        }
        return m;
    });

    updateMoves(updatedMoves);
    
    // Agregamos la nota al chat CON la imagen si existe
    addComment(
        damageJobId, 
        `⚠️ REPORTE DE DAÑO EN RECEPCIÓN: ${damageDescription}`, 
        'SISTEMA', 
        'Alerta',
        selectedImage // Pasamos la imagen Base64
    );

    setIsDamageModalOpen(false);
  };


  // --- VISTAS ---
  const renderSupervisorView = () => {
    const pending = moves.filter(m => m.status !== 'Listo');
    const ready = moves.filter(m => m.status === 'Listo');

    return (
      <div className="space-y-8">
        {/* Formulario */}
        <div className="bg-white p-6 border-t-4 border-honeywell-red shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 uppercase mb-4 flex items-center">
            <Timer className="w-5 h-5 mr-2 text-honeywell-red" /> Reportar Paro / Solicitar Molde
          </h3>
          <form onSubmit={handleRequest} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Molde</label>
              <select className="w-full border p-2 rounded-sm bg-gray-50" value={selectedMold} onChange={e => setSelectedMold(e.target.value)}>
                <option value="">-- Seleccione --</option>
                {molds.map(m => <option key={m.id} value={m.name}>{m.id} - {m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Prioridad</label>
              <select className="w-full border p-2 rounded-sm bg-gray-50" value={priority} onChange={e => setPriority(e.target.value)}>
                <option value="1">1 - URGENTE (Línea Parada)</option>
                <option value="2">2 - Alta</option>
                <option value="3">3 - Normal</option>
              </select>
            </div>
            <button type="submit" className="bg-honeywell-red text-white font-bold py-2 px-4 rounded-sm uppercase text-sm hover:bg-red-700">
              Iniciar Configuración
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Listos */}
          <div className="bg-white border border-gray-200 shadow-sm">
            <div className="bg-green-600 text-white p-3 font-bold uppercase text-sm flex justify-between">
              <span>Configuraciones Terminadas</span>
              <CheckCircle className="w-5 h-5" />
            </div>
            <div className="p-4 space-y-3">
              {ready.length === 0 && <p className="text-gray-400 text-sm italic">Sin historial reciente.</p>}
              {ready.map(m => (
                <div key={m.id} className="border-l-4 border-green-500 bg-green-50 p-3 text-sm flex justify-between items-center group">
                  <div>
                    <span className="font-bold block text-gray-800">{m.mold}</span>
                    <span className="text-xs text-gray-500">Técnico: {m.completedBy}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button onClick={() => openChat(m)} className="text-gray-400 hover:text-blue-600 relative">
                        <MessageSquare className="w-5 h-5" />
                        {(m.comments && m.comments.length > 0) && (
                            <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full">{m.comments.length}</span>
                        )}
                    </button>
                    <div className="text-right">
                        <span className="block text-xs font-bold text-gray-500 uppercase">Tiempo Total</span>
                        <span className="text-lg font-bold text-honeywell-red">{formatDuration(m.duration)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pendientes */}
          <div className="bg-white border border-gray-200 shadow-sm">
            <div className="bg-gray-700 text-white p-3 font-bold uppercase text-sm flex justify-between">
              <span>En Espera (Reloj Activo)</span>
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div className="p-4 space-y-3">
              {pending.map(m => (
                <div key={m.id} className="border-b border-gray-100 pb-2">
                  <div className="flex justify-between items-center mb-1">
                    <div>
                        <span className="font-bold text-sm text-gray-700">{m.mold}</span>
                        <div className="text-xs text-gray-500">{m.requestDate}</div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        {/* ALERTA DE DAÑO SI EXISTE */}
                        {m.damageReport && (
                            <div className="bg-red-100 text-red-700 px-2 py-1 rounded text-[10px] font-bold border border-red-200 flex items-center animate-pulse" title={m.damageReport.text}>
                                <AlertOctagon className="w-3 h-3 mr-1" /> DAÑO PREVIO
                                {m.damageReport.hasImage && <Camera className="w-3 h-3 ml-1" />}
                            </div>
                        )}

                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${m.priority === 1 ? 'bg-red-100 text-red-600' : 'bg-gray-100'}`}>P{m.priority}</span>
                        <span className="text-[10px] text-red-600 font-bold uppercase animate-pulse">Running</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-2">
                      <button onClick={() => openChat(m)} className="text-gray-400 hover:text-blue-600 relative flex items-center text-xs">
                        <MessageSquare className="w-4 h-4 mr-1" /> Comentarios
                        {(m.comments && m.comments.length > 0) && (
                            <span className="ml-1 bg-blue-600 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full">{m.comments.length}</span>
                        )}
                     </button>
                     {user.role === 'Administrador' && <button onClick={() => handleDelete(m.id)} className="text-red-500 hover:underline text-xs flex items-center"><AlertTriangle className="w-3 h-3 mr-1"/> Eliminar</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMaintenanceView = () => {
    const pendingJobs = moves.filter(m => m.status !== 'Listo').sort((a, b) => a.priority - b.priority);

    return (
      <div className="space-y-6">
        <div className="bg-white shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 uppercase flex items-center">
              <Wrench className="w-5 h-5 mr-2 text-honeywell-red" /> Trabajos Activos
            </h3>
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-bold border border-red-200">
              {pendingJobs.length} Paros Activos
            </span>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 text-gray-500 uppercase font-bold text-xs">
              <tr>
                <th className="p-4">Prioridad</th>
                <th className="p-4">Molde</th>
                <th className="p-4">Hora Inicio</th>
                <th className="p-4 text-center">Estado</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pendingJobs.map(m => (
                <tr key={m.id} className={m.priority === 1 ? 'bg-red-50' : ''}>
                  <td className="p-4">
                    <span className={`font-bold px-2 py-1 rounded-sm ${m.priority === 1 ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-200 text-gray-700'}`}>P{m.priority}</span>
                  </td>
                  <td className="p-4 font-medium">
                      {m.mold}
                      {/* Mostrar alerta con icono de cámara si hay daño y foto */}
                      {m.damageReport && (
                        <div className="mt-1 flex items-center text-red-600 text-[10px] font-bold uppercase">
                            <AlertOctagon className="w-3 h-3 mr-1" /> Daño Reportado
                            {m.damageReport.hasImage && <Camera className="w-3 h-3 ml-1" />}
                        </div>
                      )}
                  </td>
                  <td className="p-4 text-gray-500 text-xs">{m.requestDate}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => openChat(m)} className="text-gray-400 hover:text-blue-600 relative inline-block p-1">
                        <MessageSquare className="w-5 h-5" />
                        {(m.comments && m.comments.length > 0) && (
                            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full">{m.comments.length}</span>
                        )}
                    </button>
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    {/* BOTÓN REPORTE DE DAÑO */}
                    {!m.damageReport && m.status !== 'Listo' && (
                        <button 
                            onClick={() => openDamageModal(m.id)}
                            className="text-gray-400 hover:text-red-600 border border-gray-300 hover:border-red-600 p-1.5 rounded-sm transition-colors"
                            title="Reportar Daño en Recepción"
                        >
                            <ShieldAlert className="w-4 h-4" />
                        </button>
                    )}

                    {m.status === 'Pendiente' && (
                      <button onClick={() => handleStartJob(m.id)} className="bg-blue-600 text-white px-3 py-1 rounded-sm text-xs font-bold hover:bg-blue-700 flex items-center">
                        <PlayCircle className="w-3 h-3 mr-1" /> Atender
                      </button>
                    )}
                    {m.status === 'En Proceso' && (
                      <button onClick={() => openFinishChecklist(m.id)} className="bg-green-600 text-white px-3 py-1 rounded-sm text-xs font-bold hover:bg-green-700 flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" /> Finalizar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div>
      {(user.role === 'Supervisor' || user.role === 'Administrador') && (
        <div className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b border-gray-300 pb-2">Gestión de Tiempos Muertos</h2>
            {renderSupervisorView()}
        </div>
      )}
      {(user.role === 'Mantenimiento' || user.role === 'Administrador') && (
        <div className="pt-6">
             <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center"><Wrench className="w-6 h-6 mr-2"/> Cola de Mantenimiento</h2>
             {renderMaintenanceView()}
        </div>
      )}

      {/* --- MODAL DE REPORTE DE DAÑO CON FOTO --- */}
      {isDamageModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white w-full max-w-md rounded-sm shadow-2xl border-t-4 border-red-600">
                <div className="p-4 border-b border-gray-200 bg-red-50 flex justify-between items-center">
                    <h3 className="font-bold text-red-800 uppercase text-sm flex items-center">
                        <ShieldAlert className="w-5 h-5 mr-2"/> Reporte de Daño en Recepción
                    </h3>
                    <button onClick={() => setIsDamageModalOpen(false)}><X className="w-5 h-5 text-red-400 hover:text-red-700" /></button>
                </div>
                <div className="p-6">
                    <p className="text-xs text-gray-600 mb-4">
                        Describe el daño o anomalía encontrada y adjunta evidencia fotográfica si es posible.
                    </p>
                    <textarea 
                        className="w-full border border-gray-300 rounded-sm p-3 text-sm focus:outline-none focus:border-red-600 h-24 resize-none mb-4"
                        placeholder="Descripción del daño..."
                        value={damageDescription}
                        onChange={(e) => setDamageDescription(e.target.value)}
                    ></textarea>

                    {/* INPUT DE CÁMARA */}
                    <div className="mb-6">
                        <input type="file" id="photo-upload" hidden accept="image/*" onChange={handleImageChange} />
                        <label htmlFor="photo-upload" className={`flex items-center justify-center w-full p-3 border-2 border-dashed rounded-sm cursor-pointer transition-colors ${selectedImage ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-300 hover:border-red-400 text-gray-500'}`}>
                            {!selectedImage ? (
                                <>
                                    <Camera className="w-5 h-5 mr-2" />
                                    <span className="text-sm font-bold uppercase">Adjuntar Fotografía</span>
                                </>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <ImageIcon className="w-6 h-6 mb-1" />
                                    <span className="text-xs font-bold">Imagen seleccionada</span>
                                    <span className="text-[10px] mt-1">(Click para cambiar)</span>
                                </div>
                            )}
                        </label>
                        {selectedImage && (
                            <div className="mt-2 p-1 border border-gray-200">
                                <img src={selectedImage} alt="Preview" className="w-full h-32 object-cover" />
                            </div>
                        )}
                    </div>
                    
                    <div className="flex gap-2 justify-end border-t pt-4">
                        <button onClick={() => setIsDamageModalOpen(false)} className="px-4 py-2 border border-gray-300 text-gray-600 font-bold text-xs uppercase rounded-sm hover:bg-gray-50">
                            Cancelar
                        </button>
                        <button 
                            onClick={saveDamageReport} 
                            disabled={!damageDescription.trim()}
                            className="px-4 py-2 bg-red-600 text-white font-bold text-xs uppercase rounded-sm hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            Registrar Daño
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- MODAL DE CHECKLIST --- */}
      {isChecklistOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white w-full max-w-md rounded-sm shadow-2xl border-t-4 border-honeywell-red">
                <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="font-bold text-gray-800 uppercase text-sm flex items-center">
                        <ListChecks className="w-4 h-4 mr-2 text-honeywell-red"/> Validación de Entrega
                    </h3>
                    <button onClick={() => setIsChecklistOpen(false)}><X className="w-5 h-5 text-gray-400 hover:text-red-600" /></button>
                </div>
                <div className="p-6">
                    <p className="text-sm text-gray-600 mb-4 font-bold">Confirma los siguientes puntos antes de liberar el molde:</p>
                    <div className="space-y-3">
                        <label className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer border border-gray-100">
                            <input type="checkbox" className="w-4 h-4 text-honeywell-red focus:ring-honeywell-red" 
                                checked={checks.cleaned} onChange={e => setChecks({...checks, cleaned: e.target.checked})} />
                            <span className="text-sm text-gray-700">Limpieza de superficie realizada</span>
                        </label>
                        <label className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer border border-gray-100">
                            <input type="checkbox" className="w-4 h-4 text-honeywell-red focus:ring-honeywell-red" 
                                checked={checks.greased} onChange={e => setChecks({...checks, greased: e.target.checked})} />
                            <span className="text-sm text-gray-700">Puntos de engrase verificados</span>
                        </label>
                        <label className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer border border-gray-100">
                            <input type="checkbox" className="w-4 h-4 text-honeywell-red focus:ring-honeywell-red" 
                                checked={checks.connections} onChange={e => setChecks({...checks, connections: e.target.checked})} />
                            <span className="text-sm text-gray-700">Conexiones hidráulicas sin fugas</span>
                        </label>
                        <label className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer border border-gray-100">
                            <input type="checkbox" className="w-4 h-4 text-honeywell-red focus:ring-honeywell-red" 
                                checked={checks.safety} onChange={e => setChecks({...checks, safety: e.target.checked})} />
                            <span className="text-sm text-gray-700 font-bold text-red-700">Candado de seguridad retirado</span>
                        </label>
                    </div>
                    
                    <button 
                        onClick={confirmFinishJob}
                        disabled={!checks.cleaned || !checks.greased || !checks.connections || !checks.safety}
                        className="w-full mt-6 bg-honeywell-red text-white font-bold py-3 rounded-sm uppercase text-xs hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                        Confirmar y Liberar Molde
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- MODAL DE BITÁCORA (Con Fotos) --- */}
      {isChatOpen && chatJob && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white w-full max-w-lg h-[500px] flex flex-col rounded-sm shadow-2xl">
                <div className="p-4 border-b border-gray-200 bg-gray-900 text-white flex justify-between items-center rounded-t-sm">
                    <div>
                        <h3 className="font-bold uppercase text-sm flex items-center">
                            <MessageSquare className="w-4 h-4 mr-2 text-honeywell-red"/> Bitácora de Incidencias
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">{chatJob.mold}</p>
                    </div>
                    <button onClick={() => setIsChatOpen(false)}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
                </div>

                <div className="flex-1 bg-gray-50 p-4 overflow-y-auto space-y-4">
                    {(!chatJob.comments || chatJob.comments.length === 0) && (
                        <div className="text-center text-gray-400 text-xs italic mt-10">
                            <p>No hay comentarios registrados.</p>
                        </div>
                    )}
                    
                    {chatJob.comments && chatJob.comments.map((msg) => (
                        <div key={msg.id} className={`flex flex-col ${msg.author === user.name ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[85%] rounded-sm p-3 shadow-sm border ${msg.role === 'Alerta' ? 'bg-red-50 border-red-200' : msg.author === user.name ? 'bg-white border-blue-200' : 'bg-white border-gray-200'}`}>
                                <div className="flex justify-between items-center mb-1 gap-4">
                                    <span className={`text-[10px] font-bold uppercase ${msg.role === 'Alerta' ? 'text-red-700' : msg.author === user.name ? 'text-blue-700' : 'text-gray-600'}`}>
                                        {msg.author} ({msg.role})
                                    </span>
                                    <span className="text-[9px] text-gray-400">{msg.date}</span>
                                </div>
                                <p className={`text-sm leading-snug ${msg.role === 'Alerta' ? 'text-red-800 font-bold' : 'text-gray-800'}`}>{msg.text}</p>
                                
                                {/* VISUALIZACIÓN DE IMAGEN EN EL CHAT */}
                                {msg.image && (
                                    <div className="mt-2">
                                        <img src={msg.image} alt="Evidencia" className="rounded-sm border border-gray-200 w-full h-auto max-h-40 object-cover" />
                                        <p className="text-[9px] text-gray-400 mt-1 flex items-center"><Camera className="w-3 h-3 mr-1"/> Evidencia fotográfica adjunta</p>
                                    </div>
                                )}

                            </div>
                        </div>
                    ))}
                </div>

                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            className="flex-1 border border-gray-300 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-honeywell-red"
                            placeholder="Escribe una observación..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                        />
                        <button type="submit" className="bg-honeywell-red hover:bg-red-700 text-white px-4 rounded-sm transition-colors"><Send className="w-4 h-4" /></button>
                    </div>
                </form>
            </div>
         </div>
      )}
    </div>
  );
}