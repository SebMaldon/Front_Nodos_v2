import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, AlertOctagon, AlertTriangle, Info, X } from 'lucide-react';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Aceptar',
    cancelText: 'Cancelar',
    isDestructive: false,
    resolve: null,
  });

  // Unique ID generator
  const toastIdRef = useRef(0);

  // 1. Toast alerts functions
  const alertCustom = useCallback((message, type = 'info', title = '', duration = 5000) => {
    const id = ++toastIdRef.current;
    
    // Auto-detect default titles if empty
    let finalTitle = title;
    if (!finalTitle) {
      if (type === 'success') finalTitle = 'Éxito';
      else if (type === 'error') finalTitle = 'Error';
      else if (type === 'warning') finalTitle = 'Advertencia';
      else finalTitle = 'Información';
    }

    setToasts((prev) => [...prev, { id, message, type, title: finalTitle, duration }]);
    
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const success = useCallback((message, title = '') => alertCustom(message, 'success', title), [alertCustom]);
  const error = useCallback((message, title = '') => alertCustom(message, 'error', title), [alertCustom]);
  const warn = useCallback((message, title = '') => alertCustom(message, 'warning', title), [alertCustom]);
  const info = useCallback((message, title = '') => alertCustom(message, 'info', title), [alertCustom]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // 2. Custom confirm function
  const confirmCustom = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      // Auto-detect if it's destructive based on common words
      const lowerMsg = message.toLowerCase();
      const defaultDestructive = lowerMsg.includes('eliminar') || 
                                 lowerMsg.includes('quitar') || 
                                 lowerMsg.includes('borrar') || 
                                 lowerMsg.includes('baja');

      const isDestructive = options.isDestructive ?? defaultDestructive;
      const title = options.title || (isDestructive ? 'Confirmar Eliminación' : 'Confirmar Acción');
      const confirmText = options.confirmText || (isDestructive ? 'Eliminar' : 'Confirmar');
      const cancelText = options.cancelText || 'Cancelar';

      setConfirmState({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        isDestructive,
        resolve,
      });
    });
  }, []);

  const handleConfirmAction = () => {
    if (confirmState.resolve) confirmState.resolve(true);
    setConfirmState((prev) => ({ ...prev, isOpen: false, resolve: null }));
  };

  const handleCancelAction = () => {
    if (confirmState.resolve) confirmState.resolve(false);
    setConfirmState((prev) => ({ ...prev, isOpen: false, resolve: null }));
  };

  return (
    <NotificationContext.Provider value={{
      alert: alertCustom,
      success,
      error,
      warn,
      info,
      confirm: confirmCustom
    }}>
      {children}

      {/* Global Toast Container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        {toasts.map((toast) => {
          let typeClasses = '';
          let IconComponent = Info;
          
          if (toast.type === 'success') {
            typeClasses = 'border-l-emerald-500 text-slate-800 bg-white border-l-4 shadow-xl';
            IconComponent = CheckCircle2;
          } else if (toast.type === 'error') {
            typeClasses = 'border-l-rose-500 text-slate-800 bg-white border-l-4 shadow-xl';
            IconComponent = AlertOctagon;
          } else if (toast.type === 'warning') {
            typeClasses = 'border-l-amber-500 text-slate-800 bg-white border-l-4 shadow-xl';
            IconComponent = AlertTriangle;
          } else {
            typeClasses = 'border-l-blue-500 text-slate-800 bg-white border-l-4 shadow-xl';
            IconComponent = Info;
          }

          return (
            <div
              key={toast.id}
              className={`flex items-start gap-3 p-4 rounded-lg bg-white shadow-2xl border border-slate-100 pointer-events-auto transition-all duration-300 transform translate-x-0 animate-[fadeIn_0.2s_ease-out] relative overflow-hidden ${typeClasses}`}
              style={{
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div className="flex-shrink-0 mt-0.5">
                {toast.type === 'success' && <IconComponent className="h-5 w-5 text-emerald-500" />}
                {toast.type === 'error' && <IconComponent className="h-5 w-5 text-rose-500" />}
                {toast.type === 'warning' && <IconComponent className="h-5 w-5 text-amber-500" />}
                {toast.type === 'info' && <IconComponent className="h-5 w-5 text-blue-500" />}
              </div>
              
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-sm font-semibold text-slate-800 leading-tight">
                  {toast.title}
                </p>
                <p className="text-xs text-slate-500 mt-1 font-medium whitespace-pre-line leading-relaxed">
                  {toast.message}
                </p>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 text-slate-400 hover:text-slate-600 rounded transition-colors focus:outline-none"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Progress bar line */}
              {toast.duration > 0 && (
                <div 
                  className={`absolute bottom-0 left-0 h-1 transition-all ease-linear ${
                    toast.type === 'success' ? 'bg-emerald-500' :
                    toast.type === 'error' ? 'bg-rose-500' :
                    toast.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                  }`}
                  style={{
                    animation: `shrinkWidth ${toast.duration}ms linear forwards`,
                    width: '100%'
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Global Custom Confirm Modal */}
      {confirmState.isOpen && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ease-out"
            onClick={handleCancelAction}
          />
          
          {/* Modal Container */}
          <div 
            className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden p-6 mx-auto z-10 transform scale-100 transition-all duration-300 ease-out animate-[fadeIn_0.2s_ease-out] flex flex-col items-center text-center"
            style={{
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
          >
            {/* Top decorative Icon */}
            <div className={`p-4 rounded-full mb-4 ${
              confirmState.isDestructive ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
            }`}>
              {confirmState.isDestructive ? (
                <AlertTriangle className="h-10 w-10 animate-pulse" />
              ) : (
                <CheckCircle2 className="h-10 w-10 text-[#006341]" />
              )}
            </div>

            {/* Content */}
            <h3 className="text-xl font-bold text-slate-800 tracking-tight">
              {confirmState.title}
            </h3>
            
            <p className="text-sm text-slate-500 mt-2 whitespace-pre-line leading-relaxed max-w-sm">
              {confirmState.message}
            </p>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-3 mt-6 w-full">
              <button
                type="button"
                onClick={handleCancelAction}
                className="flex-1 py-2.5 px-4 text-sm font-semibold rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 transition-colors shadow-sm focus:outline-none"
              >
                {confirmState.cancelText}
              </button>
              
              <button
                type="button"
                onClick={handleConfirmAction}
                className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-xl text-white shadow-sm focus:outline-none transition-all active:scale-[0.98] ${
                  confirmState.isDestructive 
                    ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-rose-200/50' 
                    : 'bg-[#006341] hover:bg-[#004d32] active:bg-[#003824] shadow-emerald-200/50'
                }`}
              >
                {confirmState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animation injection */}
      <style>{`
        @keyframes shrinkWidth {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
