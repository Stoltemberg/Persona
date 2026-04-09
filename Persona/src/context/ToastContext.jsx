import { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { FeedbackCardStack } from '../components/FeedbackCardStack';

const ToastContext = createContext();

export function ToastProvider({ children }) {
    const [notices, setNotices] = useState([]);
    const noticeTimers = useRef(new Map());

    useEffect(() => () => {
        noticeTimers.current.forEach((timer) => clearTimeout(timer));
        noticeTimers.current.clear();
    }, []);

    const removeNotice = useCallback((id) => {
        const timer = noticeTimers.current.get(id);
        if (timer) {
            clearTimeout(timer);
            noticeTimers.current.delete(id);
        }
        setNotices((prev) => prev.filter((item) => item.id !== id));
    }, []);

    const addCardNotice = useCallback((notice) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const duration = notice.duration ?? 5000;
        const nextNotice = { ...notice, id };

        setNotices((prev) => [nextNotice, ...prev].slice(0, 4));

        if (duration > 0) {
            const timer = setTimeout(() => {
                removeNotice(id);
            }, duration);
            noticeTimers.current.set(id, timer);
        }

        return id;
    }, [removeNotice]);

    // Adapter to match existing API: addToast(message, type)
    const addToast = useCallback((message, type = 'success') => {
        if (type === 'success') {
            addCardNotice({
                type: 'success',
                title: message,
                duration: 4200,
            });
        } else if (type === 'info') {
            addCardNotice({
                type: 'info',
                title: message,
                duration: 4200,
            });
        } else if (type === 'error') {
            toast.error(message);
        } else {
            toast(message);
        }
    }, [addCardNotice]);

    const addActionToast = useCallback((message, actionLabel, onAction, type = 'default') => {
        addCardNotice({
            type: type === 'default' ? 'info' : type,
            title: message,
            actionLabel,
            onAction,
            duration: 6000,
        });
    }, [addCardNotice]);

    const addConfirmationCard = useCallback((title, message, type = 'success') => {
        addCardNotice({
            type,
            title,
            message,
            duration: 4200,
        });
    }, [addCardNotice]);

    const value = useMemo(() => ({
        addToast,
        addActionToast,
        addCardNotice,
        addConfirmationCard,
    }), [addToast, addActionToast, addCardNotice, addConfirmationCard]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <FeedbackCardStack notices={notices} onDismiss={removeNotice} />
        </ToastContext.Provider>
    );
}

export const useToast = () => useContext(ToastContext);
