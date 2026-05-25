import { useState, FormEvent } from 'react';
import { ConfigItem, User } from '../types';
import { Settings, Trash2, Plus, Sparkles, UserPlus, Database, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ConfigViewProps {
  configItems: ConfigItem[];
  onAddConfigItem: (type: 'gasto' | 'producto' | 'terreno', value: string) => Promise<void>;
  onDeleteConfigItem: (id: string) => Promise<void>;
  onResetToDefault: () => Promise<void>;
  currentUser: User;
  users: User[];
  onAddUser: (user: Omit<User, 'id'>) => boolean;
  onDeleteUser: (id: string) => Promise<void>;
}

export function ConfigView({
  configItems,
  onAddConfigItem,
  onDeleteConfigItem,
  onResetToDefault,
  currentUser,
  users,
  onAddUser,
  onDeleteUser
}: ConfigViewProps) {
  // Option state
  const [paramType, setParamType] = useState<'gasto' | 'producto' | 'terreno'>('producto');
  const [paramValue, setParamValue] = useState('');

  // User input state
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState<'Admin' | 'Miembro' | 'Invitado'>('Miembro');
  const [newAvatar, setNewAvatar] = useState('👨‍🌾');

  const avatarOptions = ['👨‍🌾', '👩‍🌾', '👨‍🔧', '👩‍🔧', '👨‍💻', '👩‍💻', '🤠', '👵', '👴'];

  // Deleting confirmation states
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const handleAddParam = async (e: FormEvent) => {
    e.preventDefault();
    if (!paramValue.trim()) return;

    try {
      await onAddConfigItem(paramType, paramValue.trim());
      setParamValue('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateUser = (e: FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newFullName.trim()) {
      alert('Por favor completa todos los campos.');
      return;
    }

    const payload = {
      username: newUsername.trim().toLowerCase(),
      fullName: newFullName.trim(),
      role: newRole,
      avatar: newAvatar
    };

    const success = onAddUser(payload);
    if (success) {
      setNewUsername('');
      setNewFullName('');
      alert(`Miembro "${payload.fullName}" ha sido agregado con éxito al Rancho.`);
    } else {
      alert('Se ha alcanzado el límite máximo de miembros (10) para esta cuenta conuco.');
    }
  };

  const productsList = configItems.filter(c => c.type === 'producto');
  const expensesList = configItems.filter(c => c.type === 'gasto');
  const terrainsList = configItems.filter(c => c.type === 'terreno');

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-in fade-in duration-200">
      
      {/* Header section with Actions */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-5.5 h-5.5 text-indigo-500 dark:text-indigo-400" />
          Configuración Maestras Rancho
        </h2>
        <p className="text-xs text-slate-550 dark:text-slate-404 mt-1">
          Especial para administrar las opciones por defecto de cultivos, clasificaciones de egreso, conucos, accesos de miembros y base de datos.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column (8 spans) - Master parameters configuration */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Master parameters list panel */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-2">
              <Sparkles className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              Catálogos Maestros de Opciones
            </h3>

            {currentUser.role !== 'Invitado' && (
              <form onSubmit={handleAddParam} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 flex flex-col sm:flex-row gap-3">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Tipo de Parámetro</label>
                  <select
                    value={paramType}
                    onChange={(e) => setParamType(e.target.value as any)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs px-2.5 py-1.5 text-slate-900 dark:text-white focus:border-emerald-500"
                  >
                    <option value="producto" className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white">Producto Agrícola (Cultivo)</option>
                    <option value="gasto" className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white">Categoría de Egreso</option>
                    <option value="terreno" className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white">Conuco / Ubicación Geográfica</option>
                  </select>
                </div>

                <div className="flex-1 space-y-1">
                  <label className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">Nombre / Valor</label>
                  <input
                    type="text"
                    placeholder="Ej. Café Arábica, Insecticidas, Sector Río Loma"
                    value={paramValue}
                    onChange={(e) => setParamValue(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-lg text-xs px-2.5 py-1.5 text-slate-900 dark:text-white focus:border-emerald-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-1.5 rounded-lg text-xs self-end h-9.5 flex items-center gap-1.5 cursor-pointer shadow-md hover:scale-[101] active:scale-[98] transition-transform"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar
                </button>
              </form>
            )}

            {/* List breakdown by param columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              
              {/* Product column */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-850 rounded-xl space-y-3 shadow-sm">
                <h4 className="font-bold border-b border-slate-200 dark:border-slate-900 pb-1.5 text-slate-800 dark:text-slate-350">🍉 Cultivos ({productsList.length})</h4>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {productsList.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-850/40 text-[11px]">
                      <span className="text-slate-800 dark:text-slate-300 font-medium">{item.value}</span>
                      {currentUser.role === 'Admin' && (
                        <button
                          onClick={() => onDeleteConfigItem(item.id)}
                          className="text-slate-400 hover:text-red-500 p-0.5 rounded cursor-pointer"
                          title="Remover"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Expenses column */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-850 rounded-xl space-y-3 shadow-sm">
                <h4 className="font-bold border-b border-slate-200 dark:border-slate-900 pb-1.5 text-slate-800 dark:text-slate-350">💸 Egresos Categorías ({expensesList.length})</h4>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {expensesList.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-850/40 text-[11px]">
                      <span className="text-slate-805 dark:text-slate-300 font-medium">{item.value}</span>
                      {currentUser.role === 'Admin' && (
                        <button
                          onClick={() => onDeleteConfigItem(item.id)}
                          className="text-slate-400 hover:text-red-500 p-0.5 rounded cursor-pointer"
                          title="Remover"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Terrains column */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-850 rounded-xl space-y-3 shadow-sm">
                <h4 className="font-bold border-b border-slate-200 dark:border-slate-900 pb-1.5 text-slate-800 dark:text-slate-350">🗺️ Ubicaciones ({terrainsList.length})</h4>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {terrainsList.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-850/40 text-[11px]">
                      <span className="text-slate-805 dark:text-slate-300 font-medium">{item.value}</span>
                      {currentUser.role === 'Admin' && (
                        <button
                          onClick={() => onDeleteConfigItem(item.id)}
                          className="text-slate-400 hover:text-red-500 p-0.5 rounded cursor-pointer"
                          title="Remover"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* Database resets parameters */}
          {currentUser.role === 'Admin' && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-450 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-850 pb-2">
                <Database className="w-4.5 h-4.5" />
                Control de Backup y Reinicio de Datos
              </h3>
              <p className="text-xs text-slate-550 dark:text-slate-404 leading-relaxed">
                Opción de mantenimiento exclusiva del administrador. Esta acción limpiará de manera completa los movimientos de cultivos, gastos directos y cuentas compartidas familiares de la base de datos de Firestore, y sembrará los registros demostrativos de calibración.
              </p>
              
              <div className="p-3.5 bg-rose-500/5 rounded-xl border border-rose-250 dark:border-rose-500/10 flex items-start gap-2 text-xs">
                <AlertTriangle className="w-4.5 h-4.5 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-rose-700 dark:text-rose-300">
                  <strong>¡Atención Directa!</strong> Esta acción borrará permanentemente todo el historial real en curso de la aplicación.
                </p>
              </div>

              <button
                type="button"
                onClick={onResetToDefault}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-rose-500/10 border border-slate-200 hover:border-rose-500/30 text-rose-650 dark:text-rose-400 hover:dark:text-rose-400 dark:bg-slate-800 dark:hover:bg-rose-500/15 dark:border-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Inicializar / Sembrar Datos Predeteminados Demo
              </button>
            </div>
          )}

        </div>

        {/* Right column (4 spans) - Active members accounts control */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between font-semibold">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4.5 h-4.5 text-indigo-500 dark:text-indigo-400" />
              Socio-Miembros del Rancho
            </h3>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">({users.length}/10)</span>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {users.map((member) => (
              <div key={member.id} className="flex justify-between items-center p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 shadow-sm relative">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{member.avatar}</span>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white leading-none">{member.fullName}</h5>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1 block">Rango: <span className="font-semibold">{member.role}</span></span>
                  </div>
                </div>

                {currentUser.role === 'Admin' && (
                  <div className="relative">
                    {deletingUserId === member.id ? (
                      <div className="absolute right-0 top-0 bg-red-500/10 border border-red-200 dark:border-red-500/20 px-2 py-0.5 rounded-lg flex items-center gap-1 z-10 whitespace-nowrap">
                        <span className="text-[9px] text-red-600 dark:text-red-400 font-bold">¿Baja?</span>
                        <button
                          onClick={async () => {
                            await onDeleteUser(member.id);
                            setDeletingUserId(null);
                          }}
                          className="px-1.5 py-0.2 bg-red-650 hover:bg-red-700 text-white text-[8px] font-bold rounded cursor-pointer"
                        >
                          Sí
                        </button>
                        <button
                          onClick={() => setDeletingUserId(null)}
                          className="px-1.5 py-0.2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[8px] font-bold rounded cursor-pointer"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingUserId(member.id)}
                        className="p-1 px-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded cursor-pointer transition-colors"
                        title="Remover miembro"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {currentUser.role === 'Admin' && (
            <form onSubmit={handleCreateUser} className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-3.5">
              <h4 className="text-[11px] font-bold text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                <UserPlus className="w-4.5 h-4.5 text-indigo-500 dark:text-indigo-400" />
                Registrar Nuevo Socio / Hermano
              </h4>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-505 dark:text-slate-400 block uppercase font-bold">Nombre Completo</label>
                <input
                  type="text"
                  placeholder="Ej. Clara Modesta"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs px-2.5 py-1.5 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-505 dark:text-slate-400 block uppercase font-bold">Rango Acceso</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs px-2.5 py-1.5 text-slate-900 dark:text-white focus:border-indigo-500"
                >
                  <option value="Miembro" className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white">Miembro Estándar (Modifica cosechas/gastos)</option>
                  <option value="Admin" className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white">Administrador (Control total y base de datos)</option>
                  <option value="Invitado" className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white">Invitado Lectura (Solo visualiza reportes)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-505 dark:text-slate-400 block uppercase font-bold">Avatar</label>
                <div className="flex gap-2 flex-wrap pt-0.5">
                  {avatarOptions.map((av, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNewAvatar(av)}
                      className={`text-base p-1 rounded-lg border-2 cursor-pointer transition-colors ${newAvatar === av ? 'bg-slate-100 border-emerald-500 dark:bg-slate-850' : 'bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-slate-900'}`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              {/* Username generated based on fullName */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-505 dark:text-slate-400 block uppercase font-bold">Nombre de Acceso (Usuario)</label>
                <input
                  type="text"
                  placeholder="Se genera automáticamente"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z]/g, ''))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-lg text-xs px-2.5 py-1.5 text-slate-900 dark:text-white font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-505 hover:dark:bg-indigo-500 text-white font-bold py-2 px-3 rounded-lg text-xs transition-colors cursor-pointer"
              >
                Inscribir Miembro
              </button>
            </form>
          )}

        </div>

      </div>

    </div>
  );
}
