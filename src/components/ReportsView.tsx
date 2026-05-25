import { useState } from 'react';
import { User, ProductionRecord, ExpenseRecord, PropertyRecord } from '../types';
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
  AreaChart,
  Area,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Layers,
  PieChart as PieIcon,
  Sparkles,
  Building2,
  DollarSign,
  Briefcase,
  Sprout,
  Download,
  Calendar,
  Filter,
  FileText
} from 'lucide-react';

interface ReportsViewProps {
  production: ProductionRecord[];
  expenses: ExpenseRecord[];
  properties: PropertyRecord[];
  currentUser: User;
}

export function ReportsView({
  production,
  expenses,
  properties,
  currentUser
}: ReportsViewProps) {
  const [activeChartTab, setActiveChartTab] = useState<'all' | 'crops' | 'categories'>('all');
  
  // Year and Month selective filtering states
  const [selectedYear, setSelectedYear] = useState<string>('Todos');
  const [selectedMonth, setSelectedMonth] = useState<string>('Todos');

  // Dynamically extract unique years from production & expenses dates to build select options
  const productionYears = Array.from(new Set(production.map(p => p.date.substring(0, 4))));
  const expenseYears = Array.from(new Set(expenses.map(e => e.date.substring(0, 4))));
  const allYears = Array.from(new Set([...productionYears, ...expenseYears]))
    .filter(y => y && y.length === 4 && !isNaN(Number(y)))
    .sort((a, b) => b.localeCompare(a)); // Sort descending

  const MONTH_OPTIONS = [
    { value: 'Todos', label: 'Todos los meses' },
    { value: '01', label: 'Enero' },
    { value: '02', label: 'Febrero' },
    { value: '03', label: 'Marzo' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Mayo' },
    { value: '06', label: 'Junio' },
    { value: '07', label: 'Julio' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ];

  // --- FILTERING DATAS BY SELECTOR ---
  const filteredProduction = production.filter(p => {
    const matchYear = selectedYear === 'Todos' || p.date.startsWith(selectedYear);
    const matchMonth = selectedMonth === 'Todos' || p.date.substring(5, 7) === selectedMonth;
    return matchYear && matchMonth;
  });

  const filteredExpenses = expenses.filter(e => {
    const matchYear = selectedYear === 'Todos' || e.date.startsWith(selectedYear);
    const matchMonth = selectedMonth === 'Todos' || e.date.substring(5, 7) === selectedMonth;
    return matchYear && matchMonth;
  });

  // --- 1. CORE CALCULATIONS (OVER FILTERED DATA) ---
  const totalProductionRevenue = filteredProduction.reduce((sum, p) => sum + p.revenue, 0);
  const totalProductionCost = filteredProduction.reduce((sum, p) => sum + p.cost, 0);
  const totalDirectExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const grandTotalExpenses = totalProductionCost + totalDirectExpenses;
  const grandTotalNetBalance = totalProductionRevenue - grandTotalExpenses;

  // Rent aggregates (these operate on full, current month states but we make sure they stay consistent)
  const rentBilledTotal = properties.reduce((sum, p) => sum + p.monthlyRent, 0);
  const rentDebtTotal = properties.reduce((sum, p) => sum + p.debt, 0);
  const rentCollectedTotal = rentBilledTotal - rentDebtTotal > 0 ? rentBilledTotal - rentDebtTotal : 0;
  
  // Profit margins ratio
  const profitMarginPercent = totalProductionRevenue > 0
    ? Math.round((grandTotalNetBalance / totalProductionRevenue) * 100)
    : 0;

  const rentCollectionRate = rentBilledTotal > 0
    ? Math.round((rentCollectedTotal / rentBilledTotal) * 100)
    : 0;

  // --- 2. PREPARING DATA FOR RECHARTS ---

  // Breakdown 1: Crops / Products Performance
  const productPerformances: { [name: string]: { cost: number; revenue: number; profit: number; count: number } } = {};
  filteredProduction.forEach(p => {
    if (!productPerformances[p.product]) {
      productPerformances[p.product] = { cost: 0, revenue: 0, profit: 0, count: 0 };
    }
    productPerformances[p.product].cost += p.cost;
    productPerformances[p.product].revenue += p.revenue;
    productPerformances[p.product].profit += (p.revenue - p.cost);
    productPerformances[p.product].count += 1;
  });

  const cropsChartData = Object.keys(productPerformances).map(prod => ({
    name: prod,
    Ingresos: productPerformances[prod].revenue,
    Costos: productPerformances[prod].cost,
    Utilidad: productPerformances[prod].profit,
    lotes: productPerformances[prod].count
  })).sort((a, b) => b.Ingresos - a.Ingresos);

  // Breakdown 2: Expenses by Category
  const expenseCategoriesAgg: { [name: string]: number } = {};
  filteredExpenses.forEach(e => {
    expenseCategoriesAgg[e.category] = (expenseCategoriesAgg[e.category] || 0) + e.amount;
  });

  const expensesChartData = Object.keys(expenseCategoriesAgg).map(cat => ({
    name: cat,
    value: expenseCategoriesAgg[cat]
  })).sort((a, b) => b.value - a.value);

  // Colors palette for Pie/Donut charts
  const PIE_COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#6366f1', '#a855f7', '#ec4899', '#14b8a6'];

  // Breakdown 3: Property Rent vs Debt
  const propertiesChartData = properties.map(p => ({
    name: p.name,
    Billed: p.monthlyRent,
    Debt: p.debt,
    Collected: Math.max(0, p.monthlyRent - p.debt)
  }));

  // Breakdown 4: Time series trend (sort by date ascending)
  const sortedProduction = [...filteredProduction].sort((a, b) => a.date.localeCompare(b.date));
  let runningProfitAccum = 0;
  const trendData = sortedProduction.map(p => {
    runningProfitAccum += (p.revenue - p.cost);
    return {
      fecha: p.date,
      Recaudado: p.revenue,
      Invertido: p.cost,
      BalanceAcumulado: runningProfitAccum,
      producto: p.product
    };
  });

  // Export to Excel-compatible CSV structure with proper formatting & BOM
  const handleDownloadCSV = () => {
    let csvContent = "";
    
    // Header block
    csvContent += "RANCHO MODESTA - REPORTE GERENCIAL DE VENTAS Y BALANCES\n";
    csvContent += `Fecha del Reporte: ${new Date().toLocaleDateString()}\n`;
    csvContent += `Periodo de Consulta: Ano: ${selectedYear} / Mes: ${selectedMonth === 'Todos' ? 'Todos los meses' : MONTH_OPTIONS.find(m => m.value === selectedMonth)?.label}\n`;
    csvContent += `Operador de Descarga: ${currentUser.fullName} (${currentUser.role})\n\n`;
    
    // Consolidated Financial Summary Box
    csvContent += "--- RESUMEN FINANCIERO CONSOLIDADO ---\n";
    csvContent += "Indicador,Valor de Retorno\n";
    csvContent += `Balance Neto Consolidado (Caja),${grandTotalNetBalance} RD$\n`;
    csvContent += `Ingresos Totales por Cosecha,${totalProductionRevenue} RD$\n`;
    csvContent += `Inversion de Produccion (Costos),${totalProductionCost} RD$\n`;
    csvContent += `Gastos Operativos Directos,${totalDirectExpenses} RD$\n`;
    csvContent += `Egresos Acumulados (Inversion + Gastos),${grandTotalExpenses} RD$\n`;
    csvContent += `Margen de Rentabilidad neta,${profitMarginPercent}%\n`;
    csvContent += `Facturacion de Alquileres Familiares,${rentBilledTotal} RD$\n`;
    csvContent += `Monto Cobrado de Alquileres,${rentCollectedTotal} RD$\n`;
    csvContent += `Alquileres Pendientes en Mora,${rentDebtTotal} RD$\n\n`;
    
    // Production / Harvesting Sheet Data
    csvContent += "--- HISTORICO DE COSECHAS REGISTRADAS ---\n";
    csvContent += "Fecha,Cultivo / Producto,Ubicacion (Conuco),Cantidad,Unidad,Costos de Produccion (RD$),Ingresos de Ventas (RD$),Beneficio Neto (RD$),Notas\n";
    
    if (filteredProduction.length === 0) {
      csvContent += "No hay registros para este periodo.\n";
    } else {
      filteredProduction.forEach(p => {
        const net = p.revenue - p.cost;
        const name = `"${p.product.replace(/"/g, '""')}"`;
        const loc = `"${p.location.replace(/"/g, '""')}"`;
        const notes = p.notes ? `"${p.notes.replace(/"/g, '""')}"` : '""';
        csvContent += `${p.date},${name},${loc},${p.quantity},${p.unit},${p.cost},${p.revenue},${net},${notes}\n`;
      });
    }
    csvContent += "\n";

    // Direct Expenses Table
    csvContent += "--- REGISTRO DE GASTOS DIRECTOS ---\n";
    csvContent += "Fecha,Categoria de Gasto,Descripcion,Monto del Gasto (RD$),Registrado Por\n";
    
    if (filteredExpenses.length === 0) {
      csvContent += "No hay registros de gastos para este periodo.\n";
    } else {
      filteredExpenses.forEach(e => {
        const desc = `"${e.description.replace(/"/g, '""')}"`;
        const regBy = `"${(e.registeredBy || '').replace(/"/g, '""')}"`;
        csvContent += `${e.date},${e.category},${desc},${e.amount},${regBy}\n`;
      });
    }
    csvContent += "\n";

    // Real Estate details
    csvContent += "--- CARTERA DE ALQUILERES FAMILIARES (LEONARDO MODESTA) ---\n";
    csvContent += "Propiedad Inmueble,Inquilino Representante,Renta Mensual Ajustada (RD$),Mora Registrada (RD$),Estatus Operativo,Comprobantes Cargados\n";
    properties.forEach(p => {
      const pName = `"${p.name.replace(/"/g, '""')}"`;
      const pTen = `"${p.tenant.replace(/"/g, '""')}"`;
      const numVouchers = p.vouchers ? p.vouchers.length : 0;
      csvContent += `${pName},${pTen},${p.monthlyRent},${p.debt},${p.status},${numVouchers}\n`;
    });

    // Create safe download payload with BOM for Spanish characters
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    
    const monthName = selectedMonth === 'Todos' ? 'Anual' : MONTH_OPTIONS.find(m => m.value === selectedMonth)?.label || selectedMonth;
    const cleanFileName = `Reporte_General_RanchoModesta_${selectedYear}_${monthName}.csv`;
    
    link.setAttribute("download", cleanFileName);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Style helper for Tooltips
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


  return (
    <div className="p-4 sm:p-6 space-y-6 animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5.5 h-5.5 text-emerald-500" />
            Análisis de Rendimiento & Balances
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-405 mt-1">
            Métricas interactivas consolidadas de conucos, flujo de gastos operativos y cobro de alquileres familiares.
          </p>
        </div>
        
        {/* Toggle navigation & Download */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-105 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 p-1 rounded-xl text-xs gap-1">
            <button
              onClick={() => setActiveChartTab('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${activeChartTab === 'all' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Caja
            </button>
            <button
              onClick={() => setActiveChartTab('crops')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${activeChartTab === 'crops' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Cultivos
            </button>
            <button
              onClick={() => setActiveChartTab('categories')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${activeChartTab === 'categories' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Gastos
            </button>
          </div>

          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-lg hover:shadow-emerald-500/10 active:scale-95 cursor-pointer"
            title="Descargar datos filtrados en formato CSV para Excel o Google Sheets"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Reporte (CSV)</span>
          </button>
        </div>
      </div>

      {/* FILTROS DE PERIODO: Año y Mes */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 self-start">
          <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Período del Reporte</h4>
            <p className="text-[10px] text-slate-500">Filtra todas las cosechas y egresos para un mes y año específico.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Año Option */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 w-full sm:w-auto">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent text-xs text-slate-700 dark:text-slate-200 font-semibold outline-none w-full sm:w-28 cursor-pointer"
            >
              <option value="Todos" className="bg-white dark:bg-slate-950 text-slate-950 dark:text-white">Año: Todos</option>
              {allYears.map(year => (
                <option key={year} value={year} className="bg-white dark:bg-slate-950 text-slate-950 dark:text-white">Año: {year}</option>
              ))}
              {allYears.length === 0 && <option value="2026" className="bg-white dark:bg-slate-950">Año: 2026</option>}
            </select>
          </div>

          {/* Mes Option */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 w-full sm:w-auto">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs text-slate-700 dark:text-slate-200 font-semibold outline-none w-full sm:w-40 cursor-pointer"
            >
              {MONTH_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-950 text-slate-950 dark:text-white">{opt.label}</option>
              ))}
            </select>
          </div>

          {(selectedYear !== 'Todos' || selectedMonth !== 'Todos') && (
            <button
              onClick={() => { setSelectedYear('Todos'); setSelectedMonth('Todos'); }}
              className="text-[10px] text-rose-500 font-bold hover:underline cursor-pointer px-1 shrink-0"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* 3 Bento Financial Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Metric Card 1: Balance de Caja */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-20 h-20 bg-emerald-500/5 rounded-full filter blur-xl" />
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Balance de Caja Consolidado
            </span>
            <h3 className={`text-2xl font-bold font-mono ${grandTotalNetBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-450'}`}>
              {grandTotalNetBalance.toLocaleString()} RD$
            </h3>
            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
              Fondo acumulado de conucos netos restándole todos los egresos directos cargados.
            </p>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Ingresos Totales:
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{totalProductionRevenue.toLocaleString()} RD$</span>
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5 text-rose-500" /> Egresos Totales:
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{grandTotalExpenses.toLocaleString()} RD$</span>
            </div>
          </div>
        </div>

        {/* Metric Card 2: Margen de Retorno */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-20 h-20 bg-blue-500/5 rounded-full filter blur-xl" />
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-indigo-500" /> Margen de Retorno Neto
            </span>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-mono">
              {profitMarginPercent}%
            </h3>
            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
              Proporción de rentabilidad por cada RD$ de ingreso bruto obtenido en las ventas familiares.
            </p>
          </div>

          <div className="space-y-2 pt-3.5 border-t border-slate-105 dark:border-slate-800/80">
            <div className="flex justify-between font-bold text-[10px]">
              <span className="text-slate-505 dark:text-slate-400 uppercase">Progreso Eficiencia</span>
              <span className={`${profitMarginPercent >= 0 ? 'text-emerald-500' : 'text-rose-500'} font-mono`}>{profitMarginPercent}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-200/40 dark:border-slate-850">
              <div
                className={`h-full rounded-full transition-all ${profitMarginPercent > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                style={{ width: `${Math.max(0, Math.min(100, profitMarginPercent))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Metric Card 3: Eficiencia de Alquileres */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-20 h-20 bg-amber-500/5 rounded-full filter blur-xl" />
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-500" /> Cobranzas Inmobiliarias
            </span>
            <h3 className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {rentCollectionRate}%
            </h3>
            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
              Porcentaje de rentas mensuales recaudadas frente al saldo de morosidad pendiente.
            </p>
          </div>

          <div className="space-y-2 pt-3.5 border-t border-slate-105 dark:border-slate-800/80">
            <div className="flex justify-between font-bold text-[10px]">
              <span className="text-slate-505 dark:text-slate-400 uppercase">Recaudado vs Mora</span>
              <span className="text-amber-500 font-mono">{rentCollectedTotal.toLocaleString()} RD$</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-210 dark:border-slate-850">
              <div
                className="bg-amber-500 h-full rounded-full transition-all"
                style={{ width: `${rentCollectionRate}%` }}
              />
            </div>
          </div>
        </div>

      </div>

      {/* MAIN INTERACTIVE CHARTS RENDER GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Chart View Area: Production Crop performances (Bar chart) */}
        {(activeChartTab === 'all' || activeChartTab === 'crops') && (
          <div className="col-span-12 lg:col-span-8 p-5 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/85 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-350 flex items-center gap-1.5">
                <Sprout className="w-4 h-4 text-emerald-500" />
                Rendimiento Financiero por Cultivo / Producto
              </h3>
              <span className="text-[9px] font-mono text-slate-500 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded">
                RD$ RD (Pesos Dominicanos)
              </span>
            </div>

            {cropsChartData.length === 0 ? (
              <div className="py-20 text-center text-slate-450 dark:text-slate-500 text-xs">No hay registros de cosechas disponibles para graficar.</div>
            ) : (
              <div className="pt-2">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={cropsChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2e3a" opacity={0.15} />
                    <XAxis
                      dataKey="name"
                      stroke="#888888"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${(value / 1000).toLocaleString()}k`}
                    />
                    <Tooltip {...customTooltipStyle as any} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                    <Bar dataKey="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={45} />
                    <Bar dataKey="Costos" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={45} />
                    <Bar dataKey="Utilidad" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Chart View Area: Expenses distribution (Pie Chart) */}
        {(activeChartTab === 'all' || activeChartTab === 'categories') && (
          <div className="col-span-12 lg:col-span-4 p-5 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm flex flex-col justify-between">
            <div className="border-b border-slate-100 dark:border-slate-800/85 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-350 flex items-center gap-1.5">
                <PieIcon className="w-4 h-4 text-rose-500" />
                Desglose de Gastos Operativos por Categoría
              </h3>
            </div>

            {expensesChartData.length === 0 ? (
              <div className="py-20 text-center text-slate-450 dark:text-slate-500 text-xs">No hay gastos directos guardados para graficar.</div>
            ) : (
              <div className="flex-1 flex flex-col justify-center py-4">
                <div className="flex justify-center">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={expensesChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {expensesChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip {...customTooltipStyle as any} formatter={(value) => `${value.toLocaleString()} RD$`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Custom Legend to make it responsive and beautiful */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] max-h-36 overflow-y-auto pr-1">
                  {expensesChartData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                      <span className="truncate text-slate-700 dark:text-slate-300 font-medium">
                        {item.name}: <strong className="text-slate-900 dark:text-white font-semibold">{item.value.toLocaleString()}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Accumulative Profit Progression Trend (Area Chart) */}
        {activeChartTab === 'all' && trendData.length > 0 && (
          <div className="col-span-12 p-5 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/85 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-350 flex items-center gap-1.5">
                <TrendingUp className="w-4.5 h-4.5 text-indigo-500" />
                Crecimiento de Retorno Neto Acumulado (Tendencia Cosechas)
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">
                Ordenado cronológicamente
              </span>
            </div>

            <div className="pt-2">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} stroke="#2a2e3a" />
                  <XAxis dataKey="fecha" stroke="#888888" fontSize={9} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={9} tickLine={false} />
                  <Tooltip {...customTooltipStyle as any} />
                  <Area type="monotone" dataKey="BalanceAcumulado" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorBalance)" name="Retorno Acumulado (RD$)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      </div>

      {/* PROPERTY RENT PERFORMANCE TAB (Arrendamiento breakdown bar comparison) */}
      {activeChartTab === 'all' && properties.length > 0 && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-400 flex items-center gap-2">
              <Building2 className="w-4.5 h-4.5 text-amber-500" />
              Recaudación vs Mora Pendiente por Inmueble Familiar
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            {/* Left graphics */}
            <div className="md:col-span-8">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={propertiesChartData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2e3a" opacity={0.1} />
                  <XAxis type="number" stroke="#888888" fontSize={9} tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#888888" fontSize={9} tickLine={false} width={100} />
                  <Tooltip {...customTooltipStyle as any} formatter={(value) => `${value.toLocaleString()} RD$`} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '9px' }} />
                  <Bar dataKey="Collected" fill="#10b981" name="Recaudado (Al Día)" stackId="a" />
                  <Bar dataKey="Debt" fill="#f43f5e" name="Deuda Pendiente (Mora)" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Right text metrics breakdown */}
            <div className="md:col-span-4 space-y-4 border-l border-slate-100 dark:border-slate-800 pl-4 md:pl-6 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block">Desglose de Facturación Deudores:</span>
                <span className="text-base font-bold text-slate-950 dark:text-white font-mono">{rentBilledTotal.toLocaleString()} RD$ / mes</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 bg-emerald-500/5 rounded-xl border border-emerald-500/20 text-center">
                  <span className="text-[9px] uppercase font-bold text-emerald-600 block">Cobrado</span>
                  <span className="text-sm font-bold text-emerald-600 font-mono mt-1 block">{rentCollectedTotal.toLocaleString()}</span>
                </div>

                <div className="p-3.5 bg-rose-500/5 rounded-xl border border-rose-500/20 text-center">
                  <span className="text-[9px] uppercase font-bold text-rose-600 block">Deuda (Mora)</span>
                  <span className="text-sm font-bold text-rose-600 font-mono mt-1 block">{rentDebtTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
