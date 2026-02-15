import { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/Button';
import { PieChart, Target, Wallet, TrendingUp } from 'lucide-react';

// Import Views
import Analysis from './Analysis';
import Goals from './Goals';
import Budgets from './Budgets';
import Simulator from './Simulator';

export default function Planning() {
    const [activeTab, setActiveTab] = useState('analysis');

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
            case 'analysis': return "Entenda seus hábitos de consumo";
            case 'goals': return "Acompanhe e realize seus sonhos";
            case 'budgets': return "Defina limites e economize";
            case 'simulator': return "Projete seu futuro financeiro";
            default: return "";
        }
    };

    return (
        <div className="container fade-in" style={{ paddingBottom: '80px' }}>
            <PageHeader
                title={getTitle()}
                subtitle={getSubtitle()}
            />

            {/* Tab Navigation - Sticky & Scrollable */}
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
                margin: '0 -1rem 1.5rem -1rem', // Negative margin to span full width on mobile
                borderRadius: '0 0 16px 16px', // Rounded only at bottom
                width: 'calc(100% + 2rem)' //Compensate for negative margins
            }}>
                <Button
                    variant={activeTab === 'analysis' ? 'primary' : 'ghost'}
                    onClick={() => setActiveTab('analysis')}
                    icon={PieChart}
                    style={{ borderRadius: '12px', flex: '0 0 auto', padding: '0.6rem 1rem', fontSize: '0.9rem' }}
                >
                    Análise
                </Button>
                <Button
                    variant={activeTab === 'goals' ? 'primary' : 'ghost'}
                    onClick={() => setActiveTab('goals')}
                    icon={Target}
                    style={{ borderRadius: '12px', flex: '0 0 auto', padding: '0.6rem 1rem', fontSize: '0.9rem' }}
                >
                    Metas
                </Button>
                <Button
                    variant={activeTab === 'budgets' ? 'primary' : 'ghost'}
                    onClick={() => setActiveTab('budgets')}
                    icon={Wallet}
                    style={{ borderRadius: '12px', flex: '0 0 auto', padding: '0.6rem 1rem', fontSize: '0.9rem' }}
                >
                    Orçamentos
                </Button>
                <Button
                    variant={activeTab === 'simulator' ? 'primary' : 'ghost'}
                    onClick={() => setActiveTab('simulator')}
                    icon={TrendingUp}
                    style={{ borderRadius: '12px', flex: '0 0 auto', padding: '0.6rem 1rem', fontSize: '0.9rem' }}
                >
                    Simulador
                </Button>
                {/* Spacer for right padding */}
                <div style={{ width: '0.5rem', flex: '0 0 auto' }}></div>
            </div>

            {/* Content Area */}
            <div className="fade-in" key={activeTab}>
                {renderContent()}
            </div>
        </div>
    );
}
