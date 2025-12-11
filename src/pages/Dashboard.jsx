import React, { useEffect, useState } from 'react';
import { Users, AlertCircle, Clock, TrendingUp, Activity, Server } from 'lucide-react';
import { getStoredUsers, getMoves } from '../utils/storage';
// Importamos los componentes gráficos
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Dashboard() {
  const [kpi, setKpi] = useState({ 
    totalUsers: 0, 
    activeMoves: 0, 
    avgDowntime: 0,
    totalDowntime: 0 
  });

  const [charts, setCharts] = useState({
    topMolds: [],
    priorities: []
  });

  // Colores Corporativos (Honeywell Red + Escala de Grises/Azules)
  const COLORS = ['#EE3124', '#374151', '#9CA3AF', '#D1D5DB'];

  useEffect(() => {
    const users = getStoredUsers();
    const moves = getMoves();
    
    // 1. CÁLCULO DE KPIs (Tarjetas de arriba)
    const activeMoves = moves.filter(m => m.status !== 'Listo');
    const completedMoves = moves.filter(m => m.status === 'Listo' && m.duration);

    let totalMinutes = 0;
    completedMoves.forEach(m => totalMinutes += (m.duration / 60000));
    const avg = completedMoves.length > 0 ? Math.round(totalMinutes / completedMoves.length) : 0;

    setKpi({
      totalUsers: users.length,
      activeMoves: activeMoves.length,
      avgDowntime: avg,
      totalDowntime: Math.round(totalMinutes)
    });

    // 2. PREPARAR DATOS PARA GRÁFICAS

    // A) Gráfica de Barras: Top 5 Moldes con más fallas/solicitudes
    const moldCounts = {};
    moves.forEach(m => {
        moldCounts[m.mold] = (moldCounts[m.mold] || 0) + 1;
    });

    const topMoldsData = Object.keys(moldCounts)
        .map(key => ({ name: key, solicitudes: moldCounts[key] }))
        .sort((a, b) => b.solicitudes - a.solicitudes)
        .slice(0, 5); // Solo los top 5

    // B) Gráfica de Pastel: Distribución por Prioridad
    const p1 = moves.filter(m => m.priority === 1).length;
    const p2 = moves.filter(m => m.priority === 2).length;
    const p3 = moves.filter(m => m.priority === 3).length;
    const others = moves.length - (p1 + p2 + p3);

    const priorityData = [
        { name: 'Urgente (P1)', value: p1 },
        { name: 'Alta (P2)', value: p2 },
        { name: 'Normal (P3)', value: p3 },
        { name: 'Baja', value: others }
    ].filter(item => item.value > 0); // Solo mostrar si hay datos

    setCharts({ topMolds: topMoldsData, priorities: priorityData });

  }, []);

  // Componente de Tarjeta KPI
  const Card = ({ title, value, subtext, icon: Icon, colorClass }) => (
    <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200 border-l-4" style={{ borderLeftColor: colorClass }}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{title}</p>
          <h3 className="text-3xl font-bold text-gray-800 mt-2">{value}</h3>
          {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
        </div>
        <div className={`p-2 rounded-sm bg-gray-50`}>
          <Icon className="w-6 h-6 text-gray-400" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 1. SECCIÓN DE TARJETAS KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card title="Personal" value={kpi.totalUsers} icon={Users} colorClass="#6B7280" />
        <Card title="Máquinas Paradas" value={kpi.activeMoves} subtext="Mantenimiento en curso" icon={AlertCircle} colorClass="#EE3124" />
        <Card title="Tiempo Promedio" value={`${kpi.avgDowntime} min`} subtext="Por reparación" icon={Clock} colorClass="#F59E0B" />
        <Card title="Tiempo Total" value={`${kpi.totalDowntime} min`} subtext="Acumulado histórico" icon={TrendingUp} colorClass="#10B981" />
      </div>

      {/* 2. SECCIÓN DE GRÁFICAS VISUALES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* GRÁFICA DE BARRAS: MOLDES MÁS PROBLEMÁTICOS */}
        <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200">
            <h3 className="text-sm font-bold text-gray-800 uppercase mb-6 flex items-center">
                <Activity className="w-4 h-4 mr-2 text-honeywell-red" /> Moldes con Mayor Frecuencia de Falla
            </h3>
            <div className="h-64 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.topMolds} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 10}} />
                        <Tooltip contentStyle={{ borderRadius: '2px', borderColor: '#eee' }} cursor={{fill: '#f9fafb'}} />
                        <Bar dataKey="solicitudes" fill="#1A1A1A" barSize={20} radius={[0, 4, 4, 0]}>
                            {/* Pintamos la barra top de rojo */}
                            {charts.topMolds.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? '#EE3124' : '#374151'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* GRÁFICA DE PASTEL: DISTRIBUCIÓN DE PRIORIDAD */}
        <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200">
            <h3 className="text-sm font-bold text-gray-800 uppercase mb-6 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 text-honeywell-red" /> Distribución de Gravedad
            </h3>
            <div className="h-64 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={charts.priorities}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {charts.priorities.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} iconType="square"/>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* 3. FOOTER TÉCNICO */}
      <div className="bg-white p-4 rounded-sm shadow-sm border border-gray-200 mt-6 flex justify-between items-center">
        <div className="flex items-center text-sm">
            <Server className="w-4 h-4 mr-2 text-green-600" /> 
            <span className="text-gray-600">Servidor Local: <span className="font-bold text-green-700">EN LÍNEA</span></span>
        </div>
        <span className="text-[10px] text-gray-400 uppercase font-bold">Analytics Engine v2.0</span>
      </div>
    </div>
  );
}