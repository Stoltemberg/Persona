import { createContext, useContext, useCallback } from 'react';
import { toast } from 'sonner';

const ToastContext = createContext();

export function ToastProvider({ children }) {

    // Adapter to match existing API: addToast(message, type)
    const addToast = useCallback((message, type = 'success') => {
        if (type === 'success') {
            toast.success(message);
        } else if (type === 'error') {
            toast.error(message);
        } else if (type === 'info') {
            toast.info(message);
        } else {
            toast(message);
        }
    }, []);

    const addActionToast = useCallback((message, actionLabel, onAction, type = 'default') => {
        const method = type === 'success'
            ? toast.success
            : type === 'error'
                ? toast.error
                : type === 'info'
                    ? toast.info
                    : toast;

        method(message, {
            action: {
                label: actionLabel,
                onClick: onAction,
            },
        });
    }, []);

    return (
        <ToastContext.Provider value={{ addToast, addActionToast }}>
            {children}
            {/* Toaster is now in main.jsx, or we can put it here if main.jsx fails */}
        </ToastContext.Provider>
    );
}

export const useToast = () => useContext(ToastContext);
