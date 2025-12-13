import React, { useState, useEffect } from 'react';
import { ClipboardList, Wrench, CheckCircle, Clock, AlertTriangle, PlayCircle, Timer, ListChecks, X, MessageSquare, Send, ShieldAlert, AlertOctagon, Camera, Image as ImageIcon } from 'lucide-react';
import { getSession } from '../utils/storage'; // Mantenemos storage SOLO para la sesión local

// IMPORTACIONES DE FIREBASE
import { db } from '../firebaseConfig';
import { collection, addDoc, updateDoc, doc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';

export default function MoldSystem() {
  const [user, setUser] = useState(getSession());
  const [moves, setMoves] = useState([]);
  
  // Lista de Moldes (Podríamos ponerla en DB también, pero por ahora estática está bien)
  const moldsList = [
      { id: 'M-101', name: 'Molde Carcasa A1' },
      { id: 'M-102', name: 'Molde Sensor B2' },
      { id: 'M-103', name: 'Molde Lente C3' },
      { id: 'M-104', name: 'Molde Base D4' },
  ];

  // Estados
  const [selectedMold, setSelectedMold] = useState('');
  const [priority, setPriority] = useState('3');
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [finishingJobId, setFinishingJobId] = useState(null);
  const [checks, setChecks] = useState({ cleaned: false, greased: false, connections: false, safety: false });
  
  // Chat y Daños
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatJob, setChatJob] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [isDamageModalOpen, setIsDamageModalOpen] = useState(false);
  const [damageJobId, setDamageJobId] = useState(null);
  const [damageDescription, setDamageDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  // --- CONEXIÓN REAL-TIME CON FIREBASE ---
  useEffect(() => {
    // Escuchar la colección "moves" ordenados por fecha
    const q = query(collection(db, "moves"), orderBy("startTime", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const movesData = snapshot.docs.map(doc => ({
        id: doc.id, // Firestore usa IDs de texto, no números
        ...doc.data()
      }));
      setMoves(movesData);
      
      // Actualizar chat abierto en tiempo real si existe
      if (chatJob) {
        const updatedChat = movesData.find(m => m.id === chatJob.id);
        if (updatedChat) setChatJob(updatedChat);
      }
    });

    return () => unsubscribe(); // Limpiar conexión al salir
  }, [chatJob]);


  const formatDuration = (ms) => {
    if (!ms) return 'N/A';
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins} min`;
  };

  // --- ACCIONES CON BASE DE DATOS ---

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!selectedMold) return;
    
    // Guardar en Firestore
    await addDoc(collection(db, "moves"), {
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
    });

    alert('Solicitud enviada a la Nube.');
    setSelectedMold('');
  };

  const handleStartJob = async (id) => {
    const jobRef = doc(db, "moves", id);
    await updateDoc(jobRef, { status: 'En Proceso' });
  };

  const confirmFinishJob = async () => {
    const end = Date.now();
    // Necesitamos obtener el startTime original para calcular duración
    const job = moves.find(m => m.id === finishingJobId);
    
    const jobRef = doc(db, "moves", finishingJobId);
    await updateDoc(jobRef, { 
      status: 'Listo',
      endTime: end,
      duration: end - job.startTime,
      completedBy: user.name
    });
    
    setIsChecklistOpen(false);
  };

  const handleDelete = async (id) => {
    if(window.confirm("¿Eliminar registro permanentemente de la base de datos?")) {
      await deleteDoc(doc(db, "moves", id));
    }
  };

  // --- CHAT Y COMENTARIOS EN FIREBASE ---
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    const comment = {
        id: Date.now(),
        author: user.name,
        role: user.role,
        text: newMessage,
        image: null,
        date: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) + ' ' + new Date().toLocaleDateString()
    };

    const jobRef = doc(db, "moves", chatJob.id);
    // Firestore requiere copiar el array actual y agregar el nuevo (o usar arrayUnion)
    const currentComments = chatJob.comments || [];
    await updateDoc(jobRef, {
        comments: [...currentComments, comment]
    });

    setNewMessage('');
  };

  const saveDamageReport = async () => {
    if (!damageDescription.trim()) return;

    const report = {
        text: damageDescription,
        hasImage: !!selectedImage,
        reportedBy: user.name,
        date: new Date().toLocaleString()
    };

    const jobRef = doc(db, "moves", damageJobId);
    
    // Actualizamos el reporte Y agregamos un comentario al chat
    const alertComment = {
        id: Date.now(),
        author: 'SISTEMA',
        role: 'Alerta',
        text: `⚠️ REPORTE DE DAÑO: ${damageDescription}`,
        image: selectedImage,
        date: new Date().toLocaleString()
    };
    
    // Buscamos el job actual para obtener sus comentarios previos
    const currentJob = moves.find(m => m.id === damageJobId);
    const currentComments = currentJob.comments || [];

    await updateDoc(jobRef, {
        damageReport: report,
        comments: [...currentComments, alertComment]
    });

    setIsDamageModalOpen(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        if (file.size > 1 * 1024 * 1024) { // Limitar a 1MB para Firestore
            alert('Imagen muy grande. Máximo 1MB.');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => setSelectedImage(reader.result);
        reader.readAsDataURL(file);
    }
  };

  // Funciones de apertura de modales (Igual que antes)
  const openFinishChecklist = (id) => {
    setFinishingJobId(id);
    setChecks({ cleaned: false, greased: false, connections: false, safety: false });
    setIsChecklistOpen(true);
  };
  const openChat = (job) => {
    setChatJob(job);
    setNewMessage('');
    setIsChatOpen(true);
  };
  const openDamageModal = (id) => {
    setDamageJobId(id);
    setDamageDescription('');
    setSelectedImage(null);
    setIsDamageModalOpen(true);
  };

  // --- RENDERS (VISTAS) ---
  const renderSupervisorView = () => {
    const pending = moves.filter(m => m.status !== 'Listo');
    const ready = moves.filter(m => m.status === 'Listo');

    return (
      <div className="space-y-8">
        {/* Formulario */}
        <div className="bg-white p-6 border-t-4 border-honeywell-red shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 uppercase mb-4 flex items-center">
            <Timer className="w-5 h-5 mr-2 text-honeywell-red" /> Reportar Paro / Solicitar Molde (DB)
          </h3>
          <form onSubmit={handleRequest} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Molde</label>
              <select className="w-full border p-2 rounded-sm bg-gray-50" value={selectedMold} onChange={e => setSelectedMold(e.target.value)}>
                <option value="">-- Seleccione --</option>
                {moldsList.map(m => <option key={m.id} value={m.name}>{m.id} - {m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Prioridad</label>
              <select className="w-full border p-2 rounded-sm bg-gray-50" value={priority} onChange={e => setPriority(e.target.value)}>
                <option value="1">1 - URGENTE</option>
                <option value="2">2 - Alta</option>
                <option value="3">3 - Normal</option>
              </select>
            </div>
            <button type="submit" className="bg-honeywell-red text-white font-bold py-2 px-4 rounded-sm uppercase text-sm hover:bg-red-700">
              Enviar a Nube
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Listos */}
          <div className="bg-white border border-gray-200 shadow-sm">
            <div className="bg-green-600 text-white p-3 font-bold uppercase text-sm flex justify-between">
              <span>Terminados (Histórico)</span>
              <CheckCircle className="w-5 h-5" />
            </div>
            <div className="p-4 space-y-3">
              {ready.length === 0 && <p className="text-gray-400 text-sm italic">Cargando datos...</p>}
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
              <span>En Vivo (Real-Time)</span>
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
                        {m.damageReport && (
                            <div className="bg-red-100 text-red-700 px-2 py-1 rounded text-[10px] font-bold border border-red-200 flex items-center animate-pulse">
                                <AlertOctagon className="w-3 h-3 mr-1" /> DAÑO
                            </div>
                        )}
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${m.priority === 1 ? 'bg-red-100 text-red-600' : 'bg-gray-100'}`}>P{m.priority}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                     <button onClick={() => openChat(m)} className="text-gray-400 hover:text-blue-600 text-xs flex items-center">
                        <MessageSquare className="w-4 h-4 mr-1" /> Chat
                     </button>
                     {user.role === 'Administrador' && <button onClick={() => handleDelete(m.id)} className="text-red-500 hover:underline text-xs flex items-center"><AlertTriangle className="w-3 h-3 mr-1"/> Borrar</button>}
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
              <Wrench className="w-5 h-5 mr-2 text-honeywell-red" /> Trabajos Activos (Sincronizado)
            </h3>
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-bold border border-red-200">
              {pendingJobs.length} Paros
            </span>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 text-gray-500 uppercase font-bold text-xs">
              <tr>
                <th className="p-4">Prio</th>
                <th className="p-4">Molde</th>
                <th className="p-4">Estado</th>
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
                      {m.damageReport && <div className="text-red-600 text-[10px] font-bold uppercase"><AlertOctagon className="w-3 h-3 inline"/> Daño</div>}
                  </td>
                  <td className="p-4">
                     <span className={`text-xs font-bold uppercase ${m.status === 'En Proceso' ? 'text-blue-600' : 'text-orange-500'}`}>{m.status}</span>
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button onClick={() => openChat(m)} className="text-gray-400 hover:text-blue-600 p-1"><MessageSquare className="w-5 h-5" /></button>
                    {!m.damageReport && m.status !== 'Listo' && (
                        <button onClick={() => openDamageModal(m.id)} className="text-gray-400 hover:text-red-600 p-1"><ShieldAlert className="w-5 h-5" /></button>
                    )}
                    {m.status === 'Pendiente' && (
                      <button onClick={() => handleStartJob(m.id)} className="bg-blue-600 text-white px-2 py-1 rounded-sm text-xs font-bold hover:bg-blue-700">Atender</button>
                    )}
                    {m.status === 'En Proceso' && (
                      <button onClick={() => openFinishChecklist(m.id)} className="bg-green-600 text-white px-2 py-1 rounded-sm text-xs font-bold hover:bg-green-700">Finalizar</button>
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

      {/* --- MODALES (Iguales que antes) --- */}
      {/* 1. Modal Daño */}
      {isDamageModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white w-full max-w-md rounded-sm shadow-2xl border-t-4 border-red-600 p-6">
                <h3 className="font-bold text-red-800 uppercase text-sm mb-4">Reportar Daño</h3>
                <textarea className="w-full border p-2 mb-4" value={damageDescription} onChange={e=>setDamageDescription(e.target.value)} placeholder="Descripción..."></textarea>
                <input type="file" accept="image/*" onChange={handleImageChange} className="mb-4 text-xs"/>
                <div className="flex justify-end gap-2">
                    <button onClick={()=>setIsDamageModalOpen(false)} className="px-3 py-1 border text-xs font-bold">Cancelar</button>
                    <button onClick={saveDamageReport} className="px-3 py-1 bg-red-600 text-white text-xs font-bold">Guardar</button>
                </div>
            </div>
        </div>
      )}

      {/* 2. Modal Checklist */}
      {isChecklistOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white w-full max-w-md rounded-sm shadow-2xl border-t-4 border-honeywell-red p-6">
                 <h3 className="font-bold uppercase text-sm mb-4">Validación</h3>
                 <div className="space-y-2 mb-4">
                    <label className="flex gap-2"><input type="checkbox" checked={checks.cleaned} onChange={e=>setChecks({...checks, cleaned: e.target.checked})}/> Limpieza</label>
                    <label className="flex gap-2"><input type="checkbox" checked={checks.greased} onChange={e=>setChecks({...checks, greased: e.target.checked})}/> Engrase</label>
                    <label className="flex gap-2"><input type="checkbox" checked={checks.connections} onChange={e=>setChecks({...checks, connections: e.target.checked})}/> Conexiones</label>
                    <label className="flex gap-2"><input type="checkbox" checked={checks.safety} onChange={e=>setChecks({...checks, safety: e.target.checked})}/> Candado Retirado</label>
                 </div>
                 <button onClick={confirmFinishJob} disabled={!checks.cleaned || !checks.greased || !checks.connections || !checks.safety} className="w-full bg-honeywell-red text-white py-2 font-bold disabled:bg-gray-300">CONFIRMAR</button>
                 <button onClick={()=>setIsChecklistOpen(false)} className="w-full mt-2 text-gray-500 text-xs">Cancelar</button>
            </div>
        </div>
      )}

      {/* 3. Modal Chat */}
      {isChatOpen && chatJob && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white w-full max-w-lg h-[500px] flex flex-col rounded-sm shadow-2xl">
                <div className="p-4 bg-gray-900 text-white flex justify-between">
                    <h3>Chat: {chatJob.mold}</h3>
                    <button onClick={()=>setIsChatOpen(false)}><X className="w-4 h-4"/></button>
                </div>
                <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-3">
                    {chatJob.comments?.map(msg => (
                        <div key={msg.id} className={`p-2 rounded border max-w-[80%] ${msg.author===user.name ? 'ml-auto bg-white border-blue-200' : 'mr-auto bg-white'}`}>
                            <p className="text-xs font-bold">{msg.author}</p>
                            <p className="text-sm">{msg.text}</p>
                            {msg.image && <img src={msg.image} className="w-full mt-2 rounded"/>}
                        </div>
                    ))}
                </div>
                <form onSubmit={handleSendMessage} className="p-4 bg-white border-t flex gap-2">
                    <input type="text" className="flex-1 border p-2" value={newMessage} onChange={e=>setNewMessage(e.target.value)} placeholder="Mensaje..."/>
                    <button type="submit" className="bg-honeywell-red text-white px-4"><Send className="w-4 h-4"/></button>
                </form>
            </div>
         </div>
      )}
    </div>
  );
}