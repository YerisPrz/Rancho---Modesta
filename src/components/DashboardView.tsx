import { User, ProductionRecord, ExpenseRecord, PropertyRecord } from '../types';
import {
  TrendingUp,
  Wallet,
  Home,
  ArrowUpRight,
  Sprout,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  PieChart as PieIcon,
  Layers
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface DashboardViewProps {
  production: ProductionRecord[];
  expenses: ExpenseRecord[];
  properties: PropertyRecord[];
  currentUser: User;
  onNavigate: (tab: string) => void;
}

export function DashboardView({
  production,
  expenses,
  properties,
  currentUser,
  onNavigate
}: DashboardViewProps) {
  
  // Dynamic verification for financial display
  const showFinances =
    currentUser.role === 'Admin' ||
    (currentUser.role === 'Miembro' && currentUser.username.toLowerCase() === 'maria');

  // --- CHART CALCULATIONS FOR THE DASHBOARD ---
  // 1. Group production by product
  const productAggMap: { [product: string]: { revenue: number; cost: number; quantity: number; count: number } } = {};
  production.forEach(p => {
    if (!productAggMap[p.product]) {
      productAggMap[p.product] = { revenue: 0, cost: 0, quantity: 0, count: 0 };
    }
    productAggMap[p.product].revenue += p.revenue;
    productAggMap[p.product].cost += p.cost;
    productAggMap[p.product].quantity += p.quantity;
    productAggMap[p.product].count += 1;
  });

  const topCropsChartData = Object.keys(productAggMap)
    .map(key => ({
      name: key,
      Ingresos: productAggMap[key].revenue,
      Costos: productAggMap[key].cost,
      Cantidad: productAggMap[key].quantity,
      lotes: productAggMap[key].count
    }))
    .sort((a, b) => b.Cantidad - a.Cantidad)
    .slice(0, 5);

  // 2. Group production by conuco/location for distribution
  const locationAggMap: { [loc: string]: number } = {};
  production.forEach(p => {
    locationAggMap[p.location] = (locationAggMap[p.location] || 0) + p.quantity;
  });

  const locationChartData = Object.keys(locationAggMap).map(key => ({
    name: key,
    value: locationAggMap[key]
  })).sort((a, b) => b.value - a.value);

  // Group direct expenses by category for pie representation
  const expenseCatMap: { [cat: string]: number } = {};
  expenses.forEach(e => {
    expenseCatMap[e.category] = (expenseCatMap[e.category] || 0) + e.amount;
  });

  const expensePieData = Object.keys(expenseCatMap).map(key => ({
    name: key,
    value: expenseCatMap[key]
  })).sort((a, b) => b.value - a.value).slice(0, 5);

  const PIE_COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#a855f7', '#6366f1', '#14b8a6'];

  const customTooltipStyle = {
    contentStyle: {
      backgroundColor: '#0f172a',
      borderRadius: '12px',
      border: '1px solid #1e293b',
      color: '#f8fafc',
      fontSize: '11px',
      padding: '8px 12px',
    },
    labelStyle: {
      fontWeight: 'bold',
      color: '#fbbf24',
      marginBottom: '4px',
    }
  };


  // 1. Calculations if Authorized
  const totalRevenue = production.reduce((acc, p) => acc + p.revenue, 0);
  const totalProductionCost = production.reduce((acc, p) => acc + p.cost, 0);
  const totalDirectExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const totalExpenses = totalProductionCost + totalDirectExpenses;
  
  // Property rents
  const totalRentBilled = properties.reduce((acc, p) => acc + p.monthlyRent, 0);
  const totalRentMora = properties.reduce((acc, p) => acc + p.debt, 0);
  const propertiesMoraCount = properties.filter(p => p.status === 'En Mora').length;

  // Net Balance
  const netBalance = totalRevenue - totalExpenses;

  // 2. Calculations for Workers (Non-financial metrics)
  const totalHarvestCount = production.length;
  const totalUnitsHarvested = production.reduce((acc, p) => acc + p.quantity, 0);
  
  // Find which location has the most harvests
  const locationsMap: { [key: string]: number } = {};
  production.forEach(p => {
    locationsMap[p.location] = (locationsMap[p.location] || 0) + 1;
  });
  let topLocation = 'Ninguno';
  let maxCount = 0;
  Object.keys(locationsMap).forEach(loc => {
    if (locationsMap[loc] > maxCount) {
      maxCount = locationsMap[loc];
      topLocation = loc;
    }
  });

  // Recent activity logs compiled
  // For admins, we mix production and expenses. For workers, we ONLY show production harvests without money!
  const combinedActivities = showFinances
    ? [
        ...production.map(p => ({
          type: 'production',
          title: `Cosecha de ${p.product}`,
          amount: p.revenue,
          subtitle: `${p.quantity} ${p.unit} en ${p.location}`,
          date: p.date,
          profit: p.revenue - p.cost
        })),
        ...expenses.map(e => ({
          type: 'expense',
          title: e.description,
          amount: -e.amount,
          subtitle: `Categoría: ${e.category}`,
          date: e.date,
          profit: null
        }))
      ].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)
    : production.map(p => ({
        type: 'production',
        title: `Cosecha de ${p.product}`,
        amount: null, // Private
        subtitle: `${p.quantity} ${p.unit} en ${p.location}`,
        date: p.date,
        profit: null
      })).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  // Dynamic greeting based on current local time
  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return '¡Buenos días';
    if (hours < 18) return '¡Buenas tardes';
    return '¡Buenas noches';
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-in fade-in duration-200 font-sans">
      
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-emerald-500/10 border border-emerald-500/20 p-5 sm:p-6 rounded-2xl relative overflow-hidden shadow-sm">
        <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/10 rounded-full filter blur-2xl -z-10" />
        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {getGreeting()}, {currentUser.fullName}!
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-350 max-w-xl leading-relaxed">
            {showFinances 
              ? 'Bienvenido al portal de administración de Rancho Modesta. Tienes acceso completo para supervisar cosechas, egresos directos, cuentas compartidas y estado de alquileres familiares.'
              : 'Bienvenido al portal operativo de Rancho Modesta. Registra los lotes de cosecha del día, monitorea los conucos locales y consulta las bitácoras autorizadas.'
            }
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2py-1 px-3 py-1.5 rounded border border-emerald-55 border-emerald-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Acceso: {currentUser.role}
          </span>
        </div>
      </div>

      {/* KPI WIDGETS DECK */}
      {showFinances ? (
        // Authorized Admin/Finance KPIs Deck
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* KPI 1: Ingresos de Cosechas */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                PRODUCCIÓN <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Ingresos Cosechas</span>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-mono mt-1">{totalRevenue.toLocaleString()} RD$</h3>
              <span className="text-[9px] text-slate-400 font-mono mt-1 block">Recaudado bruto agrícola</span>
            </div>
          </div>

          {/* KPI 2: Gastos Totales */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="p-2.5 bg-rose-500/10 text-rose-605 text-rose-600 dark:text-rose-450 rounded-xl">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-[9px] text-rose-650 dark:text-rose-400 font-bold bg-rose-500/5 px-2 py-0.5 rounded border border-rose-500/20">
                EGRESOS
              </span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Egresos Totales</span>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-mono mt-1">{totalExpenses.toLocaleString()} RD$</h3>
              <div className="text-[9px] text-slate-400 flex justify-between mt-1 font-mono">
                <span>Prod: {totalProductionCost.toLocaleString()}</span>
                <span>•</span>
                <span>Caja: {totalDirectExpenses.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* KPI 3: Ganancia Neta */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${netBalance >= 0 ? 'text-emerald-600 border-emerald-400/20 bg-emerald-500/5' : 'text-rose-600 border-rose-400/20 bg-rose-500/5'}`}>
                {netBalance >= 0 ? 'SUPERÁVIT' : 'DÉFICIT'}
              </span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Retorno Neto Agrícola</span>
              <h3 className={`text-2xl font-bold font-mono mt-1 ${netBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-650 dark:text-rose-400'}`}>
                {netBalance.toLocaleString()} RD$
              </h3>
              <span className="text-[9px] text-slate-400 font-mono mt-1 block">Rendimiento neto de conucos</span>
            </div>
          </div>

          {/* KPI 4: Rentas / Propiedades */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="p-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                <Home className="w-5 h-5" />
              </div>
              <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/20">
                ALQUILERES
              </span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Rentas del Mes</span>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-mono mt-1">{totalRentBilled.toLocaleString()} RD$</h3>
              <div className="text-[9px] text-rose-600 dark:text-rose-405 flex justify-between mt-1 font-mono">
                <span className="font-semibold">Exigible en Mora: {totalRentMora.toLocaleString()} RD$</span>
              </div>
            </div>
          </div>

        </div>
      ) : (
        // Worker Operation-focused KPIs Deck (Zero Dollars)
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Total Cosechas Lotes */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <Sprout className="w-5 h-5" />
              </div>
              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                REGISTROS 🚜
              </span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Lotes Cosechados</span>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-mono mt-1">{totalHarvestCount} envíos</h3>
              <span className="text-[9px] text-slate-400 font-mono mt-1 block">Historial de cargas agrícolas</span>
            </div>
          </div>

          {/* Card 2: Total Unidades */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="text-[9px] text-blue-600 dark:text-blue-455 font-bold bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/20">
                RECOGIDA
              </span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Unidades Recogidas</span>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-mono mt-1">{totalUnitsHarvested.toLocaleString()}</h3>
              <span className="text-[9px] text-slate-400 font-mono mt-1 block">Agregado bruto de productos</span>
            </div>
          </div>

          {/* Card 3: Mayor Actividad Local */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="p-2.5 bg-indigo-500/10 text-indigo-500 rounded-xl">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/20">
                TEMPORADA
              </span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Conuco de Mayor Carga</span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate mt-1">{topLocation}</h3>
              <span className="text-[9px] text-slate-400 font-mono mt-1 block">Ubicación con más recolecciones</span>
            </div>
          </div>

          {/* Card 4: Seguridad y Rol */}
          <div className="p-5 rounded-2xl bg-slate-105 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 rounded-xl">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Estatus</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Nivel Operario</span>
              <h3 className="text-sm font-bold text-slate-800 dark:text-emerald-400 mt-1 uppercase">🚜 Supervisor Conucos</h3>
              <span className="text-[9px] text-slate-400 font-mono mt-1 block">En línea (Cuentas protegidas)</span>
            </div>
          </div>

        </div>
      )}

      {/* Visual Charts Overview Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
        {/* Crop Volume & Performance */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Desempeño por Cultivo</h3>
              <p className="text-[11px] text-slate-500 font-semibold">{showFinances ? 'Inversión vs Retraso de Venta (RD$)' : 'Cantidad de Unidades Recolectadas'}</p>
            </div>
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <Sprout className="w-4 h-4" />
            </div>
          </div>
          
          <div className="h-56 w-full">
            {topCropsChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <span className="text-xs text-slate-400">Sin datos de cosechas.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCropsChartData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:hidden" />
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" className="hidden dark:block" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <Tooltip {...(customTooltipStyle as any)} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  {showFinances ? (
                    <>
                      <Bar dataKey="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} name="Ingresos (RD$)" />
                      <Bar dataKey="Costos" fill="#ef4444" radius={[4, 4, 0, 0]} name="Costos (RD$)" />
                    </>
                  ) : (
                    <Bar dataKey="Cantidad" fill="#6366f1" radius={[4, 4, 0, 0]} name="Cantidad Cosechada" />
                  )}
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Location Yield OR Expense category distribution */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {showFinances ? 'Egresos Directos por Categoría' : 'Distribución Geográfica de Carga'}
              </h3>
              <p className="text-[11px] text-slate-500 font-semibold">
                {showFinances ? 'Inversión del fondo de caja' : 'Aporte de unidades por cada conuco'}
              </p>
            </div>
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
              {showFinances ? <PieIcon className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
            </div>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            {showFinances ? (
              expensePieData.length === 0 ? (
                <span className="text-xs text-slate-400">Sin datos de gastos directos.</span>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {expensePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip {...(customTooltipStyle as any)} formatter={(val: number) => [`${val.toLocaleString()} RD$`, 'Monto']} />
                    <Legend wrapperStyle={{ fontSize: '9px' }} layout="vertical" verticalAlign="middle" align="right" />
                  </PieChart>
                </ResponsiveContainer>
              )
            ) : (
              locationChartData.length === 0 ? (
                <span className="text-xs text-slate-400">Sin datos geográficos.</span>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={locationChartData} layout="vertical" margin={{ top: 5, right: 5, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:hidden" />
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" className="hidden dark:block" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={9} tickLine={false} width={80} />
                    <Tooltip {...(customTooltipStyle as any)} />
                    <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Cant. Unidades" />
                  </BarChart>
                </ResponsiveContainer>
              )
            )}
          </div>
        </div>
      </div>

      {/* Grid: Actions, Properties check, and Recent streams */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column (8 spans) - Alquileres de Mora Warn & Quick Shortcuts */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Alquileres en Mora / Alertas (ONLY if Authorized) */}
          {showFinances && propertiesMoraCount > 0 && (
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 flex gap-3.5 items-start">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 leading-tight">Acción Requerida: Cobros Familiares en Mora ({propertiesMoraCount})</h4>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                  Hay {propertiesMoraCount} propiedades que registran un estatus de <strong className="text-amber-700 dark:text-amber-300">"En Mora"</strong>. El monto insoluto total asciende a <span className="font-mono text-amber-700 dark:text-amber-300 font-bold">{totalRentMora.toLocaleString()} RD$</span>. Por favor contacta a los arrendatarios o actualiza la ficha de pagos.
                </p>
                <button
                  onClick={() => onNavigate('propiedades')}
                  className="mt-2 text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:text-amber-500 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  Ir a Propiedades y Rentas &rarr;
                </button>
              </div>
            </div>
          )}

          {/* Quick Actions Panel */}
          <div className="p-5 rounded-2xl bg-slate-100/50 dark:bg-slate-900/25 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Accesos Rápidos Directos</h3>
            
            {showFinances ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => onNavigate('produccion')}
                  className="p-4 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800/20 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/30 text-left transition-all flex flex-col justify-between space-y-3 group cursor-pointer"
                >
                  <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg w-fit group-hover:scale-105 transition-transform">
                    <Sprout className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white">Cosechas</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Controlar recolectas agrícolas familiares</p>
                  </div>
                </button>

                <button
                  onClick={() => onNavigate('gastos')}
                  className="p-4 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800/20 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-500/30 text-left transition-all flex flex-col justify-between space-y-3 group cursor-pointer"
                >
                  <div className="p-2 bg-rose-500/10 text-rose-600 dark:text-rose-455 rounded-lg w-fit group-hover:scale-105 transition-transform">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white">Dividir Gasto</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Cálculos compartidos en la cuenta dividida</p>
                  </div>
                </button>

                <button
                  onClick={() => onNavigate('reportes')}
                  className="p-4 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800/20 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/30 text-left transition-all flex flex-col justify-between space-y-3 group cursor-pointer"
                >
                  <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-405 rounded-lg w-fit group-hover:scale-105 transition-transform">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white">Generar Reporte</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-404 mt-0.5">Gráficos de rendimiento y balances</p>
                  </div>
                </button>
              </div>
            ) : (
              // Worker dashboard action button
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => onNavigate('produccion')}
                  className="p-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all font-bold text-left flex flex-col justify-between min-h-[140px] shadow-lg hover:shadow-emerald-500/10 cursor-pointer active:scale-98 group"
                >
                  <div className="p-2.5 bg-slate-950/10 rounded-xl w-fit group-hover:scale-110 transition-transform">
                    <Sprout className="w-5 h-5 text-slate-950" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold flex items-center gap-1.5 uppercase tracking-wide">
                      Registrar Cosecha Diaria
                      <ChevronRight className="w-4 h-4" />
                    </h4>
                    <p className="text-[11px] font-medium text-slate-900 leading-relaxed">Declara los racimos de plátanos, cajas de aguacates, sacos de café y otros productos directamente al sistema.</p>
                  </div>
                </button>

                <button
                  onClick={() => onNavigate('historial')}
                  className="p-5 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 transition-all font-bold text-left flex flex-col justify-between min-h-[140px] shadow-lg hover:shadow-indigo-500/10 cursor-pointer active:scale-98 group"
                >
                  <div className="p-2.5 bg-slate-950/10 rounded-xl w-fit group-hover:scale-110 transition-transform">
                    <Sparkles className="w-5 h-5 text-slate-950" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold flex items-center gap-1.5 uppercase tracking-wide">
                      Ver Bitácora de Envíos
                      <ChevronRight className="w-4 h-4" />
                    </h4>
                    <p className="text-[11px] font-medium text-slate-900 leading-relaxed">Verifica las confirmaciones agregadas por tu perfil y la cronología inmutable del conuco.</p>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Simple Informational Section About Conucos */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100/30 dark:bg-slate-905/10 space-y-3 shadow-none">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Distribución de Conucos Rancho Modesta</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-white dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-lg">🌾</span>
                <h5 className="text-[11px] font-bold text-slate-800 dark:text-white mt-1">Conuco del Río</h5>
                <p className="text-[9px] text-slate-500">Tierra baja, plátano criollo</p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-lg">🗻</span>
                <h5 className="text-[11px] font-bold text-slate-800 dark:text-white mt-1">Conuco Clavellina</h5>
                <p className="text-[9px] text-slate-500">Montaña alta, café orgánico</p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-lg">🥑</span>
                <h5 className="text-[11px] font-bold text-slate-800 dark:text-white mt-1">Huerto Frutales</h5>
                <p className="text-[9px] text-slate-500">Aguacate hass loma</p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-lg">🥭</span>
                <h5 className="text-[11px] font-bold text-slate-800 dark:text-white mt-1">Rancho Loma</h5>
                <p className="text-[9px] text-slate-500">Mango banilejo loma</p>
              </div>
            </div>
          </div>

        </div>

        {/* Right column (4 spans) - Recent Operations Streaming feed */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {showFinances ? 'Flujo de Transacciones' : 'Cosechas Recientes'}
              </h3>
              <span className="text-[8px] font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 border border-slate-200 dark:border-slate-800 rounded text-slate-500">ÚLTIMOS 5</span>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {combinedActivities.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-xs text-slate-400 dark:text-slate-550 font-mono">No se han registrado reportes.</p>
                </div>
              ) : (
                combinedActivities.map((act, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 flex justify-between items-center gap-2"
                  >
                    <div className="overflow-hidden space-y-0.5">
                      <h5 className="text-xs font-bold text-slate-800 dark:text-white truncate leading-none">{act.title}</h5>
                      <span className="text-[10px] text-slate-550 dark:text-slate-400 truncate block leading-tight">{act.subtitle}</span>
                      <span className="text-[9px] text-slate-450 dark:text-slate-500 font-mono block">{act.date}</span>
                    </div>

                    {showFinances && act.amount !== null && (
                      <div className="shrink-0 text-right">
                        <span className={`text-xs font-bold font-mono ${act.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {act.amount >= 0 ? '+' : ''}{act.amount.toLocaleString()} RD$
                        </span>
                        {act.profit !== null && (
                          <span className="text-[8px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold px-1.5 py-0.5 rounded border border-emerald-500/10 mt-1 block">
                            Neta: {act.profit.toLocaleString()}
                          </span>
                        )}
                      </div>
                    )}

                    {!showFinances && (
                      <div className="shrink-0 text-right">
                        <span className="text-[10px] bg-indigo-500/10 text-indigo-505 dark:text-indigo-400 font-mono font-bold px-1.5 py-0.5 rounded border border-indigo-500/10 block">
                          Ingresado✓
                        </span>
                      </div>
                    )}

                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('historial')}
            className="w-full text-center text-[10px] font-bold mt-4 p-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            Ver Bitácora de Envíos &rarr;
          </button>
        </div>

      </div>

    </div>
  );
}
