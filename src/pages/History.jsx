import React, { useState, useEffect } from 'react';
import { Search, FileText, Download, Calendar, Filter, User } from 'lucide-react';
import { getMoves } from '../utils/storage';

export default function History() {
  const [moves, setMoves] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMoves, setFilteredMoves] = useState([]);

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

  // Función para Exportar a CSV (Excel)
  const exportToCSV = () => {
    const headers = ["ID,Molde,Prioridad,Solicitado Por,Fecha Solicitud,Realizado Por,Duracion"];
    const rows = filteredMoves.map(m => 
        `${m.id},${m.mold},${m.priority},${m.requestedBy},"${m.requestDate}",${m.completedBy},${formatDuration(m.duration)}`
    );
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
          <p className="text-xs text-gray-500 mt-1">Registro histórico de todas las configuraciones finalizadas.</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
             {/* Buscador */}
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Buscar molde, técnico o fecha..." 
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:border-honeywell-red"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            {/* Botón Exportar */}
            <button 
                onClick={exportToCSV}
                className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-sm text-xs font-bold uppercase flex items-center transition-colors"
                title="Descargar Excel"
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
              <th className="px-6 py-4">Técnico (Mantenimiento)</th>
              <th className="px-6 py-4 text-center">Tiempo Total</th>
              <th className="px-6 py-4 text-right">Estado Final</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {filteredMoves.length === 0 && (
                <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-400 italic">
                        No se encontraron registros en el historial.
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
        Mostrando {filteredMoves.length} registros de {moves.length} totales.
      </div>
    </div>
  );
}