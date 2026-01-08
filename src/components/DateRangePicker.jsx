import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar } from './Calendar';
import { Button } from './Button';

export function DateRangePicker({ startDate, endDate, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDateChange = (range) => {
        onChange(range);
        // Auto close if both dates selected (optional, maybe better not to for UX)
        // if (range.start && range.end) setIsOpen(false);
    };

    const displayText = () => {
        if (!startDate && !endDate) return 'Todas as datas';
        if (startDate && !endDate) return `${format(startDate, 'dd/MM/yyyy')} - ...`;
        if (startDate && endDate) return `${format(startDate, 'dd/MM', { locale: ptBR })} - ${format(endDate, 'dd/MM', { locale: ptBR })}`;
        return 'Selecionar Datas';
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange({ start: null, end: null });
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} style={{ position: 'relative' }}>
            {/* Trigger Button (Glass Pill) */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="glass-panel"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '20px', // Pill shape
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    background: isOpen ? 'rgba(255,255,255,0.1)' : 'transparent',
                    border: '1px solid rgba(255,255,255,0.1)',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                }}
            >
                <CalendarIcon size={14} color="var(--text-muted)" />
                <span style={{ color: (startDate || endDate) ? 'var(--text-main)' : 'var(--text-muted)' }}>
                    {displayText()}
                </span>
                {(startDate || endDate) && (
                    <div
                        onClick={handleClear}
                        style={{
                            marginLeft: '0.2rem',
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            opacity: 0.7
                        }}
                    >
                        <X size={14} />
                    </div>
                )}
            </div>

            {/* Dropdown Content */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="glass-card"
                        style={{
                            position: 'absolute',
                            top: '120%',
                            right: 0,
                            zIndex: 101, // Higher than sidebar (usually 100) or mobile overlays
                            padding: '1rem',
                            minWidth: '300px',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                        }}
                    >
                        <Calendar
                            startDate={startDate}
                            endDate={endDate}
                            onChange={handleDateChange}
                        />

                        {/* Quick Actions Footer */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginTop: '1rem',
                            paddingTop: '0.8rem',
                            borderTop: '1px solid var(--glass-border)'
                        }}>
                            <Button
                                variant="ghost"
                                style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                                onClick={() => {
                                    const now = new Date();
                                    const start = new Date(now.getFullYear(), now.getMonth(), 1);
                                    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of month
                                    end.setHours(23, 59, 59, 999);
                                    onChange({ start, end });
                                    setIsOpen(false);
                                }}
                            >
                                Este Mês
                            </Button>
                            <Button
                                className="btn-primary"
                                style={{ fontSize: '0.75rem', padding: '0.3rem 0.8rem' }}
                                onClick={() => setIsOpen(false)}
                            >
                                Aplicar
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
