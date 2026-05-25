import { useState, FormEvent } from 'react';
import { User } from '../types';
import { Building2, User as UserIcon, Lock, Sparkles, LogIn, AlertCircle } from 'lucide-react';

interface LoginScreenProps {
  users: User[];
  onLoginSuccess: (user: User) => void;
}

export function LoginScreen({ users, onLoginSuccess }: LoginScreenProps) {
  const [role, setRole] = useState<'Admin' | 'Miembro' | 'Invitado'>('Admin');
  const [username, setUsername] = useState('Milton');
  const [password, setPassword] = useState('Mil210375');
  const [error, setError] = useState('');

  const handleAutocomplete = (user: User, pass: string) => {
    setUsername(user.username);
    setPassword(pass);
    setRole(user.role);
    setError('');
    
    // Auto-login on double-click or single tap for convenience
    const matchedUser = users.find(u => u.username === user.username);
    if (matchedUser) {
      onLoginSuccess(matchedUser);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const matchedUser = users.find(
      u => u.username.toLowerCase() === username.trim().toLowerCase()
    );

    if (!matchedUser) {
      setError('El usuario no existe en la base de datos familiar.');
      return;
    }

    // Verify username + simple password match
    const isCorrect = 
      (matchedUser.username === 'Milton' && password === 'Mil210375') ||
      (matchedUser.username === 'Yeris' && password === 'Perez032313') ||
      (matchedUser.username === 'Willer' && password === 'Willer24') ||
      (password === '1234'); // Fallback demo password

    if (isCorrect) {
      onLoginSuccess(matchedUser);
    } else {
      setError('Contraseña de acceso incorrecta para este perfil.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-950 font-sans text-slate-100 relative overflow-hidden" id="login-container">
      {/* Decorative background lights */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full filter blur-3xl -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/10 rounded-full filter blur-3xl -z-10" />

      {/* Header section with brand and crest */}
      <div className="flex flex-col items-center text-center space-y-3 mb-8" id="login-header">
        <div className="p-3.5 bg-emerald-500 text-slate-950 rounded-2xl shadow-xl shadow-emerald-500/10 flex items-center justify-center border border-emerald-400" id="login-logo-badge">
          <Building2 className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-0.5" id="login-app-title">Rancho Modesta</h1>
          <p className="text-[10px] sm:text-xs text-slate-400 font-bold tracking-widest uppercase" id="login-app-subtitle">
            SISTEMA DE ADMINISTRACIÓN PRIVADO • PÉREZ FAMILY
          </p>
        </div>
      </div>

      {/* Primary Card */}
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-md rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-2xl relative" id="login-form-card">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2" id="login-card-title">
            <span>Ingreso Privado</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1" id="login-card-desc">
            Selecciona tu rol y escribe tus credenciales de la familia.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" id="login-form">
          {/* Role selector */}
          <div className="space-y-2" id="role-selector-container">
            <label className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase font-mono">
              ROL DEL MIEMBRO
            </label>
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800" id="role-selector">
              <button
                type="button"
                onClick={() => setRole('Admin')}
                className={`py-2 px-1 text-center rounded-xl text-xs font-semibold transition-all duration-150 ${
                  role === 'Admin'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/10'
                    : 'text-slate-400 hover:text-white'
                }`}
                id="role-btn-admin"
              >
                Padre (Admin)
              </button>
              <button
                type="button"
                onClick={() => setRole('Miembro')}
                className={`py-2 px-1 text-center rounded-xl text-xs font-semibold transition-all duration-150 ${
                  role === 'Miembro'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/10'
                    : 'text-slate-400 hover:text-white'
                }`}
                id="role-btn-miembro"
              >
                Familia
              </button>
              <button
                type="button"
                onClick={() => setRole('Invitado')}
                className={`py-2 px-1 text-center rounded-xl text-xs font-semibold transition-all duration-150 ${
                  role === 'Invitado'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/10'
                    : 'text-slate-400 hover:text-white'
                }`}
                id="role-btn-empleado"
              >
                Empleado
              </button>
            </div>
          </div>

          {/* Username Input */}
          <div className="space-y-2" id="username-input-container">
            <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono block">
              NOMBRE DE USUARIO
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                <UserIcon className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Escribe tu usuario (ej. rafael)"
                className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-white transition-all font-mono"
                required
                id="login-username-input"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2" id="password-input-container">
            <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono block">
              CONTRASEÑA DE ACCESO
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-white transition-all font-mono"
                required
                id="login-password-input"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/25 rounded-2xl p-3 text-xs text-red-400 flex items-center gap-2" id="login-error-msg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 text-sm shadow-xl shadow-emerald-500/5 cursor-pointer"
            id="login-submit-btn"
          >
            <LogIn className="w-4' h-4" />
            <span>Iniciar Sesión Seguro</span>
          </button>
        </form>

        {/* Separator */}
        <div className="relative my-6" id="login-divider">
          <div className="absolute inset-0 flex items-center">
            <hr className="w-full border-slate-800" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-mono">
            <span className="bg-slate-900 px-3 text-slate-500 font-bold">Autocompletar Acceso</span>
          </div>
        </div>

        {/* Helper suggestions with clickable triggers */}
        <div className="space-y-2.5" id="autocomplete-suggestions">
          <p className="text-[10px] text-slate-500 font-mono tracking-wider text-center uppercase">
            ⚡ ACCESO DE RANCHO MODESTA (CLICK PARA ENTRAR AL INSTANTE)
          </p>
          <div className="space-y-2" id="login-quick-access-list">
            
            {/* Milton */}
            <button
              onClick={() => handleAutocomplete({ id: 'u-1', username: 'Milton', fullName: 'Milton Pérez (Padre)', role: 'Admin', avatar: '👨‍🌾' }, 'Mil210375')}
              className="w-full p-2.5 bg-slate-950/50 hover:bg-slate-950 text-left border border-slate-850 hover:border-emerald-500/30 rounded-xl transition-all flex items-center justify-between group"
              id="quick-access-milton"
              type="button"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">👨‍🌾</span>
                <div className="leading-tight">
                  <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">Milton Pérez <span className="text-[10px] text-slate-500 font-normal">(Padre)</span></p>
                  <p className="text-[10px] text-slate-400 font-mono">user: milton · pass: Mil210375</p>
                </div>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 font-mono font-bold tracking-wider">ADMIN</span>
            </button>

            {/* Yeris */}
            <button
              onClick={() => handleAutocomplete({ id: 'u-2', username: 'Yeris', fullName: 'Yeris Pérez (Hijo - Finanzas)', role: 'Miembro', avatar: '👩‍🌾' }, 'Perez032313')}
              className="w-full p-2.5 bg-slate-950/50 hover:bg-slate-950 text-left border border-slate-850 hover:border-blue-500/30 rounded-xl transition-all flex items-center justify-between group"
              id="quick-access-yeris"
              type="button"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">👩‍🌾</span>
                <div className="leading-tight">
                  <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">Yeris Pérez <span className="text-[10px] text-slate-500 font-normal">(Finanzas)</span></p>
                  <p className="text-[10px] text-slate-400 font-mono">user: Yeris · pass: Perez032313</p>
                </div>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/15 font-mono font-bold tracking-wider">FAMILIAR</span>
            </button>

            {/* Willer */}
            <button
              onClick={() => handleAutocomplete({ id: 'u-3', username: 'Willer', fullName: 'Willer Pérez (Supervisor Conucos)', role: 'Miembro', avatar: '👨‍🔧' }, 'Willer24')}
              className="w-full p-2.5 bg-slate-950/50 hover:bg-slate-950 text-left border border-slate-850 hover:border-amber-500/30 rounded-xl transition-all flex items-center justify-between group"
              id="quick-access-willer"
              type="button"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">👨‍🔧</span>
                <div className="leading-tight">
                  <p className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">Willer Pérez <span className="text-[10px] text-slate-500 font-normal">(Conucos)</span></p>
                  <p className="text-[10px] text-slate-400 font-mono">user: Willer · pass: Willer24</p>
                </div>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/15 font-mono font-bold tracking-wider">EMPLEADO</span>
            </button>

          </div>
        </div>

      </div>
    </div>
  );
}
