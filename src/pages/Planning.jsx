import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/Button';
import { PieChart, Target, Wallet, TrendingUp } from 'lucide-react';

import Analysis from './Analysis';
import Goals from './Goals';
import Budgets from './Budgets';
import Simulator from './Simulator';

const VALID_TABS = ['analysis', 'goals', 'budgets', 'simulator'];

export default function Planning() {
    const [searchParams, setSearchParams] = useSearchParams();
    const requestedTab = searchParams.get('tab');
    const activeTab = VALID_TABS.includes(requestedTab) ? requestedTab : 'analysis';

    useEffect(() => {
        if (!VALID_TABS.includes(requestedTab)) {
            setSearchParams({ tab: 'analysis' }, { replace: true });
        }
    }, [requestedTab, setSearchParams]);

    const handleTabChange = (tab) => {
        setSearchParams({ tab });
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'analysis': return <Analysis isTab={true} />;
            case 'goals': return <Goals isTab={true} />;
            case 'budgets': return <Budgets isTab={true} />;
            case 'simulator': return <Simulator isTab={true} />;
            default: return <Analysis isTab={true} />;
        }
    };

    const getTitle = () => {
        switch (activeTab) {
            case 'analysis': return <span>Análise <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Financeira</span></span>;
            case 'goals': return <span>Minhas <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Metas</span></span>;
            case 'budgets': return <span>Meus <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Orçamentos</span></span>;
            case 'simulator': return <span>Simulador de <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Investimentos</span></span>;
            default: return 'Planejamento Financeiro';
        }
    };

    const getSubtitle = () => {
        switch (activeTab) {
            case 'analysis': return 'Entenda seus hábitos de consumo';
            case 'goals': return 'Acompanhe e realize seus sonhos';
            case 'budgets': return 'Defina limites e economize';
            case 'simulator': return 'Projete seu futuro financeiro';
            default: return '';
        }
    };

    return (
        <div className="container fade-in" style={{ paddingBottom: '80px' }}>
            <PageHeader
                title={getTitle()}
                subtitle={getSubtitle()}
            />

            <div className="glass-panel" style={{
                padding: '0.5rem',
                marginBottom: '1.5rem',
                display: 'flex',
                gap: '0.5rem',
                overflowX: 'auto',
                whiteSpace: 'nowrap',
                scrollbarWidth: 'none',
                position: 'sticky',
                top: '0',
                zIndex: 10,
                backdropFilter: 'blur(12px)',
                background: 'var(--glass-bg)',
                borderBottom: '1px solid var(--glass-border)',
                margin: '0 -1rem 1.5rem -1rem',
                borderRadius: '0 0 16px 16px',
                width: 'calc(100% + 2rem)'
            }}>
                <Button
                    variant={activeTab === 'analysis' ? 'primary' : 'ghost'}
                    onClick={() => handleTabChange('analysis')}
                    icon={PieChart}
                    style={{ borderRadius: '12px', flex: '0 0 auto', padding: '0.6rem 1rem', fontSize: '0.9rem' }}
                >
                    Análise
                </Button>
                <Button
                    variant={activeTab === 'goals' ? 'primary' : 'ghost'}
                    onClick={() => handleTabChange('goals')}
                    icon={Target}
                    style={{ borderRadius: '12px', flex: '0 0 auto', padding: '0.6rem 1rem', fontSize: '0.9rem' }}
                >
                    Metas
                </Button>
                <Button
                    variant={activeTab === 'budgets' ? 'primary' : 'ghost'}
                    onClick={() => handleTabChange('budgets')}
                    icon={Wallet}
                    style={{ borderRadius: '12px', flex: '0 0 auto', padding: '0.6rem 1rem', fontSize: '0.9rem' }}
                >
                    Orçamentos
                </Button>
                <Button
                    variant={activeTab === 'simulator' ? 'primary' : 'ghost'}
                    onClick={() => handleTabChange('simulator')}
                    icon={TrendingUp}
                    style={{ borderRadius: '12px', flex: '0 0 auto', padding: '0.6rem 1rem', fontSize: '0.9rem' }}
                >
                    Simulador
                </Button>
                <div style={{ width: '0.5rem', flex: '0 0 auto' }}></div>
            </div>

            <div className="fade-in" key={activeTab}>
                {renderContent()}
            </div>
        </div>
    );
}
