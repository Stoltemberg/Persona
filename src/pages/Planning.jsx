import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PieChart, Target, Wallet, TrendingUp } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import Analysis from './Analysis';
import Goals from './Goals';
import Budgets from './Budgets';
import Simulator from './Simulator';

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
        <div className="container fade-in app-page-shell" style={{ paddingBottom: '80px' }}>
            <PageHeader
                title={<span>Planejamento <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Financeiro</span></span>}
                subtitle={activeConfig.subtitle}
            />

            <div className="glass-card planning-tabs">
                {VALID_TABS.map((tab) => {
                    const { icon: Icon, label } = TAB_CONFIG[tab];
                    const isActive = activeTab === tab;

                    return (
                        <button
                            key={tab}
                            type="button"
                            className={`planning-tab-button${isActive ? ' is-active' : ''}`}
                            onClick={() => handleTabChange(tab)}
                        >
                            <Icon size={16} />
                            <span>{label}</span>
                        </button>
                    );
                })}
            </div>

            <div className="fade-in" key={activeTab}>
                {renderContent()}
            </div>
        </div>
    );
}
