import React, { useState, useEffect } from 'react';
import { Search, FileText, Download, Calendar, Filter, User, MessageSquare, X } from 'lucide-react';
import { getMoves } from '../utils/storage';

export default function History() {
  const [moves, setMoves] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMoves, setFilteredMoves] = useState([]);

  // Estado para el visor de chat histórico
  const [selectedChat, setSelectedChat] = useState(null);

  useEffect(() => {
    // Cargar solo los movimientos que están "Listo" (Terminados)
    const allMoves = getMoves();
    const history = allMoves.filter(m => m.status === 'Listo').sort((a, b) => b.endTime - a.endTime);
    setMoves(history);
    setFilteredMoves(history);
  }, []);

  // Lógica del Buscador
  useEffect(() => {
    const results = moves.filter(m => 
      m.mold.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.completedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.requestDate.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredMoves(results);
  }, [searchTerm, moves]);

  // Formato de Duración
  const formatDuration = (ms) => {
    if (!ms) return '-';
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins} min`;
  };

  const exportToCSV = () => {
    const headers = ["ID,Molde,Prioridad,Solicitado Por,Fecha Solicitud,Realizado Por,Duracion,Comentarios"];
    const rows = filteredMoves.map(m => {
        const commentCount = m.comments ? m.comments.length : 0;
        return `${m.id},${m.mold},${m.priority},${m.requestedBy},"${m.requestDate}",${m.completedBy},${formatDuration(m.duration)},${commentCount} msgs`
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "historial_mantenimiento_honeywell.csv");
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header del Historial */}
      <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 uppercase flex items-center">
            <FileText className="w-6 h-6 mr-2 text-honeywell-red" /> Historial Global
          </h2>
          <p className="text-xs text-gray-500 mt-1">Registro histórico y bitácoras de comunicación.</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Buscar registro..." 
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-honeywell-red"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <button 
                onClick={exportToCSV}
                className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-sm text-xs font-bold uppercase flex items-center transition-colors"
            >
                <Download className="w-4 h-4 mr-2" /> Exportar
            </button>
        </div>
      </div>

      {/* Tabla de Registros */}
      <div className="bg-white rounded-sm shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-4">Molde / ID</th>
              <th className="px-6 py-4">Fecha Solicitud</th>
              <th className="px-6 py-4">Técnico</th>
              <th className="px-6 py-4 text-center">Bitácora</th>
              <th className="px-6 py-4 text-center">Tiempo Total</th>
              <th className="px-6 py-4 text-right">Estado Final</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {filteredMoves.length === 0 && (
                <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-400 italic">
                        No se encontraron registros.
                    </td>
                </tr>
            )}
            {filteredMoves.map(m => (
              <tr key={m.id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-800">{m.mold}</span>
                    <span className="text-[10px] text-gray-400 font-mono">ID: {m.id}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">
                    <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-2 text-gray-400"/>
                        {m.requestDate}
                    </div>
                </td>
                <td className="px-6 py-4">
                    <div className="flex items-center">
                        <User className="w-3 h-3 mr-2 text-gray-400"/>
                        <span className="font-medium">{m.completedBy}</span>
                    </div>
                </td>
                <td className="px-6 py-4 text-center">
                    {/* Botón para ver Chat */}
                    <button 
                        onClick={() => setSelectedChat(m)}
                        className={`p-2 rounded-sm transition-colors relative ${
                            m.comments && m.comments.length > 0 
                            ? 'text-blue-600 hover:bg-blue-50' 
                            : 'text-gray-300 cursor-not-allowed'
                        }`}
                        disabled={!m.comments || m.comments.length === 0}
                        title={m.comments && m.comments.length > 0 ? "Ver conversación" : "Sin comentarios"}
                    >
                        <MessageSquare className="w-5 h-5" />
                        {m.comments && m.comments.length > 0 && (
                            <span className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full">
                                {m.comments.length}
                            </span>
                        )}
                    </button>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold">
                    {formatDuration(m.duration)}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="px-2 py-1 text-[10px] font-bold uppercase rounded-sm bg-green-100 text-green-700 border border-green-200">
                    Completado
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="text-center text-xs text-gray-400">
        Registros históricos: {filteredMoves.length}
      </div>

      {/* --- MODAL VISOR DE CHAT (Solo Lectura) --- */}
      {selectedChat && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white w-full max-w-lg h-[500px] flex flex-col rounded-sm shadow-2xl">
                {/* Header Modal */}
                <div className="p-4 border-b border-gray-200 bg-gray-900 text-white flex justify-between items-center rounded-t-sm">
                    <div>
                        <h3 className="font-bold uppercase text-sm flex items-center">
                            <FileText className="w-4 h-4 mr-2 text-honeywell-red"/> Registro de Conversación
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">Archivo histórico - Solo lectura</p>
                    </div>
                    <button onClick={() => setSelectedChat(null)}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
                </div>

                {/* Área de Mensajes */}
                <div className="flex-1 bg-gray-50 p-4 overflow-y-auto space-y-4">
                    {selectedChat.comments && selectedChat.comments.map((msg) => (
                        <div key={msg.id} className="flex flex-col items-start">
                            <div className="w-full bg-white rounded-sm p-3 shadow-sm border border-gray-200">
                                <div className="flex justify-between items-center mb-1 border-b border-gray-100 pb-1">
                                    <span className="text-[10px] font-bold uppercase text-gray-600">
                                        {msg.author} <span className="text-gray-400">({msg.role})</span>
                                    </span>
                                    <span className="text-[9px] text-gray-400">{msg.date}</span>
                                </div>
                                <p className="text-sm text-gray-800 leading-snug mt-1">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Modal */}
                <div className="p-4 border-t border-gray-200 bg-gray-100 text-center">
                    <button 
                        onClick={() => setSelectedChat(null)}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-sm text-xs font-bold uppercase"
                    >
                        Cerrar Historial
                    </button>
                </div>
            </div>
         </div>
      )}

    </div>
  );
}