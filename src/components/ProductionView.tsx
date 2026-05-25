import { useState, FormEvent } from 'react';
import { ProductionRecord, ConfigItem, User } from '../types';
import { Sprout, Trash2, Calendar, DollarSign, MapPin, AlignLeft, Scale, Plus, Sparkles, Filter, FileText } from 'lucide-react';

interface ProductionViewProps {
  production: ProductionRecord[];
  onAddProduction: (record: Omit<ProductionRecord, 'id' | 'profit'>) => Promise<void>;
  onDeleteProduction: (id: string) => Promise<void>;
  currentUser: User;
  configItems: ConfigItem[];
  triggerNotification?: (message: string, type: 'success' | 'info' | 'error') => void;
  onAddConfigItem?: (type: 'gasto' | 'producto' | 'terreno', value: string) => Promise<void>;
}

export function ProductionView({
  production,
  onAddProduction,
  onDeleteProduction,
  currentUser,
  configItems,
  triggerNotification,
  onAddConfigItem
}: ProductionViewProps) {
  // Determine if the user should see financial statistics
  const showFinances =
    currentUser.role === 'Admin' ||
    (currentUser.role === 'Miembro' && currentUser.username.toLowerCase() === 'maria');

  const productOptions = configItems.filter(c => c.type === 'producto').map(c => c.value);
  const locationOptions = configItems.filter(c => c.type === 'terreno').map(c => c.value);

  // Form state
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [product, setProduct] = useState(productOptions[0] || 'Plátano Criollo');
  const [customProduct, setCustomProduct] = useState('');
  const [isCustomProduct, setIsCustomProduct] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('Millares');
  const [cost, setCost] = useState('');
  const [revenue, setRevenue] = useState('');
  const [location, setLocation] = useState(locationOptions[0] || 'Conuco del Río');
  const [notes, setNotes] = useState('');
  const [filterProduct, setFilterProduct] = useState('all');

  const [formOpen, setFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom inline confirms block to avoid window.confirm iframe sandbox security error
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // If showing finances, we require cost/revenue. Otherwise we auto-fill '0'.
    const finalCost = showFinances ? cost : '0';
    const finalRevenue = showFinances ? revenue : '0';

    if (!quantity || !finalCost || !finalRevenue) {
      alert('Por favor completa todos los campos requeridos.');
      return;
    }

    const finalProduct = isCustomProduct ? customProduct : product;
    if (!finalProduct.trim()) {
      alert('Por favor especifica el nombre del producto.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Auto-save typed custom product to the config catalog permanently so it appears in list next time!
      if (isCustomProduct && onAddConfigItem) {
        const exists = configItems.some(
          c => c.type === 'producto' && c.value.toLowerCase() === finalProduct.trim().toLowerCase()
        );
        if (!exists) {
          await onAddConfigItem('producto', finalProduct.trim());
        }
      }

      const parsedRecord = {
        date,
        product: finalProduct,
        quantity: parseFloat(quantity),
        unit,
        cost: parseFloat(finalCost),
        revenue: parseFloat(finalRevenue),
        location,
        notes: notes.trim() || undefined
      };

      await onAddProduction(parsedRecord);
      
      if (triggerNotification) {
        if (showFinances) {
          triggerNotification(`¡Éxito! Se ha registrado la cosecha de ${finalProduct} (${quantity} ${unit}) con ingresos de ${parseFloat(finalRevenue).toLocaleString()} RD$.`, 'success');
        } else {
          triggerNotification(`¡Éxito! Cosecha de ${finalProduct} (${quantity} ${unit}) registrada en ${location}.`, 'success');
        }
      }

      // Clear Form
      setQuantity('');
      setCost('');
      setRevenue('');
      setNotes('');
      setFormOpen(false);
    } catch (err) {
      console.error('Error al registrar cosecha:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProduction = filterProduct === 'all'
    ? production
    : production.filter(p => p.product === filterProduct);

  // Stats Calculations
  const totalQtyOfFiltered = filteredProduction.reduce((sum, p) => sum + p.quantity, 0);
  const totalRevenue = filteredProduction.reduce((sum, p) => sum + p.revenue, 0);
  const totalCost = filteredProduction.reduce((sum, p) => sum + p.cost, 0);
  const totalProfit = totalRevenue - totalCost;

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-in fade-in duration-200">
      
      {/* Header section with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sprout className="w-5.5 h-5.5 text-emerald-500 dark:text-emerald-400" />
            Producción de Conucos
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Administra el historial de cosechas de los conucos y recolectas de productos agrícolas.
          </p>
        </div>
        
        {currentUser.role !== 'Invitado' && (
          <button
            onClick={() => setFormOpen(!formOpen)}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-95 cursor-pointer self-start sm:self-center"
            id="open-add-production-btn"
          >
            <Plus className="w-4 h-4" />
            {formOpen ? 'Cerrar Formulario' : 'Nueva Cosecha'}
          </button>
        )}
      </div>

      {/* Form Overlay/Dropdown block */}
      {formOpen && currentUser.role !== 'Invitado' && (
        <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-5 animate-in slide-in-from-top-4 duration-200 shadow-sm">
          <div className="col-span-12 border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest">Registrar nueva recolección agrícola</h3>
          </div>

          <div className="col-span-12 md:col-span-3 space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> Fecha del Reporte
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs px-3 py-2 text-slate-900 dark:text-white focus:border-emerald-500 hover:border-slate-300 dark:hover:border-slate-700 outline-none transition-colors"
              required
            />
          </div>

          <div className="col-span-12 md:col-span-4 space-y-1">
            <div className="flex justify-between items-center pb-0.5">
              <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Sprout className="w-1.5 h-1.5 bg-emerald-500 dark:bg-emerald-400 rounded-full" /> Producto Agrícola
              </label>
              <button
                type="button"
                onClick={() => setIsCustomProduct(!isCustomProduct)}
                className="text-[9px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-650 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-lg border border-emerald-500/10 transition-colors cursor-pointer"
              >
                {isCustomProduct ? '📋 Elegir de lista' : '➕ Escribir Otro Crop'}
              </button>
            </div>
            {isCustomProduct ? (
              <div className="space-y-1">
                <input
                  type="text"
                  value={customProduct}
                  onChange={(e) => setCustomProduct(e.target.value)}
                  placeholder="Ej. Guandules, Ñame, Ají Gustoso, Yuca"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs px-3 py-2 text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-colors"
                  required
                />
                <span className="text-[9px] text-emerald-600 dark:text-emerald-400/80 block italic">
                  ℹ️ Al guardar, se añadirá permanentemente a tu menú desplegable.
                </span>
              </div>
            ) : (
              <select
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs px-3 py-2 text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-colors"
              >
                {productOptions.length > 0 ? (
                  productOptions.map((opt, i) => (
                    <option key={i} value={opt} className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white">{opt}</option>
                  ))
                ) : (
                  <option value="Plátano Criollo">Plátano Criollo</option>
                )}
              </select>
            )}
          </div>

          <div className="col-span-12 md:col-span-5 space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> Ubicación (Conuco / Huerto)
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs px-3 py-2 text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-colors"
            >
              {locationOptions.length > 0 ? (
                locationOptions.map((opt, i) => (
                  <option key={i} value={opt} className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white">{opt}</option>
                ))
              ) : (
                <option value="Conuco del Río">Conuco del Río</option>
              )}
            </select>
          </div>

          <div className="col-span-12 md:col-span-4 grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Scale className="w-3 h-3 text-slate-400 dark:text-slate-500" /> Cantidad
              </label>
              <input
                type="number"
                step="any"
                min="0.1"
                placeholder="100"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs px-3 py-2 text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-colors"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Unidad</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs px-3 py-2 text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-colors"
              >
                <option value="Millares">Millares</option>
                <option value="Sacos">Sacos</option>
                <option value="Unidades">Unidades</option>
                <option value="Libras">Libras</option>
                <option value="Cajas">Cajas</option>
                <option value="Racimos">Racimos</option>
              </select>
            </div>
          </div>

          {showFinances ? (
            <>
              <div className="col-span-12 md:col-span-4 space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> Costos de Producción (RD$)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="Costo total de recolecta"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs px-3 py-2 text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-colors font-mono"
                  required
                />
              </div>

              <div className="col-span-12 md:col-span-4 space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-550 dark:text-emerald-400" /> Ingresos de Ventas (RD$)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="Precio total bruto vendido"
                  value={revenue}
                  onChange={(e) => setRevenue(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs px-3 py-2 text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-colors font-mono"
                  required
                />
              </div>
            </>
          ) : (
            <div className="col-span-12 md:col-span-8 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 text-[10.5px] text-slate-500 dark:text-slate-400 flex items-center">
              ⚠️ Nota de Privacidad de Datos: El registro de costos y cotización de venta financiera está oculto para perfiles operativos. Serán ponderados por el Administrador o el área de Finanzas de la familia Modesta.
            </div>
          )}

          <div className="col-span-12 space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5 text-slate-400" /> Observaciones o Notas Especiales
            </label>
            <textarea
              placeholder="Escribe calidad del fruto, destino, intermediados de carga comercial, etc..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs px-3 py-2 text-slate-900 dark:text-white focus:border-emerald-500 min-h-[60px] outline-none transition-colors"
            />
          </div>

          <div className="col-span-12 flex justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Cosecha'}
            </button>
          </div>

        </form>
      )}

      {/* Production stats row */}
      {showFinances ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 block">Ingresos Totales en Conucos</span>
            <span className="text-xl font-bold text-emerald-650 dark:text-emerald-400 font-mono block mt-1">{totalRevenue.toLocaleString()} RD$</span>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 block">Gastos Totales Asociados</span>
            <span className="text-xl font-bold text-rose-600 dark:text-rose-400 font-mono block mt-1">{totalCost.toLocaleString()} RD$</span>
          </div>

          <div className="p-4 bg-emerald-55/5 bg-emerald-500/5 border border-emerald-500/20 dark:border-emerald-500/10 rounded-xl shadow-sm">
            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 block">Retorno Neto Agrícola</span>
            <span className={`text-xl font-bold font-mono block mt-1 ${totalProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-455'}`}>
              {totalProfit.toLocaleString()} RD$
            </span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 block">Lotes de Cosecha (Filtro)</span>
            <span className="text-xl font-bold text-indigo-605 text-indigo-605 text-indigo-600 dark:text-indigo-400 font-mono block mt-1">
              {filteredProduction.length} envíos
            </span>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 block">Total Unidades Recogidas</span>
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono block mt-1">
              {totalQtyOfFiltered.toLocaleString()} unidades
            </span>
          </div>

          <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl shadow-sm">
            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-450 block">Rol Colaborador</span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 block mt-1.5 uppercase font-mono">
              🚜 {currentUser.role} ACTIVO
            </span>
          </div>
        </div>
      )}

      {/* Production List & Filters */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            Tabla de Historial Cosechas ({filteredProduction.length})
          </h3>
          
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <select
              value={filterProduct}
              onChange={(e) => setFilterProduct(e.target.value)}
              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1 text-[11px] rounded-lg text-slate-700 dark:text-slate-300 outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="all">Filtrar por Cultivo (Todos)</option>
              {Array.from(new Set(production.map(p => p.product))).map((prod, i) => (
                <option key={i} value={prod} className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white">{prod}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredProduction.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">No hay registros de cosechas disponibles para este filtro.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 font-bold">Fecha</th>
                  <th className="py-2.5 font-bold">Cultivo / Producto</th>
                  <th className="py-2.5 font-bold">Ubicación</th>
                  <th className="py-2.5 font-bold text-right">Cant. Recogida</th>
                  {showFinances && (
                    <>
                      <th className="py-2.5 font-bold text-right">Costos</th>
                      <th className="py-2.5 font-bold text-right">Ingresos (Venta)</th>
                      <th className="py-2.5 font-bold text-right">Retorno Neto</th>
                    </>
                  )}
                  {(currentUser.role === 'Admin' || currentUser.role === 'Miembro') && (
                    <th className="py-2.5 font-bold text-right">Acción</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredProduction.map((item) => {
                  const profit = item.revenue - item.cost;
                  return (
                    <tr key={item.id} className="border-b border-slate-200 dark:border-slate-800/80 hover:bg-slate-100/50 dark:hover:bg-slate-900/30 transition-colors group">
                      <td className="py-3 font-mono whitespace-nowrap text-slate-700 dark:text-slate-300">{item.date}</td>
                      <td className="py-3 font-bold text-slate-900 dark:text-white">
                        <div>
                          <span>{item.product}</span>
                          {item.notes && (
                            <p className="text-[9px] text-slate-550 dark:text-slate-400 font-normal mt-0.5 max-w-xs">{item.notes}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">{item.location}</td>
                      <td className="py-3 font-mono text-right font-semibold text-slate-850 dark:text-slate-205 text-slate-800 dark:text-slate-200">
                        {item.quantity.toLocaleString()} {item.unit}
                      </td>
                      {showFinances && (
                        <>
                          <td className="py-3 font-mono text-right text-rose-600 dark:text-rose-450 font-semibold text-xs">
                            {item.cost.toLocaleString()} RD$
                          </td>
                          <td className="py-3 font-mono text-right text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                            {item.revenue.toLocaleString()} RD$
                          </td>
                          <td className="py-3 font-mono text-right text-xs">
                            <span className={`font-bold ${profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                              {profit.toLocaleString()} RD$
                            </span>
                          </td>
                        </>
                      )}
                      {(currentUser.role === 'Admin' || currentUser.role === 'Miembro') && (
                        <td className="py-3 text-right whitespace-nowrap">
                          {deletingId === item.id ? (
                            <div className="flex items-center justify-end gap-1 px-1.5 py-0.5 rounded-lg border border-red-200 dark:border-red-500/20 bg-red-500/5 animate-in fade-in duration-100">
                              <span className="text-[9px] text-red-650 dark:text-red-450 font-bold mr-1">¿Eliminar?</span>
                              <button
                                onClick={async () => {
                                  try {
                                    await onDeleteProduction(item.id);
                                  } catch (error) {
                                    console.error("Error deleting production item:", error);
                                  }
                                  setDeletingId(null);
                                }}
                                className="px-1.5 py-0.5 bg-red-500 hover:bg-red-600 text-white text-[9px] font-bold rounded cursor-pointer transition-all active:scale-95"
                              >
                                Sí
                              </button>
                              <button
                                onClick={() => setDeletingId(null)}
                                className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[9px] font-bold rounded cursor-pointer transition-all active:scale-95"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeletingId(item.id)}
                              className="p-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-red-500/30 hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                              title="Eliminar registro"
                            >
                              <Trash2 className="w-3.5 h-3.5 inline" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>
      
    </div>
  );
}
