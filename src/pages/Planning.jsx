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

function PlanningBackdrop() {
    const reducedMotion = useReducedMotion();

    return (
        <div
            aria-hidden="true"
            style={{
                position: 'fixed',
                inset: 0,
                pointerEvents: 'none',
                overflow: 'hidden',
                zIndex: 0,
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                        'radial-gradient(circle at 15% 18%, rgba(212, 175, 55, 0.12), transparent 28%), radial-gradient(circle at 82% 12%, rgba(92, 132, 255, 0.10), transparent 24%), radial-gradient(circle at 55% 88%, rgba(255, 255, 255, 0.05), transparent 24%)',
                    opacity: 0.9,
                }}
            />
            <motion.div
                style={{
                    position: 'absolute',
                    top: '-10%',
                    left: '-6%',
                    width: '30vw',
                    height: '30vw',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(212, 175, 55, 0.16) 0%, rgba(212, 175, 55, 0.02) 66%, transparent 72%)',
                    filter: 'blur(12px)',
                }}
                animate={reducedMotion ? {} : { x: [0, 28, 0], y: [0, 18, 0], scale: [1, 1.07, 1] }}
                transition={reducedMotion ? {} : { duration: 18, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
                style={{
                    position: 'absolute',
                    right: '-10%',
                    top: '18%',
                    width: '26vw',
                    height: '26vw',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(92, 132, 255, 0.14) 0%, rgba(92, 132, 255, 0.02) 64%, transparent 72%)',
                    filter: 'blur(14px)',
                }}
                animate={reducedMotion ? {} : { x: [0, -22, 0], y: [0, 16, 0], scale: [1, 1.05, 1] }}
                transition={reducedMotion ? {} : { duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
            />
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage:
                        'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
                    backgroundSize: '72px 72px',
                    maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.75), transparent 86%)',
                    opacity: 0.18,
                }}
            />
        </div>
    );
}

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
            style={{ paddingBottom: '96px', position: 'relative', isolation: 'isolate' }}
            variants={pageVariants}
            initial="hidden"
            animate="visible"
        >
            <PlanningBackdrop />

            <motion.div variants={sectionVariants} style={{ position: 'relative', zIndex: 1 }}>
                <PageHeader
                    title={<span>Planejamento <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Financeiro</span></span>}
                    subtitle={activeConfig.subtitle}
                />
            </motion.div>

            <motion.section
                variants={sectionVariants}
                style={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1.1fr) minmax(260px, 0.9fr)',
                    gap: '1rem',
                    padding: '1.35rem',
                    borderRadius: '28px',
                    border: '1px solid var(--glass-border)',
                    background: 'linear-gradient(160deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 18px 50px rgba(0, 0, 0, 0.18)',
                }}
            >
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                    <span className="text-muted" style={{ letterSpacing: '0.18em', textTransform: 'uppercase', fontSize: '0.72rem' }}>
                        Visao geral
                    </span>
                    <strong style={{ fontSize: 'clamp(1.55rem, 2.5vw, 2.25rem)', lineHeight: 1.05 }}>
                        Planejamento em camadas, com a aba certa em foco.
                    </strong>
                    <p className="text-muted" style={{ margin: 0, maxWidth: '56ch' }}>
                        Uma leitura curta para orientar o olhar antes de abrir os detalhes de analise, metas, orcamentos ou simulacao.
                    </p>
                </div>

                <div
                    style={{
                        display: 'grid',
                        gap: '0.75rem',
                        alignContent: 'start',
                        padding: '1rem',
                        borderRadius: '22px',
                        background: 'rgba(0, 0, 0, 0.14)',
                        border: '1px solid rgba(255,255,255,0.08)',
                    }}
                >
                    <span className="text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.16em', fontSize: '0.7rem' }}>
                        Aba ativa
                    </span>
                    <strong style={{ fontSize: '1.2rem' }}>{activeConfig.label}</strong>
                    <p className="text-muted" style={{ margin: 0, lineHeight: 1.6 }}>
                        {activeConfig.subtitle}
                    </p>
                </div>
            </motion.section>

            <motion.div
                className="planning-tabs"
                variants={sectionVariants}
                style={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    borderRadius: '24px',
                    border: '1px solid var(--glass-border)',
                    background: 'rgba(255,255,255,0.03)',
                    backdropFilter: 'blur(14px)',
                }}
            >
                {VALID_TABS.map((tab) => {
                    const { icon: Icon, label, subtitle } = TAB_CONFIG[tab];
                    const isActive = activeTab === tab;

                    return (
                        <motion.button
                            key={tab}
                            type="button"
                            className={`planning-tab-button${isActive ? ' is-active' : ''}`}
                            onClick={() => handleTabChange(tab)}
                            whileHover={{ y: -2, scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                            style={{
                                minHeight: '108px',
                                display: 'grid',
                                gap: '0.35rem',
                                justifyItems: 'start',
                                alignContent: 'space-between',
                                padding: '1rem',
                                borderRadius: '18px',
                                border: '1px solid transparent',
                                background: isActive ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.04)',
                                color: 'var(--text-main)',
                                textAlign: 'left',
                            }}
                        >
                            {isActive && (
                                <motion.span
                                    layoutId="planning-tab-highlight"
                                    className="planning-tab-highlight"
                                    transition={{ type: 'spring', stiffness: 380, damping: 32, mass: 0.9 }}
                                />
                            )}
                            <Icon size={16} />
                            <span className="planning-tab-label" style={{ fontSize: '1rem' }}>{label}</span>
                            <span className="text-muted" style={{ fontSize: '0.82rem', lineHeight: 1.45 }}>
                                {subtitle}
                            </span>
                        </motion.button>
                    );
                })}
            </motion.div>

            <motion.div
                style={{
                    position: 'relative',
                    zIndex: 1,
                    marginTop: '1rem',
                    padding: '1.25rem',
                    borderRadius: '28px',
                    border: '1px solid var(--glass-border)',
                    background: 'rgba(255,255,255,0.03)',
                    backdropFilter: 'blur(18px)',
                    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.16)',
                }}
            >
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
        </motion.div>
    );
}
