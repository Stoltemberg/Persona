import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { LogOut, Wallet, TrendingUp, PiggyBank } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
    const { user, profile, signOut } = useAuth();

    return (
        <div className="container">
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '3rem',
                paddingTop: '2rem'
            }}>
                <div>
                    <h1>Dashboard</h1>
                    <p>Welcome back, {profile?.full_name || user?.email}</p>
                </div>
                <Button variant="ghost" onClick={signOut} icon={LogOut}>
                    Sign Out
                </Button>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                <Card>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ padding: '0.5rem', background: 'rgba(18, 194, 233, 0.2)', borderRadius: '12px', color: 'var(--secondary)' }}>
                            <Wallet size={24} />
                        </div>
                        <h3>Total Balance</h3>
                    </div>
                    <h2 style={{ fontSize: '2.5rem' }}>$12,450.00</h2>
                    <p style={{ color: 'var(--secondary)' }}>+2.5% from last month</p>
                </Card>

                <Card>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ padding: '0.5rem', background: 'rgba(246, 79, 89, 0.2)', borderRadius: '12px', color: 'var(--accent)' }}>
                            <TrendingUp size={24} />
                        </div>
                        <h3>Monthly Expenses</h3>
                    </div>
                    <h2 style={{ fontSize: '2.5rem' }}>$3,200.00</h2>
                    <p style={{ color: 'var(--accent)' }}>-12% vs budget</p>
                </Card>

                <Card>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ padding: '0.5rem', background: 'rgba(196, 113, 237, 0.2)', borderRadius: '12px', color: 'var(--primary)' }}>
                            <PiggyBank size={24} />
                        </div>
                        <h3>Savings Goal</h3>
                    </div>
                    <h2 style={{ fontSize: '2.5rem' }}>$8,500.00</h2>
                    <p style={{ color: 'var(--primary)' }}>65% of goal reached</p>
                </Card>
            </div>

            <div style={{ marginTop: '3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2>Recent Transactions</h2>
                    <Link to="/transactions">
                        <Button variant="ghost">View All</Button>
                    </Link>
                </div>

                <div className="glass-panel" style={{ padding: '1rem' }}>
                    <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No transactions yet. Start by adding one!
                    </p>
                </div>
            </div>
        </div>
    );
}
