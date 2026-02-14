import { useState } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
    addMonths,
    subMonths,
    isSameMonth,
    isSameDay,
    isWithinInterval
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export function Calendar({ startDate, endDate, onChange }) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [direction, setDirection] = useState(0);

    const onDateClick = (day) => {
        if (!startDate || (startDate && endDate) || day < startDate) {
            // Start new range (clears old range or starts fresh)
            onChange({ start: day, end: null });
        } else {
            // Complete range
            onChange({ start: startDate, end: day });
        }
    };

    const nextMonth = () => {
        setDirection(1);
        setCurrentMonth(addMonths(currentMonth, 1));
    };

    const prevMonth = () => {
        setDirection(-1);
        setCurrentMonth(subMonths(currentMonth, 1));
    };

    const renderHeader = () => {
        return (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <Button onClick={prevMonth} variant="ghost" style={{ padding: '0.4rem' }}>
                    <ChevronLeft size={20} />
                </Button>
                <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                    {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                </div>
                <Button onClick={nextMonth} variant="ghost" style={{ padding: '0.4rem' }}>
                    <ChevronRight size={20} />
                </Button>
            </div>
        );
    };

    const renderDays = () => {
        const days = [];
        const date = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

        for (let i = 0; i < 7; i++) {
            days.push(
                <div key={i} style={{
                    textAlign: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    paddingBottom: '0.5rem'
                }}>
                    {date[i]}
                </div>
            );
        }
        return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '0.5rem' }}>{days}</div>;
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDateGrid = startOfWeek(monthStart);
        const endDateGrid = endOfWeek(monthEnd);

        const rows = [];
        let days = [];
        let day = startDateGrid;
        let formattedDate = '';

        while (day <= endDateGrid) {
            for (let i = 0; i < 7; i++) {
                formattedDate = format(day, 'd');
                const cloneDay = day;

                const isSelected = (startDate && isSameDay(day, startDate)) || (endDate && isSameDay(day, endDate));
                const isInRange = startDate && endDate && isWithinInterval(day, { start: startDate, end: endDate });
                const isCurrentMonth = isSameMonth(day, monthStart);

                days.push(
                    <div
                        key={day}
                        onClick={() => onDateClick(cloneDay)}
                        style={{
                            position: 'relative',
                            height: '2.5rem', // Fixed square size
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            borderRadius: '50%', // Circle shape for selection
                            background: isSelected ? 'var(--color-blue)' : (isInRange ? 'rgba(0, 122, 255, 0.15)' : 'transparent'),
                            color: isSelected ? 'white' : (isCurrentMonth ? 'var(--text-main)' : 'var(--text-muted)'),
                            opacity: isCurrentMonth ? 1 : 0.3,
                            fontWeight: isSelected ? 600 : 400,
                            border: isSameDay(day, new Date()) && !isSelected ? '1px solid var(--color-blue)' : 'none',
                        }}
                    >
                        {/* Connecting strip for range */}
                        {isInRange && !isSelected && (
                            <div style={{
                                position: 'absolute',
                                top: 4,
                                bottom: 4,
                                left: 0,
                                right: 0,
                                background: 'rgba(79, 41, 240, 0.1)',
                                zIndex: -1,
                                // Logic to remove rounded corners for middle items would go here but this is a simple mvp
                            }} />
                        )}
                        {formattedDate}
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div key={day} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: '0.2rem' }}>
                    {days}
                </div>
            );
            days = [];
        }
        return rows;
    };

    const variants = {
        enter: (direction) => ({
            x: direction > 0 ? 50 : -50,
            opacity: 0
        }),
        center: {
            x: 0,
            opacity: 1
        },
        exit: (direction) => ({
            x: direction > 0 ? -50 : 50,
            opacity: 0
        })
    };

    return (
        <div style={{ width: '100%', maxWidth: '300px', padding: '0.5rem' }}>
            {renderHeader()}
            {renderDays()}
            <div style={{ overflow: 'hidden', minHeight: '220px' }}>
                <AnimatePresence mode='popLayout' custom={direction}>
                    <motion.div
                        key={currentMonth.toString()}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.2 }}
                    >
                        {renderCells()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
