import { useState, useEffect } from 'react';
import { User, ProductionRecord, ExpenseRecord, PropertyRecord, ConfigItem, AuditLog, SplitRecord } from './types';
import {
  INITIAL_PRODUCTION,
  INITIAL_EXPENSES,
  INITIAL_PROPERTIES,
  INITIAL_CONFIG,
  INITIAL_AUDIT,
  INITIAL_USERS,
  getSavedState,
  saveState,
  generateUUID
} from './data';

// Import Screens & Modules
import { LoginScreen } from './components/LoginScreen';
import { DashboardView } from './components/DashboardView';
import { ProductionView } from './components/ProductionView';
import { ExpensesView } from './components/ExpensesView';
import { PropertiesView } from './components/PropertiesView';
import { ReportsView } from './components/ReportsView';
import { HistoryView } from './components/HistoryView';
import { ConfigView } from './components/ConfigView';

// Firebase interface imports
import {
  db,
  listenCollection,
  saveDocument,
  removeDocument,
  seedInitialDataIfEmpty
} from './firebase';

// Icons Import
import {
  Building2,
  LayoutDashboard,
  Sprout,
  Wallet,
  Home,
  BarChart3,
  History,
  Settings,
  LogOut,
  Menu,
  X,
  User as UserIcon,
  Sun,
  Moon,
  CloudLightning,
  RefreshCw
} from 'lucide-react';

interface NotificationAlert {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

export default function App() {
  // Theme state: dark or light
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('family_biz_theme') as 'dark' | 'light') || 'dark';
  });

  // 1. Initial State Load
  const [currentUser, setCurrentUser] = useState<User | null>(() => getSavedState('current_user', null));
  const [activeTab, setActiveTab] = useState<string>(() => getSavedState('active_tab', 'dashboard'));

  // Notification Toast alert state
  const [toasts, setToasts] = useState<NotificationAlert[]>([]);

  // Function to show gorgeous real-time notification alerts
  const triggerNotification = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = generateUUID();
    const newAlert: NotificationAlert = { id, message, type };
    setToasts(prev => [...prev, newAlert]);

    // Automatically remove after 5.5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5500);
  };

  // Database States loaded with local state first as fallback
  const [production, setProduction] = useState<ProductionRecord[]>(() =>
    getSavedState('production', INITIAL_PRODUCTION)
  );
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() =>
    getSavedState('expenses', INITIAL_EXPENSES)
  );
  const [properties, setProperties] = useState<PropertyRecord[]>(() =>
    getSavedState('properties', INITIAL_PROPERTIES)
  );
  const [configItems, setConfigItems] = useState<ConfigItem[]>(() =>
    getSavedState('config', INITIAL_CONFIG)
  );
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() =>
    getSavedState('audit', INITIAL_AUDIT)
  );
  const [splitRecords, setSplitRecords] = useState<SplitRecord[]>(() =>
    getSavedState('splits', [])
  );

  // Guarantee that initial users (rafael, maria, carlos) are always present to avoid login locks
  const [users, setUsers] = useState<User[]>(() => {
    const saved = getSavedState<User[]>('users', INITIAL_USERS);
    const merged = [...saved];
    INITIAL_USERS.forEach(initU => {
      if (!merged.some(u => u.username.toLowerCase() === initU.username.toLowerCase())) {
        merged.push(initU);
      }
    });
    return merged;
  });

  const [dbSynced, setDbSynced] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 2. Theme CSS class trigger
  useEffect(() => {
    localStorage.setItem('family_biz_theme', theme);
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Synchronize dynamic lists to localStorage as fallback
  useEffect(() => { saveState('current_user', currentUser); }, [currentUser]);
  useEffect(() => { saveState('users', users); }, [users]);
  useEffect(() => { saveState('active_tab', activeTab); }, [activeTab]);
  useEffect(() => { saveState('production', production); }, [production]);
  useEffect(() => { saveState('expenses', expenses); }, [expenses]);
  useEffect(() => { saveState('properties', properties); }, [properties]);
  useEffect(() => { saveState('config', configItems); }, [configItems]);
  useEffect(() => { saveState('audit', auditLogs); }, [auditLogs]);
  useEffect(() => { saveState('splits', splitRecords); }, [splitRecords]);

  // Firebase Realtime & Seeding synchronizer
  useEffect(() => {
    // Seed database collections once on mount if empty
    async function initFirebaseDb() {
      try {
        await seedInitialDataIfEmpty('users', INITIAL_USERS);
        await seedInitialDataIfEmpty('production', INITIAL_PRODUCTION);
        await seedInitialDataIfEmpty('expenses', INITIAL_EXPENSES);
        await seedInitialDataIfEmpty('properties', INITIAL_PROPERTIES);
        await seedInitialDataIfEmpty('configs', INITIAL_CONFIG);
        await seedInitialDataIfEmpty('audit', INITIAL_AUDIT);
        setDbSynced(true);
      } catch (err) {
        console.error("Firebase initializing seeder failed:", err);
      }
    }

    initFirebaseDb();

    // Subscribe to Firestore Realtime streams
    const unsubProd = listenCollection<ProductionRecord>('production', (data) => {
      if (data) {
        setProduction(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }
    });
    const unsubExp = listenCollection<ExpenseRecord>('expenses', (data) => {
      if (data) {
        setExpenses(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }
    });
    const unsubProp = listenCollection<PropertyRecord>('properties', (data) => {
      if (data) {
        setProperties(data.sort((a,b) => a.name.localeCompare(b.name)));
      }
    });
    const unsubConf = listenCollection<ConfigItem>('configs', (data) => {
      if (data) {
        setConfigItems(data);
      }
    });
    const unsubAud = listenCollection<AuditLog>('audit', (data) => {
      if (data) {
        setAuditLogs(data.sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
      }
    });
    const unsubSplits = listenCollection<SplitRecord>('splits', (data) => {
      if (data) {
        setSplitRecords(data);
      }
    });
    const unsubUsers = listenCollection<User>('users', (data) => {
      if (data) {
        // Enforce initial users still stay present
        const merged = [...data];
        INITIAL_USERS.forEach(initU => {
          if (!merged.some(u => u.username.toLowerCase() === initU.username.toLowerCase())) {
            merged.push(initU);
          }
        });
        setUsers(merged);
      }
    });

    return () => {
      unsubProd();
      unsubExp();
      unsubProp();
      unsubConf();
      unsubAud();
      unsubSplits();
      unsubUsers();
    };
  }, []);

  // 3. System action/log journal helper
  const addAuditLog = async (action: string, details: string, userOverride?: User) => {
    const userObj = userOverride || currentUser;
    if (!userObj) return;

    const newLog: AuditLog = {
      id: generateUUID(),
      username: userObj.fullName,
      role: userObj.role,
      action,
      details,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    // Save to Firestore
    await saveDocument('audit', newLog.id, newLog);
  };

  // 4. Data action dispatchers (Persist direct to Firebase)

  // Authentication callbacks
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setMobileMenuOpen(false);
    setActiveTab('dashboard');
    
    // Add audit log
    const logDetails = `Ingresó al sistema Rancho Modesta.`;
    addAuditLog('Sesión Iniciada', logDetails, user);
    triggerNotification(`¡Hola ${user.fullName}! Has ingresado con éxito al portal familiar.`, 'info');
  };

  const handleLogout = () => {
    if (currentUser) {
      addAuditLog('Sesión Cerrada', 'Salió de la aplicación de forma voluntaria.');
      triggerNotification(`Has cerrado sesión correctamente. ¡Hasta luego!`, 'info');
    }
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  // Production dispatchers
  const handleAddProduction = async (record: Omit<ProductionRecord, 'id' | 'profit'>) => {
    const newRecord: ProductionRecord = {
      ...record,
      id: generateUUID(),
      profit: record.revenue - record.cost
    };

    await saveDocument('production', newRecord.id, newRecord);
    await addAuditLog(
      'Cosecha Registrada',
      `Añadió lote de ${record.quantity} ${record.unit} de ${record.product} con ganancia estimada de ${newRecord.profit} RD$.`
    );
    triggerNotification(`¡Éxito! Nueva cosecha de ${record.product} registrada correctamente en Conucos.`, 'success');
  };

  const handleDeleteProduction = async (id: string) => {
    const target = production.find(p => p.id === id);
    setProduction(prev => prev.filter(p => p.id !== id));
    await removeDocument('production', id);
    if (target) {
      await addAuditLog('Cosecha Eliminada', `Removió producción de ${target.product} fechada el ${target.date}.`);
      triggerNotification(`Registro de cosecha removido exitosamente.`, 'info');
    }
  };

  // Expenses dispatchers
  const handleAddExpense = async (record: Omit<ExpenseRecord, 'id'>) => {
    const newRecord: ExpenseRecord = {
      ...record,
      id: generateUUID()
    };

    await saveDocument('expenses', newRecord.id, newRecord);
    await addAuditLog('Gasto Registrado', `Registró gasto en ${record.category} por valor de ${record.amount} RD$.`);
    triggerNotification(`¡Éxito! Gasto por ${record.amount.toLocaleString()} RD$ registrado bajo "${record.category}".`, 'success');
  };

  const handleDeleteExpense = async (id: string) => {
    const target = expenses.find(e => e.id === id);
    setExpenses(prev => prev.filter(e => e.id !== id));
    await removeDocument('expenses', id);
    if (target) {
      await addAuditLog('Gasto Eliminado', `Removió salida de caja de ${target.description} por ${target.amount} RD$.`);
      triggerNotification(`Se eliminó la salida de caja de ${target.description}.`, 'info');
    }
  };

  // Properties dispatchers
  const handleAddProperty = async (record: Omit<PropertyRecord, 'id' | 'debt'>) => {
    const newRecord: PropertyRecord = {
      ...record,
      id: generateUUID(),
      debt: record.status === 'En Mora' ? record.monthlyRent * 2 : record.status === 'Pendiente' ? record.monthlyRent : 0,
      vouchers: []
    };

    await saveDocument('properties', newRecord.id, newRecord);
    await addAuditLog('Propiedad Agregada', `Creó arriendo de ariscos de ${record.name} (${record.type}).`);
    triggerNotification(`¡Éxito! Nueva propiedad "${record.name}" registrada para arriendo familiar.`, 'success');
  };

  const handleUpdateProperty = async (updated: PropertyRecord) => {
    await saveDocument('properties', updated.id, updated);
    await addAuditLog('Propiedad Actualizada', `Modificó estatus de pagos/arriendo de ${updated.name} (Estatus: ${updated.status}).`);
  };

  const handleDeleteProperty = async (id: string) => {
    const target = properties.find(p => p.id === id);
    await removeDocument('properties', id);
    if (target) {
      await addAuditLog('Propiedad Eliminada', `Removió de la ficha la propiedad familiar ${target.name}.`);
      triggerNotification(`Se ha eliminado el inmueble ${target.name}.`, 'info');
    }
  };

  // Config dispatchers
  const handleAddConfigItem = async (type: 'gasto' | 'producto' | 'terreno', value: string) => {
    const newItem: ConfigItem = {
      id: generateUUID(),
      type,
      value
    };

    await saveDocument('configs', newItem.id, newItem);
    await addAuditLog('Parámetro Agregado', `Registró nueva opción maestra para ${type}: '${value}'.`);
    triggerNotification(`Se registró '${value}' como nueva opción de configuración.`, 'success');
  };

  const handleDeleteConfigItem = async (id: string) => {
    const target = configItems.find(c => c.id === id);
    if (target) {
      await removeDocument('configs', id);
      await addAuditLog('Parámetro Eliminado', `Removió opción estándar para ${target.type}: '${target.value}'.`);
      triggerNotification(`Opción '${target.value}' eliminada de los catálogos.`, 'info');
    }
  };

  // Soft Reset option
  const handleResetToDefault = async () => {
    if (!window.confirm("¿Seguro que deseas reiniciar los datos predeterminados en Firebase Firestore? Esto revertirá los cambios actuales.")) return;
    
    // Hard deletes over database
    for (const p of production) await removeDocument('production', p.id);
    for (const e of expenses) await removeDocument('expenses', e.id);
    for (const pr of properties) await removeDocument('properties', pr.id);
    for (const c of configItems) await removeDocument('configs', c.id);
    for (const s of splitRecords) await removeDocument('splits', s.id);

    // Re-seed values
    for (const p of INITIAL_PRODUCTION) await saveDocument('production', p.id, p);
    for (const e of INITIAL_EXPENSES) await saveDocument('expenses', e.id, e);
    for (const pr of INITIAL_PROPERTIES) await saveDocument('properties', pr.id, pr);
    for (const c of INITIAL_CONFIG) await saveDocument('configs', c.id, c);

    await addAuditLog('Carga Inicial', 'Se restauraron los parámetros predeterminados de la base de datos familiar.');
    triggerNotification(`Valores restablecidos a los valores por defecto del Rancho.`, 'info');
  };

  const handleAddSplit = async (record: Omit<SplitRecord, 'id'>) => {
    const newRecord: SplitRecord = {
      ...record,
      id: generateUUID()
    };
    await saveDocument('splits', newRecord.id, newRecord);
    await addAuditLog('Gasto Dividido', `Dividió gasto de ${record.totalAmount} RD$ ("${record.description}") entre ${record.participants.length} personas.`);
  };

  const handleDeleteSplit = async (id: string) => {
    const target = splitRecords.find(s => s.id === id);
    await removeDocument('splits', id);
    if (target) {
      await addAuditLog('División Eliminada', `Removió el conteo compartido de "${target.description}".`);
      triggerNotification(`Se eliminó la división de cuenta para "${target.description}".`, 'info');
    }
  };

  const handleToggleSplitPaid = async (splitId: string, participantName: string) => {
    const s = splitRecords.find(item => item.id === splitId);
    if (s) {
      const updatedParticipants = s.participants.map(p => {
        if (p.name === participantName) {
          const newPaid = !p.paid;
          // Notify paid change
          triggerNotification(`${participantName} marcó como ${newPaid ? 'PAGADO' : 'PENDIENTE'} su cuota de "${s.description}".`, 'info');
          return { ...p, paid: newPaid };
        }
        return p;
      });
      const updatedRecord = { ...s, participants: updatedParticipants };
      await saveDocument('splits', splitId, updatedRecord);
    }
  };

  const handleAddUser = (u: Omit<User, 'id'>): boolean => {
    if (users.length >= 10) {
      return false;
    }
    const newUser: User = {
      ...u,
      id: generateUUID()
    };
    saveDocument('users', newUser.id, newUser).catch(err => console.error("Error saving user:", err));
    addAuditLog('Usuario Registrado', `Registró al miembro "${u.fullName}" (${u.role}).`);
    triggerNotification(`¡Bienvenido! Miembro ${u.fullName} inscrito correctamente.`, 'success');
    return true;
  };

  const handleDeleteUser = async (id: string) => {
    const targetUser = users.find(u => u.id === id);
    if (!targetUser) return;
    
    const remainingAdmins = users.filter(u => u.id !== id && u.role === 'Admin');
    if (remainingAdmins.length === 0) {
      alert('Error de Seguridad: Rancho Modesta requiere al menos un administrador activo.');
      return;
    }
    
    if (currentUser && currentUser.id === id) {
      alert('Has eliminado tu propia cuenta. Se cerrará la sesión de inmediato.');
      setCurrentUser(null);
    }

    await removeDocument('users', id);
    await addAuditLog('Usuario Eliminado', `Removió al miembro familiar "${targetUser.fullName}".`);
    triggerNotification(`Se eliminó el perfil del miembro ${targetUser.fullName}.`, 'info');
  };

  const handleClearLogs = async () => {
    if (!window.confirm("¿Seguro que deseas limpiar todos los logs de auditoría?")) return;
    for (const log of auditLogs) {
      await removeDocument('audit', log.id);
    }
    triggerNotification(`Auditorías históricas purgadas por el administrador.`, 'info');
  };

  // Convert theme variable colors toggle
  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // 5. Render Login Screen if not logged in
  if (!currentUser) {
    return (
      <div className={theme}>
        <LoginScreen users={users} onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  // 6. Navigation items
  const navItems = [
    { id: 'dashboard', label: 'Panel Resumen', icon: LayoutDashboard },
    { id: 'produccion', label: 'Producción Conucos', icon: Sprout },
    { id: 'gastos', label: 'Gastos / Egresos', icon: Wallet },
    { id: 'propiedades', label: 'Propiedades / Rentas', icon: Home },
    { id: 'reportes', label: 'Reportes', icon: BarChart3 },
    { id: 'historial', label: 'Historial', icon: History },
    { id: 'configuracion', label: 'Configuración', icon: Settings }
  ];

  const showFinances = currentUser && (
    currentUser.role === 'Admin' ||
    (currentUser.role === 'Miembro' && currentUser.username.toLowerCase() === 'maria')
  );

  const permittedNavItems = navItems.filter((item) => {
    if (!showFinances) {
      return ['dashboard', 'produccion', 'historial'].includes(item.id);
    }
    return true;
  });

  return (
    <div className={`min-h-screen flex font-sans ${theme === 'dark' ? 'dark text-slate-100 bg-[#080b11]' : 'text-slate-900 bg-[#f4f6f9]'}`}>
      
      {/* 1. Sidebar desktop navigation (Hidden on mobile) */}
      <aside className="hidden lg:flex flex-col w-64 border-r !border-[var(--border-subtle)] bg-[var(--bg-sidebar)] shrink-0 relative z-20">
        
        {/* Sidebar Header branding logotype */}
        <div className="p-6 border-b !border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/15">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-[var(--text-main)] leading-none">Rancho Modesta</h1>
              <span className="text-[10px] text-[var(--text-mute)] font-mono tracking-widest uppercase mt-1 block">Gestión Familiar</span>
            </div>
          </div>
        </div>

        {/* Firebase Live status helper */}
        <div className="px-6 py-2 bg-slate-500/5 border-b !border-[var(--border-subtle)] flex items-center justify-between text-[10px]">
          <span className="text-[var(--text-secondary)] font-medium flex items-center gap-1.5 font-mono">
            <span className={`w-2 h-2 rounded-full inline-block ${dbSynced ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
            Firestore Conectado
          </span>
          <span className="text-[var(--text-mute)] text-[9px] font-mono font-bold bg-[var(--bg-darker)] px-1.5 py-0.5 rounded border !border-[var(--border-subtle)]">
            LIVE
          </span>
        </div>

        {/* Sidebar Middle links looping */}
        <nav className="flex-1 p-4 space-y-1">
          {permittedNavItems.map((item) => {
            const isActive = activeTab === item.id;
            const IconComp = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/10'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-slate-500/5'
                }`}
              >
                <IconComp className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar User profile action dock panel */}
        <div className="p-4 border-t !border-[var(--border-subtle)] space-y-3 bg-slate-500/5">
          
          {/* Theme Switcher Toggle button */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between p-2 rounded-xl bg-[var(--bg-card)] border !border-[var(--border-subtle)] hover:bg-slate-500/10 text-xs text-[var(--text-secondary)] transition-all cursor-pointer shadow-sm"
            title="Cambiar Tema Color"
          >
            <span className="font-medium text-[11px]">Tema: {theme === 'dark' ? 'Oscuro' : 'Claro'}</span>
            <div className="p-1 rounded bg-[var(--bg-darker)] text-emerald-500 border !border-[var(--border-subtle)]">
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </div>
          </button>

          <div className="flex items-center gap-3 p-2 rounded-xl bg-[var(--bg-card)] border !border-[var(--border-subtle)]">
            <span className="text-base p-1 bg-slate-500/10 rounded-lg ">{currentUser.avatar}</span>
            <div className="overflow-hidden">
              <div className="text-[11px] font-bold text-[var(--text-main)] truncate">{currentUser.fullName}</div>
              <div className="text-[9px] text-[var(--text-mute)] font-mono lowercase truncate">{currentUser.role}</div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full bg-slate-500/10 hover:bg-red-500/10 border !border-[var(--border-subtle)] hover:!border-red-500/30 text-[var(--text-secondary)] hover:text-red-500 py-1.5 px-3 rounded-xl text-[11px] font-medium transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Cerrar Sesión
          </button>
        </div>

      </aside>

      {/* 2. Main content container screen */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-[var(--bg-app)]">
        
        {/* Mobile top view navigation header block (Hidden on desktop) */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-[var(--bg-sidebar)] border-b !border-[var(--border-subtle)] relative z-30">
          
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-500 text-slate-950 rounded-lg font-bold">
              <Building2 className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-[var(--text-main)] block">Rancho Modesta</span>
              <span className="text-[9px] text-[var(--text-mute)] uppercase tracking-widest font-mono">Gestión Familiar</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick theme toggler for mobile header */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg border !border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-main)] cursor-pointer"
              aria-label="Cambiar tema"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg border !border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-main)] cursor-pointer"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>

        </header>

        {/* Mobile menu drop bar */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-[57px] inset-x-0 bg-[var(--bg-sidebar)] border-b !border-[var(--border-subtle)] p-4 space-y-4 z-20 shadow-2xl animate-in slide-in-from-top-4 duration-150">
            
            <div className="grid grid-cols-1 gap-1">
              {permittedNavItems.map((item) => {
                const isActive = activeTab === item.id;
                const IconComp = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all text-left ${
                      isActive
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-slate-500/5'
                    }`}
                  >
                    <IconComp className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Sync Status Banner */}
            <div className="text-[10px] font-mono text-[var(--text-mute)] bg-[var(--bg-darker)] p-2 rounded-lg border !border-[var(--border-subtle)] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Firebase Realtime Activo
              </span>
              <span>LIVE</span>
            </div>

            <div className="pt-3 border-t !border-[var(--border-subtle)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">{currentUser.avatar}</span>
                <span className="text-[11px] font-bold text-[var(--text-secondary)]">{currentUser.fullName}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded cursor-pointer"
              >
                Cerrar Sesión
              </button>
            </div>

          </div>
        )}

        {/* Secondary scrollable main canvas layer */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          
          <div className="bg-[var(--bg-panel)] rounded-2xl border !border-[var(--border-subtle)] shadow-[var(--shadow-subtle)] p-1">
            {activeTab === 'dashboard' && (
              <DashboardView
                production={production}
                expenses={expenses}
                properties={properties}
                currentUser={currentUser}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'produccion' && (
              <ProductionView
                production={production}
                onAddProduction={handleAddProduction}
                onDeleteProduction={handleDeleteProduction}
                currentUser={currentUser}
                configItems={configItems}
                triggerNotification={triggerNotification}
                onAddConfigItem={handleAddConfigItem}
              />
            )}

            {activeTab === 'gastos' && showFinances && (
              <ExpensesView
                expenses={expenses}
                properties={properties}
                onAddExpense={handleAddExpense}
                onAddSplit={handleAddSplit}
                onDeleteExpense={handleDeleteExpense}
                onDeleteSplit={handleDeleteSplit}
                onToggleSplitPaid={handleToggleSplitPaid}
                currentUser={currentUser}
                configItems={configItems}
                splitRecords={splitRecords}
                triggerNotification={triggerNotification}
                onAddConfigItem={handleAddConfigItem}
              />
            )}

            {activeTab === 'propiedades' && showFinances && (
              <PropertiesView
                properties={properties}
                expenses={expenses}
                onAddProperty={handleAddProperty}
                onUpdateProperty={handleUpdateProperty}
                onDeleteProperty={handleDeleteProperty}
                currentUser={currentUser}
                triggerNotification={triggerNotification}
              />
            )}

            {activeTab === 'reportes' && showFinances && (
              <ReportsView
                production={production}
                expenses={expenses}
                properties={properties}
                currentUser={currentUser}
              />
            )}

            {activeTab === 'historial' && (
              <HistoryView
                auditLogs={auditLogs}
                currentUser={currentUser}
                onClearLogs={handleClearLogs}
              />
            )}

            {activeTab === 'configuracion' && showFinances && (
              <ConfigView
                configItems={configItems}
                onAddConfigItem={handleAddConfigItem}
                onDeleteConfigItem={handleDeleteConfigItem}
                onResetToDefault={handleResetToDefault}
                currentUser={currentUser}
                users={users}
                onAddUser={handleAddUser}
                onDeleteUser={handleDeleteUser}
              />
            )}
          </div>

        </main>

      </div>

      {/* Floating Gorgeous Notifications Toaster Portal */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => {
          let styleClasses = 'bg-slate-900 border-slate-800 text-slate-100';
          let iconVal = '🌟';
          if (toast.type === 'success') {
            styleClasses = 'bg-[#0a1e14] border-emerald-500/30 text-white shadow-lg shadow-emerald-500/5';
            iconVal = '🟢';
          } else if (toast.type === 'error') {
            styleClasses = 'bg-[#250d11] border-red-500/30 text-white shadow-lg shadow-red-500/5';
            iconVal = '🔴';
          } else {
            styleClasses = 'bg-[#0d1627] border-blue-500/30 text-white shadow-lg shadow-blue-500/5';
            iconVal = '🔵';
          }
          return (
            <div
              key={toast.id}
              className={`p-4 rounded-xl border ${styleClasses} flex gap-3 items-start pointer-events-auto shadow-2xl animate-in slide-in-from-right-5 duration-200`}
            >
              <span className="text-xs mt-0.5 shrink-0 block">{iconVal}</span>
              <div className="flex-1">
                <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-widest font-mono">Rancho Modesta Informa:</span>
                <p className="text-xs text-slate-100 font-semibold mt-1 leading-normal">{toast.message}</p>
              </div>
              <button
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-slate-400 hover:text-white text-[10px] font-mono select-none px-1 rounded border border-transparent hover:border-slate-800 bg-slate-900/45 cursor-pointer shrink-0"
              >
                X
              </button>
            </div>
          );
        })}
      </div>

    </div>
  );
}
