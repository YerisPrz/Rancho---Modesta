import { useState } from 'react';
import { AuditLog, User } from '../types';
import { History, Trash2 } from 'lucide-react';

interface HistoryViewProps {
  auditLogs: AuditLog[];
  currentUser: User;
  onClearLogs: () => Promise<void>;
}

export function HistoryView({
  auditLogs,
  currentUser,
  onClearLogs
}: HistoryViewProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Determine financial reporting access (same logic as app-wide)
  const showFinances =
    currentUser.role === 'Admin' ||
    (currentUser.role === 'Miembro' && currentUser.username.toLowerCase() === 'maria');

  // Filter logs for workers/guests to exclude sensitive financial events (Gastos, Propiedades, split)
  const privacyFilteredLogs = showFinances
    ? auditLogs
    : auditLogs.filter(log => {
        const actionLower = log.action.toLowerCase();
        const detailsLower = log.details.toLowerCase();
        
        return (
          !actionLower.includes('gasto') &&
          !actionLower.includes('egreso') &&
          !actionLower.includes('dividido') &&
          !actionLower.includes('propiedad') &&
          !actionLower.includes('cobrada') &&
          !actionLower.includes('alquiler') &&
          !actionLower.includes('renta') &&
          !detailsLower.includes('rd$') &&
          !detailsLower.includes('gasto') &&
          !detailsLower.includes('egreso') &&
          !detailsLower.includes('monto') &&
          !detailsLower.includes('costo') &&
          !detailsLower.includes('pago') &&
          !detailsLower.includes('propiedad')
        );
      });

  // Apply search term
  const finalLogsList = searchTerm.trim() === ''
    ? privacyFilteredLogs
    : privacyFilteredLogs.filter(log =>
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase())
      );

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-in fade-in duration-200">
      
      {/* Header section with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-5.5 h-5.5 text-indigo-500 dark:text-indigo-400" />
            Bitácora de Auditoría Familiar
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Historial de eventos relevantes en Rancho Modesta para la máxima transparencia familiar.
          </p>
        </div>
        
        {auditLogs.length > 0 && currentUser.role === 'Admin' && (
          <button
            onClick={() => {
              onClearLogs();
            }}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-950 text-slate-700 dark:text-slate-400 hover:text-red-650 dark:hover:text-red-500 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors self-start sm:self-center cursor-pointer shadow-sm"
            id="clear-logs-btn"
          >
            <Trash2 className="w-4 h-4" />
            Limpiar Historial
          </button>
        )}
      </div>

      {/* Filter and Search controls */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Buscar registros en la bitácora..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 focus:border-indigo-500 outline-none hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm"
        />
      </div>

      {/* Logs timeline layout representation */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        
        {finalLogsList.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">No se encontraron registros de auditoría visibles en este acceso.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
            {finalLogsList.map((log) => {
              // Color tags categories
              let tagColor = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800';
              if (log.action.includes('Iniciada')) {
                tagColor = 'bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/10';
              } else if (log.action.includes('Cosecha') || log.action.includes('Cargada')) {
                tagColor = 'bg-blue-500/5 text-blue-600 dark:text-blue-400 border-blue-500/10';
              } else if (log.action.includes('Gasto') || log.action.includes('Dividido')) {
                tagColor = 'bg-rose-500/5 text-rose-600 dark:text-rose-400 border-rose-500/10';
              } else if (log.action.includes('Propiedad') || log.action.includes('Cobrada')) {
                tagColor = 'bg-amber-500/5 text-amber-600 dark:text-amber-400 border-amber-500/10';
              }

              return (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                       <span className="font-mono text-[9px] text-slate-500 dark:text-slate-450">{log.timestamp}</span>
                       <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">• por <strong className="text-slate-800 dark:text-slate-300">{log.username}</strong> ({log.role})</span>
                    </div>

                    <p className="text-slate-800 dark:text-slate-100 font-medium leading-relaxed">{log.details}</p>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 border rounded-lg whitespace-nowrap self-start sm:self-center ${tagColor}`}>
                    {log.action}
                  </span>
                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
}
