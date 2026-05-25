import { useState, FormEvent } from 'react';
import { PropertyRecord, User, ExpenseRecord } from '../types';
import { Home, Trash2, ShieldCheck, Sparkles, Plus, CheckCircle, Clock, AlertCircle, FileText, UserCheck, DollarSign } from 'lucide-react';

interface PropertiesViewProps {
  properties: PropertyRecord[];
  expenses: ExpenseRecord[];
  onAddProperty: (record: Omit<PropertyRecord, 'id' | 'debt'>) => Promise<void>;
  onUpdateProperty: (updated: PropertyRecord) => Promise<void>;
  onDeleteProperty: (id: string) => Promise<void>;
  currentUser: User;
  triggerNotification?: (message: string, type: 'success' | 'info' | 'error') => void;
}

export function PropertiesView({
  properties,
  onAddProperty,
  onUpdateProperty,
  onDeleteProperty,
  currentUser,
  triggerNotification
}: PropertiesViewProps) {
  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState('Local Comercial');
  const [customType, setCustomType] = useState('');
  const [isCustomType, setIsCustomType] = useState(false);
  const [tenant, setTenant] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [status, setStatus] = useState<'Al Día' | 'Pendiente' | 'En Mora'>('Al Día');

  const [formOpen, setFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inline deletion confirmation state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !tenant || !monthlyRent) {
      alert('Por favor completa todos los campos.');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalType = isCustomType ? customType : type;

      const record = {
        name: name.trim(),
        type: finalType,
        tenant: tenant.trim(),
        monthlyRent: parseFloat(monthlyRent),
        status,
        vouchers: []
      };

      await onAddProperty(record);

      if (triggerNotification) {
        triggerNotification(`¡Éxito! Nueva propiedad registrada para cobros: ${name.trim()} arrendada por ${tenant.trim()}.`, 'success');
      }

      setName('');
      setTenant('');
      setMonthlyRent('');
      setFormOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Payment Registrar trigger
  const handleRecordPayment = async (prop: PropertyRecord) => {
    // Collect full payment or change status to "Al Día"
    const originalDebt = prop.debt;
    const originalStatus = prop.status;

    let updated: PropertyRecord;

    if (originalStatus === 'En Mora') {
      // Reduce to Pendiente
      updated = {
        ...prop,
        status: 'Pendiente',
        debt: prop.monthlyRent
      };
    } else if (originalStatus === 'Pendiente') {
      // Set to Al Día
      updated = {
        ...prop,
        status: 'Al Día',
        debt: 0
      };
    } else {
      // If already Al Día, let's keep it so
      alert('Esta propiedad ya se encuentra al día con los pagos del mes.');
      return;
    }

    try {
      await onUpdateProperty(updated);
      if (triggerNotification) {
        triggerNotification(`Cobro de alquiler registrado para "${prop.name}". Su nuevo estado es: ${updated.status}.`, 'info');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleManualStatusToggle = async (prop: PropertyRecord, statusName: 'Al Día' | 'Pendiente' | 'En Mora') => {
    const debt = statusName === 'En Mora' ? prop.monthlyRent * 2 : statusName === 'Pendiente' ? prop.monthlyRent : 0;
    const updated = {
      ...prop,
      status: statusName,
      debt
    };
    try {
      await onUpdateProperty(updated);
      if (triggerNotification) {
        triggerNotification(`Estado de cobros de "${prop.name}" modificado a: ${statusName}.`, 'info');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Calculations
  const activePropertiesCount = properties.length;
  const expectedMonthlyIncome = properties.reduce((acc, p) => acc + p.monthlyRent, 0);
  const currentOutstandingDebt = properties.reduce((acc, p) => acc + p.debt, 0);

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-in fade-in duration-200">
      
      {/* Header section with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Home className="w-5.5 h-5.5 text-amber-500" />
            Propiedades Familiares y Arriendos
          </h2>
          <p className="text-xs text-slate-550 dark:text-slate-404 mt-1">
            Gestión y seguimiento de rentas mensuales familiares de locales comerciales, casas rurales y estacionamientos.
          </p>
        </div>
        
        {currentUser.role !== 'Invitado' && (
          <button
            onClick={() => setFormOpen(!formOpen)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-lg hover:shadow-amber-500/10 active:scale-95 cursor-pointer self-start sm:self-center"
            id="open-add-property-btn"
          >
            <Plus className="w-4 h-4" />
            {formOpen ? 'Cerrar Ficha' : 'Nueva Propiedad'}
          </button>
        )}
      </div>

      {/* Register Property Form */}
      {formOpen && currentUser.role !== 'Invitado' && (
        <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 pb-5 grid grid-cols-1 md:grid-cols-12 gap-5 animate-in slide-in-from-top-4 duration-200 shadow-sm">
          <div className="col-span-12 border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-550" />
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Crear nueva ficha de arrendatario</h3>
          </div>

          <div className="col-span-12 md:col-span-6 space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Identificación / Apodo Propiedad</label>
            <input
              type="text"
              placeholder="Ej. Casa Antigua Pepín, Local Esquina Sur"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs px-3 py-2 text-slate-900 dark:text-white focus:border-amber-500 outline-none font-medium"
              required
            />
          </div>

          <div className="col-span-12 md:col-span-6 space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Tipo de Inmueble</label>
              <button
                type="button"
                onClick={() => setIsCustomType(!isCustomType)}
                className="text-[9px] text-amber-600 dark:text-amber-400 font-bold cursor-pointer hover:underline"
              >
                {isCustomType ? 'Elegir lista' : 'Otros / Personalizar'}
              </button>
            </div>
            {isCustomType ? (
              <input
                type="text"
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                placeholder="Ej. Bodega, Nave de Almacén"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs px-3 py-2 text-slate-900 dark:text-white focus:border-amber-500 outline-none"
                required
              />
            ) : (
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-xl text-xs px-3 py-2 text-slate-900 dark:text-white focus:border-amber-500 outline-none font-medium"
              >
                <option value="Local Comercial" className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white">Local Comercial</option>
                <option value="Solar Estacionamiento" className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white">Solar Estacionamiento</option>
                <option value="Vivienda Familiar" className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white">Vivienda Familiar</option>
                <option value="Terreno Cultivo Arriendo" className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white">Terreno Cultivo Arriendo</option>
              </select>
            )}
          </div>

          <div className="col-span-12 md:col-span-4 space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Nombre del Inquilino / Arrendatario</label>
            <input
              type="text"
              placeholder="Ej. Juan Francisco Torres"
              value={tenant}
              onChange={(e) => setTenant(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs px-3 py-2 text-slate-900 dark:text-white focus:border-amber-500 outline-none font-medium"
              required
            />
          </div>

          <div className="col-span-12 md:col-span-4 space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Mensualidad Exigible (RD$)</label>
            <input
              type="number"
              min="1"
              placeholder="Ej. 12000"
              value={monthlyRent}
              onChange={(e) => setMonthlyRent(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs px-3 py-2 text-slate-900 dark:text-white focus:border-amber-500 outline-none font-mono font-medium"
              required
            />
          </div>

          <div className="col-span-12 md:col-span-4 space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Estado de Inicialización</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'Al Día' | 'Pendiente' | 'En Mora')}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs px-3 py-2 text-slate-900 dark:text-white focus:border-amber-500 outline-none font-medium"
            >
              <option value="Al Día" className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white">Al Día (Sin saldo vencido)</option>
              <option value="Pendiente" className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white">Pendiente (Debe 1 mes)</option>
              <option value="En Mora" className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white">En Mora (Debe 2 meses de alquiler)</option>
            </select>
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
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              {isSubmitting ? 'Guardando...' : 'Crear Arriendo'}
            </button>
          </div>
        </form>
      )}

      {/* Statistics calculations cards for properties */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-805 rounded-xl shadow-sm">
          <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 block p-0.5">Propiedades Controladas</span>
          <span className="text-xl font-bold text-slate-850 dark:text-slate-100 block mt-1">{activePropertiesCount} Inmuebles</span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-805 rounded-xl shadow-sm">
          <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 block p-0.5">Facturación Alquiler Mensual</span>
          <span className="text-xl font-bold text-amber-600 dark:text-amber-450 font-mono block mt-1">{expectedMonthlyIncome.toLocaleString()} RD$</span>
        </div>

        <div className="p-4 bg-amber-550/5 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/10 rounded-xl shadow-sm">
          <span className="text-[9px] uppercase tracking-wider font-bold text-amber-700 dark:text-slate-400 block p-0.5">Monto Total Pendiente/Mora</span>
          <span className="text-xl font-bold text-rose-600 dark:text-rose-400 font-mono block mt-1">{currentOutstandingDebt.toLocaleString()} RD$</span>
        </div>
      </div>

      {/* Rent properties layout list */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {properties.map((item) => {
          const statusColors = {
            'Al Día': 'text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/20 bg-emerald-500/5',
            'Pendiente': 'text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-500/20 bg-amber-505/5 dark:bg-amber-500/5',
            'En Mora': 'text-rose-600 dark:text-rose-455 border-rose-300 dark:border-rose-500/20 bg-rose-500/5',
          };
          
          return (
            <div key={item.id} className="p-5 rounded-2xl bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4 shadow-sm relative">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 font-mono">
                    {item.type}
                  </span>
                  
                  <span className={`text-[10px] font-bold px-2 py-0.5 border rounded-lg ${statusColors[item.status]}`}>
                    {item.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">{item.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    inquilino: <strong className="text-slate-750 dark:text-slate-200 font-semibold">{item.tenant}</strong>
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-205 dark:border-slate-850 pt-3 flex justify-between items-center text-xs">
                <div>
                  <span className="text-[9px] text-slate-500 dark:text-slate-450 uppercase block font-bold leading-none">Renta Mensual</span>
                  <span className="font-mono mt-1 font-bold text-slate-800 dark:text-slate-200">{item.monthlyRent.toLocaleString()} RD$</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-slate-500 dark:text-slate-450 uppercase block font-bold leading-none">Deuda Pendiente</span>
                  <span className={`font-mono mt-1 font-bold ${item.debt > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-404 dark:text-slate-500'}`}>
                    {item.debt.toLocaleString()} RD$
                  </span>
                </div>
              </div>

              {/* Status and Action Panel */}
              <div className="pt-2 border-t border-slate-205 dark:border-slate-850/70 flex flex-col gap-2">
                
                {currentUser.role !== 'Invitado' && item.status !== 'Al Día' && (
                  <button
                    onClick={() => handleRecordPayment(item)}
                    className="w-full py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10px] leading-relaxed cursor-pointer text-center active:scale-[98] transition-transform"
                  >
                    Marcar Pago Mensual Recibido
                  </button>
                )}

                {currentUser.role !== 'Invitado' && (
                  <div className="flex gap-1.5 justify-between">
                    <span className="text-[9px] font-bold text-slate-540 dark:text-slate-500 pt-1.5">Forzar:</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleManualStatusToggle(item, 'Al Día')}
                        className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold cursor-pointer ${item.status === 'Al Día' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-emerald-600'}`}
                      >
                        Al Día
                      </button>
                      <button
                        onClick={() => handleManualStatusToggle(item, 'Pendiente')}
                        className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold cursor-pointer ${item.status === 'Pendiente' ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-amber-600'}`}
                      >
                        Pendiente
                      </button>
                      <button
                        onClick={() => handleManualStatusToggle(item, 'En Mora')}
                        className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold cursor-pointer ${item.status === 'En Mora' ? 'bg-rose-500 text-slate-950' : 'bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-rose-600'}`}
                      >
                        En Mora
                      </button>
                    </div>
                  </div>
                )}

                {currentUser.role === 'Admin' && (
                  <div className="relative mt-1">
                    {deletingId === item.id ? (
                      <div className="bg-red-500/5 border border-red-250 dark:border-red-500/20 px-2 py-1 rounded-lg flex items-center justify-between w-full animate-in fade-in duration-100">
                        <span className="text-[9px] text-red-600 dark:text-red-400 font-bold">¿Deseas eliminar este inmueble?</span>
                        <div className="flex gap-1.5">
                          <button
                            onClick={async () => {
                              await onDeleteProperty(item.id);
                              setDeletingId(null);
                            }}
                            className="px-2 py-0.5 bg-red-650 hover:bg-red-700 text-white text-[8px] font-bold rounded cursor-pointer"
                          >
                            Sí, Remover
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[8px] font-bold rounded cursor-pointer"
                          >
                            No
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingId(item.id)}
                        className="w-full flex items-center justify-center gap-1.5 text-[10px] text-slate-450 hover:text-red-650 dark:hover:text-red-400 py-1 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remover Inmueble
                      </button>
                    )}
                  </div>
                )}

              </div>
            </div>
          )
        })}
      </div>

    </div>
  );
}
