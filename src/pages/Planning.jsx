import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { PieChart, Target, Wallet, TrendingUp } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';

const Analysis = lazy(() => import('./Analysis'));
const Goals = lazy(() => import('./Goals'));
const Budgets = lazy(() => import('./Budgets'));
const Simulator = lazy(() => import('./Simulator'));

const VALID_TABS = ['analysis', 'goals', 'budgets', 'simulator'];

const TAB_CONFIG = {
    analysis: {
        label: 'Analise',
        subtitle: 'Entenda seu ritmo de gastos e o resultado do mes.',
        icon: PieChart,
    },
    goals: {
        label: 'Metas',
        subtitle: 'Acompanhe o que esta em foco e onde vale acelerar.',
        icon: Target,
    },
    budgets: {
        label: 'Orcamentos',
        subtitle: 'Defina limites claros para nao perder o controle.',
        icon: Wallet,
    },
    simulator: {
        label: 'Simulador',
        subtitle: 'Projete cenarios e enxergue o impacto da consistencia.',
        icon: TrendingUp,
    },
};

const pageVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.35,
            ease: [0.22, 1, 0.36, 1],
            staggerChildren: 0.06,
            delayChildren: 0.04,
        },
    },
};

export default function Planning() {
    const [searchParams, setSearchParams] = useSearchParams();
    const reducedMotion = useReducedMotion();
    const requestedTab = searchParams.get('tab');
    const activeTab = VALID_TABS.includes(requestedTab) ? requestedTab : 'analysis';
    const activeConfig = TAB_CONFIG[activeTab];
    const previousTabRef = useRef(activeTab);
    const [transitionDirection, setTransitionDirection] = useState(1);

    useEffect(() => {
        if (!VALID_TABS.includes(requestedTab)) {
            setSearchParams({ tab: 'analysis' }, { replace: true });
        }
    }, [requestedTab, setSearchParams]);

    useEffect(() => {
        const previousTab = previousTabRef.current;
        if (previousTab === activeTab) {
            return;
        }

        const previousIndex = VALID_TABS.indexOf(previousTab);
        const nextIndex = VALID_TABS.indexOf(activeTab);
        setTransitionDirection(nextIndex >= previousIndex ? 1 : -1);
        previousTabRef.current = activeTab;
    }, [activeTab]);

    const handleTabChange = (tab) => setSearchParams({ tab });

    const sectionVariants = {
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -10 },
    };

    const tabPanelVariants = {
        enter: (direction) => (
            reducedMotion
                ? { opacity: 0 }
                : { opacity: 0, x: direction > 0 ? 28 : -28, scale: 0.985, filter: 'blur(6px)' }
        ),
        center: {
            opacity: 1,
            x: 0,
            scale: 1,
            filter: 'blur(0px)',
        },
        exit: (direction) => (
            reducedMotion
                ? { opacity: 0 }
                : { opacity: 0, x: direction > 0 ? -20 : 20, scale: 0.992, filter: 'blur(4px)' }
        ),
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'analysis':
                return <Analysis isTab />;
            case 'goals':
                return <Goals isTab />;
            case 'budgets':
                return <Budgets isTab />;
            case 'simulator':
                return <Simulator isTab />;
            default:
                return <Analysis isTab />;
        }
    };

    return (
        <motion.div
            className="container app-page-shell"
            style={{ paddingBottom: '80px' }}
            variants={pageVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div variants={sectionVariants}>
                <PageHeader
                    title={<span>Planejamento <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Financeiro</span></span>}
                    subtitle={activeConfig.subtitle}
                />
            </motion.div>

            <motion.div className="glass-card planning-tabs" variants={sectionVariants}>
                {VALID_TABS.map((tab) => {
                    const { icon: Icon, label } = TAB_CONFIG[tab];
                    const isActive = activeTab === tab;

                    return (
                        <motion.button
                            key={tab}
                            type="button"
                            className={`planning-tab-button${isActive ? ' is-active' : ''}`}
                            onClick={() => handleTabChange(tab)}
                            whileHover={{ y: -1, scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                        >
                            {isActive && (
                                <motion.span
                                    layoutId="planning-tab-highlight"
                                    className="planning-tab-highlight"
                                    transition={{ type: 'spring', stiffness: 380, damping: 32, mass: 0.9 }}
                                />
                            )}
                            <Icon size={16} />
                            <span className="planning-tab-label">{label}</span>
                        </motion.button>
                    );
                })}
            </motion.div>

            <AnimatePresence mode="wait" initial={false} custom={transitionDirection}>
                <motion.div
                    key={activeTab}
                    className="planning-tab-panel"
                    custom={transitionDirection}
                    variants={tabPanelVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                        duration: reducedMotion ? 0.16 : 0.34,
                        ease: [0.22, 1, 0.36, 1],
                    }}
                >
                    <Suspense fallback={<div className="app-empty-inline">Carregando aba...</div>}>
                        {renderContent()}
                    </Suspense>
                </motion.div>
            </AnimatePresence>
        </motion.div>
    );
}
