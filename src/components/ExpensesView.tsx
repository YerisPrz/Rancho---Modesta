import { useState, useEffect, FormEvent } from 'react';
import { ExpenseRecord, SplitRecord, ConfigItem, User, PropertyRecord, Participant } from '../types';
import { Wallet, Trash2, Calendar, DollarSign, AlignLeft, Plus, Sparkles, Filter, FileText, CheckCircle2, Circle, Users } from 'lucide-react';

interface ExpensesViewProps {
  expenses: ExpenseRecord[];
  properties: PropertyRecord[];
  onAddExpense: (record: Omit<ExpenseRecord, 'id'>) => Promise<void>;
  onAddSplit: (record: Omit<SplitRecord, 'id'>) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
  onDeleteSplit: (id: string) => Promise<void>;
  onToggleSplitPaid: (splitId: string, participantName: string) => Promise<void>;
  currentUser: User;
  configItems: ConfigItem[];
  splitRecords: SplitRecord[];
  triggerNotification?: (message: string, type: 'success' | 'info' | 'error') => void;
  onAddConfigItem?: (type: 'gasto' | 'producto' | 'terreno', value: string) => Promise<void>;
}

export function ExpensesView({
  expenses,
  onAddExpense,
  onAddSplit,
  onDeleteExpense,
  onDeleteSplit,
  onToggleSplitPaid,
  currentUser,
  configItems,
  splitRecords,
  triggerNotification,
  onAddConfigItem
}: ExpensesViewProps) {
  const standardGastoFallbacks = [
    'Mantenimiento de Conucos',
    'Control de Plagas y Parásitos',
    'Limpieza de Conuco',
    'Insumos / Fertilizantes',
    'Servicios de Agua/Luz',
    'Combustible de Maquinaria',
    'Herramientas',
    'Sueldos y Jornales'
  ];

  const expenseCategories = Array.from(new Set([
    ...configItems.filter(c => c.type === 'gasto').map(c => c.value),
    ...standardGastoFallbacks
  ]));

  // Form State General Expense
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [category, setCategory] = useState(expenseCategories[0] || 'Mantenimiento de Conucos');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // Sync category selected value when the categories are loaded or updated asynchronously
  useEffect(() => {
    if (expenseCategories.length > 0 && !isCustomCategory) {
      if (!category || !expenseCategories.includes(category)) {
        setCategory(expenseCategories[0]);
      }
    }
  }, [configItems, isCustomCategory]);

  // Form State Split Expense
  const [splitDescription, setSplitDescription] = useState('');
  const [splitAmount, setSplitAmount] = useState('');
  // Member checkboxes for split
  const membersOptions = ['Rafael Modesta', 'María Modesta', 'Carlos Modesta'];
  const [selectedMembers, setSelectedMembers] = useState<string[]>(['Rafael Modesta', 'María Modesta', 'Carlos Modesta']);

  const [formOpen, setFormOpen] = useState(false);
  const [splitFormOpen, setSplitFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inline confirmation states
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);
  const [deletingSplitId, setDeletingSplitId] = useState<string | null>(null);

  const handleSubmitExpense = async (e: FormEvent) => {
    e.preventDefault();
    if (!amount || !description) {
      alert('Por favor completa todos los campos requeridos.');
      return;
    }

    const finalCategory = isCustomCategory ? customCategory : category;
    if (!finalCategory.trim()) {
      alert('Especifique el tipo o categoría de gasto.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Auto-save custom category to config catalogs so it is permanently in the list in the future!
      if (isCustomCategory && onAddConfigItem) {
        const exists = configItems.some(
          c => c.type === 'gasto' && c.value.toLowerCase() === finalCategory.trim().toLowerCase()
        );
        if (!exists) {
          await onAddConfigItem('gasto', finalCategory.trim());
        }
      }

      const parsedRecord = {
        date,
        category: finalCategory,
        description: description.trim(),
        amount: parseFloat(amount),
        registeredBy: currentUser.fullName
      };

      await onAddExpense(parsedRecord);
      
      if (triggerNotification) {
        triggerNotification(`¡Éxito! Gasto registrado: ${description.trim()} de ${parseFloat(amount).toLocaleString()} RD$.`, 'success');
      }

      setAmount('');
      setDescription('');
      setFormOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitSplit = async (e: FormEvent) => {
    e.preventDefault();
    if (!splitAmount || !splitDescription) {
      alert('Por favor completa la descripción y el monto.');
      return;
    }
    if (selectedMembers.length === 0) {
      alert('Debes seleccionar al menos un participante para dividir el pago.');
      return;
    }

    setIsSubmitting(true);
    try {
      const totalNum = parseFloat(splitAmount);
      const splitShare = totalNum / selectedMembers.length;

      const participantsData: Participant[] = selectedMembers.map(name => ({
        name,
        share: splitShare,
        paid: false
      }));

      const parsedSplit = {
        totalAmount: totalNum,
        description: splitDescription.trim(),
        date: new Date().toISOString().substring(0, 10),
        participants: participantsData
      };

      await onAddSplit(parsedSplit);

      if (triggerNotification) {
        triggerNotification(`¡Éxito! Gasto compartido de ${totalNum.toLocaleString()} RD$ dividido en partes de ${splitShare.toLocaleString()} RD$ por persona.`, 'success');
      }

      setSplitAmount('');
      setSplitDescription('');
      setSplitFormOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleMember = (name: string) => {
    if (selectedMembers.includes(name)) {
      setSelectedMembers(prev => prev.filter(n => n !== name));
    } else {
      setSelectedMembers(prev => [...prev, name]);
    }
  };

  const filteredExpenses = filterCategory === 'all'
    ? expenses
    : expenses.filter(e => e.category === filterCategory);

  const sumOfFiltered = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-in fade-in duration-200">
      
      {/* Header section with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Wallet className="w-5.5 h-5.5 text-rose-500 dark:text-rose-450" />
            Flujo de Gastos y Egresos
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Lleva el control de cada salida de dinero y deudas compartidas para desyerbo, combustibles, jornaleros e insumos.
          </p>
        </div>
        
        {currentUser.role !== 'Invitado' && (
          <div className="flex gap-2 self-start sm:self-center shrink-0">
            <button
              onClick={() => {
                setFormOpen(!formOpen);
                setSplitFormOpen(false);
              }}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-white font-bold px-3 py-2.5 rounded-xl text-xs transition-all border border-slate-200 dark:border-slate-700 cursor-pointer shadow-sm"
              id="open-expense-btn"
            >
              <Plus className="w-4 h-4" />
              {formOpen ? 'Cerrar Gasto' : 'Ficha Gasto Diario'}
            </button>

            <button
              onClick={() => {
                setSplitFormOpen(!splitFormOpen);
                setFormOpen(false);
              }}
              className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold px-3 py-2.5 rounded-xl text-xs transition-all shadow-lg hover:shadow-rose-500/20 cursor-pointer"
              id="open-split-btn"
            >
              <Users className="w-4 h-4" />
              {splitFormOpen ? 'Cerrar Compartir' : 'Dividir Gasto'}
            </button>
          </div>
        )}
      </div>

      {/* Form: General Expense Register */}
      {formOpen && currentUser.role !== 'Invitado' && (
        <form onSubmit={handleSubmitExpense} className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/85 grid grid-cols-1 md:grid-cols-12 gap-5 animate-in slide-in-from-top-4 duration-200 shadow-sm">
          <div className="col-span-12 border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-500" />
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Registrar Egreso Directo de Caja</h3>
          </div>

          <div className="col-span-12 md:col-span-4 space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-550 dark:text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> Fecha de Pago
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs px-3 py-2 text-slate-900 dark:text-white focus:border-rose-500 outline-none transition-colors"
              required
            />
          </div>

          <div className="col-span-12 md:col-span-4 space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase font-bold text-slate-550 dark:text-slate-400 flex items-center gap-1.5">
                <Wallet className="w-1.5 h-1.5 bg-rose-500 rounded-full" /> Categoría de Gasto
              </label>
              <button
                type="button"
                onClick={() => setIsCustomCategory(!isCustomCategory)}
                className="text-[9px] text-rose-600 dark:text-rose-450 font-bold cursor-pointer"
              >
                {isCustomCategory ? 'Elegir de lista' : 'Otros / Personalizar'}
              </button>
            </div>
            {isCustomCategory ? (
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Ej. Plaguicidas, Reparación Motor"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs px-3 py-2 text-slate-900 dark:text-white focus:border-rose-500 outline-none transition-colors"
                required
              />
            ) : (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs px-3 py-2 text-slate-900 dark:text-white focus:border-rose-500 outline-none transition-colors"
              >
                {expenseCategories.length > 0 ? (
                  expenseCategories.map((opt, i) => (
                    <option key={i} value={opt} className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white">{opt}</option>
                  ))
                ) : (
                  <option value="Mano de Obra">Mano de Obra</option>
                )}
              </select>
            )}
          </div>

          <div className="col-span-12 md:col-span-4 space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-550 dark:text-slate-400 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-rose-500" /> Monto Erogado (RD$)
            </label>
            <input
              type="number"
              min="1"
              placeholder="Ej. 3500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs px-3 py-2 text-slate-900 dark:text-white focus:border-rose-500 outline-none transition-colors font-mono"
              required
            />
          </div>

          <div className="col-span-12 space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-550 dark:text-slate-400 flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5 text-slate-400" /> Descripción Detallada
            </label>
            <input
              type="text"
              placeholder="Escribe el concepto (ej. Pago de 5 jornales para desyerbe conuco de plátano)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-xl text-xs px-3 py-2 text-slate-900 dark:text-white focus:border-rose-500 outline-none transition-colors"
              required
            />
            {/* Quick Fill suggestions for Maintenance and parasites */}
            <div className="bg-slate-100/50 dark:bg-slate-905/30 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-850 space-y-2">
              <span className="text-[9px] uppercase font-bold text-slate-505 dark:text-slate-400 block tracking-wider">
                Sugerencias Rápidas de Gastos Agrícolas (¡Selecciona con 1 Clic!)
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setCategory('Limpieza de Conuco');
                    setIsCustomCategory(false);
                    setDescription('Jornales de limpieza de malezas, desmonte y desyerbo del conuco');
                    if (triggerNotification) triggerNotification('Categoría y descripción completadas para Limpieza de Conuco', 'info');
                  }}
                  className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-650 dark:text-rose-400 rounded-lg text-[10px] font-bold cursor-pointer transition-colors border border-rose-500/10"
                >
                  🧹 Limpieza de Conuco / Desmontes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCategory('Control de Plagas y Parásitos');
                    setIsCustomCategory(false);
                    setDescription('Insumos químicos parasiticidas, venenos y plaguicidas agrícolas de conuco');
                    if (triggerNotification) triggerNotification('Categoría y descripción completadas para Parasiticidas', 'info');
                  }}
                  className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-650 dark:text-rose-400 rounded-lg text-[10px] font-bold cursor-pointer transition-colors border border-rose-500/10"
                >
                  🦠 Plaguicidas / Antiparasitarios
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCategory('Mantenimiento de Conucos');
                    setIsCustomCategory(false);
                    setDescription('Reparación técnica e insumos para motobomba de agua y cerco del terreno');
                    if (triggerNotification) triggerNotification('Categoría y descripción completadas para Motores e Infraestructura', 'info');
                  }}
                  className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-655 dark:text-rose-400 rounded-lg text-[10px] font-bold cursor-pointer transition-colors border border-rose-500/10"
                >
                  ⚙️ Reparación Motobomba / Riego
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCategory('Insumos / Fertilizantes');
                    setIsCustomCategory(false);
                    setDescription('Abonos químicos / orgánicos y fórmulas de nutrición foliar de conuco');
                    if (triggerNotification) triggerNotification('Categoría y descripción completadas para Fertilizantes', 'info');
                  }}
                  className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-655 dark:text-rose-400 rounded-lg text-[10px] font-bold cursor-pointer transition-colors border border-rose-500/10"
                >
                  🌱 Nutrición / Fertilizantes
                </button>
              </div>
            </div>
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
              className="px-5 py-2 bg-rose-500 hover:bg-rose-455 hover:bg-rose-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Egreso'}
            </button>
          </div>
        </form>
      )}

      {/* Form: Split Shared Expense Builder */}
      {splitFormOpen && currentUser.role !== 'Invitado' && (
        <form onSubmit={handleSubmitSplit} className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/85 space-y-5 animate-in slide-in-from-top-4 duration-200 shadow-sm">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Dividir Gasto Familiar (Reparto Equitativo)</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-550 dark:text-slate-400">Concepto / Actividad</label>
              <input
                type="text"
                placeholder="Ej. Fertilizantes o Combustible de bomba compartida"
                value={splitDescription}
                onChange={(e) => setSplitDescription(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs px-3 py-2 text-slate-900 dark:text-white focus:border-rose-500 outline-none"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-550 dark:text-slate-400">Monto Total Pagado (RD$)</label>
              <input
                type="number"
                placeholder="Monto a repartir"
                value={splitAmount}
                onChange={(e) => setSplitAmount(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs px-3 py-2 text-slate-900 dark:text-white focus:border-rose-500 outline-none font-mono"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-slate-550 dark:text-slate-400 block border-b border-slate-200 dark:border-slate-850 pb-1">Seleccionar Miembros Participantes</label>
            <div className="flex flex-wrap gap-4 pt-1">
              {membersOptions.map((m, i) => (
                <label key={i} className="flex items-center gap-2 text-xs font-medium cursor-pointer text-slate-750 dark:text-slate-200 hover:text-slate-950 hover:dark:text-white">
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(m)}
                    onChange={() => handleToggleMember(m)}
                    className="w-4 h-4 accent-rose-500 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                  />
                  <span>{m}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-855 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Total por persona estimación:</span>
            <span className="font-bold text-rose-600 dark:text-rose-450 font-mono">
              {selectedMembers.length > 0 && splitAmount
                ? (parseFloat(splitAmount) / selectedMembers.length).toLocaleString()
                : '0'}{' '}
              RD$ c/u
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setSplitFormOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedMembers.length === 0}
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              {isSubmitting ? 'Guardando...' : 'Dividir Cuenta'}
            </button>
          </div>
        </form>
      )}

      {/* Split Expenses Active Lists */}
      {splitRecords.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-rose-650 dark:text-rose-400 flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-2">
            <Users className="w-4.5 h-4.5" />
            Cuentas Familiares Compartidas (Gasto Dividido)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {splitRecords.map((item) => (
              <div key={item.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-850 space-y-4 relative group shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-tight">{item.description}</h4>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block mt-0.5">Fecha: {item.date}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-450 font-mono">
                      {item.totalAmount.toLocaleString()} RD$
                    </span>
                    {(currentUser.role === 'Admin' || currentUser.role === 'Miembro') && (
                      <div className="relative">
                        {deletingSplitId === item.id ? (
                          <div className="absolute right-0 top-0 bg-red-500/10 border border-red-200 dark:border-red-500/20 px-2 py-0.5 rounded-lg flex items-center gap-1 z-10 whitespace-nowrap">
                            <span className="text-[9px] text-red-600 dark:text-red-400 font-bold">¿Borrar?</span>
                            <button
                              onClick={async () => {
                                await onDeleteSplit(item.id);
                                setDeletingSplitId(null);
                              }}
                              className="px-1.5 py-0.2 bg-red-650 hover:bg-red-700 text-white text-[8px] font-bold rounded cursor-pointer"
                            >
                              Sí
                            </button>
                            <button
                              onClick={() => setDeletingSplitId(null)}
                              className="px-1.5 py-0.2 bg-slate-200 hover:bg-slate-350 dark:bg-slate-850 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[8px] font-bold rounded cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeletingSplitId(item.id)}
                            className="p-1 text-slate-450 hover:text-red-500 hover:bg-red-500/10 rounded cursor-pointer transition-colors"
                            title="Borrar división"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-900/60 pt-3.5 space-y-2">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Miembros Cuota ({item.participants.length}):</span>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {item.participants.map((person, index) => (
                      <div key={index} className="flex justify-between items-center p-2 rounded-lg bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-900">
                        <div className="flex items-center gap-2">
                          {currentUser.role !== 'Invitado' ? (
                            <button
                              type="button"
                              onClick={() => onToggleSplitPaid(item.id, person.name)}
                              className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                              title="Cambiar estatus de pago"
                            >
                              {person.paid ? (
                                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
                              ) : (
                                <Circle className="w-4.5 h-4.5 text-slate-400 dark:text-slate-600" />
                              )}
                            </button>
                          ) : (
                            person.paid ? (
                              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
                            ) : (
                              <Circle className="w-4.5 h-4.5 text-slate-300 dark:text-slate-700" />
                            )
                          )}
                          <span className="text-xs text-slate-750 dark:text-slate-200">{person.name}</span>
                        </div>
                        <span className={`text-[10px] font-semibold font-mono ${person.paid ? 'text-slate-400 line-through' : 'text-slate-600 dark:text-slate-405'}`}>
                          {person.share.toLocaleString()} RD$
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expenses List & Filters */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/20 border border-slate-205 dark:border-slate-800 space-y-4 shadow-sm">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-650 dark:text-slate-400 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            Tabla de Historial Egresos Diarios ({filteredExpenses.length})
          </h3>
          
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1 text-[11px] rounded-lg text-slate-700 dark:text-slate-300 outline-none focus:border-rose-500 transition-colors"
            >
              <option value="all">Filtrar Categoría (Todas)</option>
              {Array.from(new Set(expenses.map(e => e.category))).map((cat, i) => (
                <option key={i} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xs text-slate-450 dark:text-slate-500 font-mono">No hay registros de egresos para este filtro.</p>
          </div>
        ) : (
          <div className="overflow-x-auto text-[11px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-850 text-slate-450 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 font-bold">Fecha</th>
                  <th className="py-2.5 font-bold">Categoría</th>
                  <th className="py-2.5 font-bold">Descripción</th>
                  <th className="py-2.5 font-bold">Cobrador / Registrado</th>
                  <th className="py-2.5 font-bold text-right">Monto Erogado</th>
                  {(currentUser.role === 'Admin' || currentUser.role === 'Miembro') && <th className="py-2.5 font-bold text-right">Acción</th>}
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((e) => (
                  <tr key={e.id} className="border-b border-slate-150 dark:border-slate-850/60 hover:bg-slate-100/50 dark:hover:bg-slate-950/30 transition-colors">
                    <td className="py-3 font-mono text-slate-700 dark:text-slate-300">{e.date}</td>
                    <td className="py-3 font-semibold text-slate-755 dark:text-slate-200">
                      <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 text-slate-655 dark:text-slate-400 shadow-sm">
                        {e.category}
                      </span>
                    </td>
                    <td className="py-3 font-medium text-slate-900 dark:text-white max-w-sm">{e.description}</td>
                    <td className="py-3 font-semibold text-slate-500 dark:text-slate-400">{e.registeredBy}</td>
                    <td className="py-3 font-mono text-right font-bold text-rose-600 dark:text-rose-450 text-xs">
                      {e.amount.toLocaleString()} RD$
                    </td>
                    {(currentUser.role === 'Admin' || currentUser.role === 'Miembro') && (
                      <td className="py-3 text-right whitespace-nowrap">
                        {deletingExpenseId === e.id ? (
                          <div className="flex items-center justify-end gap-1 px-1.5 py-0.5 rounded-lg border border-red-250 dark:border-red-500/20 bg-red-500/5 animate-in fade-in duration-100">
                            <span className="text-[9px] text-red-650 dark:text-red-400 font-bold">¿Borrar?</span>
                            <button
                              onClick={async () => {
                                await onDeleteExpense(e.id);
                                setDeletingExpenseId(null);
                              }}
                              className="px-1.5 py-0.5 bg-red-650 hover:bg-red-700 text-white text-[9px] font-bold rounded cursor-pointer"
                            >
                              Sí
                            </button>
                            <button
                              onClick={() => setDeletingExpenseId(null)}
                              className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[9px] font-bold rounded cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeletingExpenseId(e.id)}
                            className="p-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-red-500/30 hover:bg-red-500/10 text-slate-400 hover:text-red-650 dark:hover:text-red-400 transition-colors cursor-pointer"
                            title="Eliminar Gasto"
                          >
                            <Trash2 className="w-3.5 h-3.5 inline" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                
                {/* Total accumulation line */}
                <tr className="bg-slate-100/30 dark:bg-slate-950/20 font-semibold font-mono">
                  <td colSpan={4} className="py-3.5 text-right uppercase tracking-wider text-slate-500 dark:text-slate-404 pr-5">Suma Acumulada Egresos Filtro:</td>
                  <td className="py-3.5 text-right text-rose-600 dark:text-rose-450 font-bold text-xs">{sumOfFiltered.toLocaleString()} RD$</td>
                  {(currentUser.role === 'Admin' || currentUser.role === 'Miembro') && <td />}
                </tr>
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
}
