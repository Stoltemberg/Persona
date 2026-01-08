import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar } from './Calendar';
import { Button } from './Button';

export function DateRangePicker({ startDate, endDate, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);
    const [coords, setCoords] = useState({ top: 0, left: 0, transform: 'none', width: 'auto' });

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Check if click is inside the container (trigger) OR inside the portal (dropdown)
            const dropdown = document.getElementById('date-range-dropdown');
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target) &&
                dropdown &&
                !dropdown.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('scroll', () => setIsOpen(false), true); // Close on scroll
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('scroll', () => setIsOpen(false), true);
        }
    }, []);

    // Calculate position
    useEffect(() => {
        if (isOpen && containerRef.current) {
            const updatePosition = () => {
                const rect = containerRef.current.getBoundingClientRect();
                const viewportWidth = window.innerWidth;
                const dropdownWidth = 330; // Estimated max width
                const gap = 8;
                const edgePadding = 10;

                // Center point of the trigger button
                const triggerCenter = rect.left + (rect.width / 2);

                // Initial Left position (centering the dropdown)
                let leftPos = triggerCenter - (dropdownWidth / 2);

                // Clamp logic: Ensure it doesn't cross left or right screen edges
                // 1. Fix Left Edge
                if (leftPos < edgePadding) {
                    leftPos = edgePadding;
                }

                // 2. Fix Right Edge
                if (leftPos + dropdownWidth > viewportWidth - edgePadding) {
                    leftPos = viewportWidth - dropdownWidth - edgePadding;
                }

                // Mobile Specific Overrides (Optional, mainly for vertical centering)
                // But this clamp logic usually works great for horizontal on mobile too if width is handled
                const isMobile = window.innerWidth < 768;

                if (isMobile) {
                    setCoords({
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 'auto'
                    });
                } else {
                    setCoords({
                        top: rect.bottom + gap,
                        left: leftPos,
                        transform: 'none',
                        width: 'auto'
                    });
                }
            };

            updatePosition();
            window.addEventListener('resize', updatePosition);
            return () => window.removeEventListener('resize', updatePosition);
        }
    }, [isOpen]);


    const handleDateChange = (range) => {
        onChange(range);
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

            {/* Dropdown Content via Portal */}
            {createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            id="date-range-dropdown"
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="glass-card"
                            style={{
                                position: 'fixed', // Keep fixed to avoid container overflow issues
                                top: coords.top,
                                left: coords.left,
                                transform: coords.transform,
                                zIndex: 9999,
                                padding: '1rem',
                                width: '330px', // Consistent width
                                maxWidth: '95vw', // Responsive safety
                                boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                                border: '1px solid var(--glass-border)'
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
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
