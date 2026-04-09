import { lazy, Suspense, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
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

const sectionVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
};

export default function Planning() {
    const [searchParams, setSearchParams] = useSearchParams();
    const requestedTab = searchParams.get('tab');
    const activeTab = VALID_TABS.includes(requestedTab) ? requestedTab : 'analysis';
    const activeConfig = TAB_CONFIG[activeTab];

    useEffect(() => {
        if (!VALID_TABS.includes(requestedTab)) {
            setSearchParams({ tab: 'analysis' }, { replace: true });
        }
    }, [requestedTab, setSearchParams]);

    const handleTabChange = (tab) => setSearchParams({ tab });

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
                            <Icon size={16} />
                            <span>{label}</span>
                        </motion.button>
                    );
                })}
            </motion.div>

            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={activeTab}
                    variants={sectionVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                    <Suspense fallback={<div className="app-empty-inline">Carregando aba...</div>}>
                        {renderContent()}
                    </Suspense>
                </motion.div>
            </AnimatePresence>
        </motion.div>
    );
}
