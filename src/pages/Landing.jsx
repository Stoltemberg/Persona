import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { ArrowRight, Check, Shield, Zap, LayoutDashboard, Database } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Landing() {
    const { theme } = useTheme();

    return (
        <div className="fade-in" style={{ overflowX: 'hidden' }}>
            {/* Header */}
            <header style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 100,
                backdropFilter: 'blur(10px)',
                background: 'rgba(var(--bg-rgb), 0.7)',
                borderBottom: '1px solid var(--glass-border)'
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-main)' }}>
                        <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'linear-gradient(135deg, #11998e, #38ef7d)' }} />
                        Persona
                    </div>
                    <Link to="/login">
                        <Button className="btn-primary">Entrar</Button>
                    </Link>
                </div>
            </header>

            {/* Hero Section */}
            <section style={{
                minHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '8rem 1rem 4rem 1rem',
                background: 'radial-gradient(circle at 50% 50%, rgba(17, 153, 142, 0.15), transparent 70%)'
            }}>
                <div className="fade-in stagger-1" style={{ marginBottom: '1.5rem', padding: '0.5rem 1rem', borderRadius: '50px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', fontSize: '0.9rem' }}>
                    ✨ A gestão financeira do futuro
                </div>
                <h1 className="text-gradient fade-in stagger-2" style={{ fontSize: 'clamp(3rem, 5vw, 4.5rem)', maxWidth: '900px', lineHeight: 1.1, marginBottom: '1.5rem' }}>
                    Sua Liberdade Financeira Começa Aqui
                </h1>
                <p className="fade-in stagger-3" style={{ fontSize: '1.2rem', color: 'var(--text-muted)', maxWidth: '600px', marginBottom: '2.5rem' }}>
                    Domine seus gastos, planeje o futuro e tenha clareza total sobre o seu dinheiro com a plataforma mais intuitiva do mercado.
                </p>
                <div className="fade-in stagger-4" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Link to="/login">
                        <Button className="btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
                            Começar Grátis <ArrowRight />
                        </Button>
                    </Link>
                </div>

                {/* Dashboard Preview */}
                <div className="fade-in stagger-5" style={{
                    marginTop: '4rem',
                    width: '100%',
                    maxWidth: '1000px',
                    position: 'relative',
                    perspective: '1000px'
                }}>
                    <div style={{
                        borderRadius: '24px',
                        overflow: 'hidden',
                        boxShadow: '0 50px 100px -20px rgba(0,0,0,0.5)',
                        border: '1px solid var(--glass-border)',
                        transform: 'rotateX(5deg)',
                        transition: 'transform 0.5s ease',
                        background: 'rgba(23, 23, 23, 0.8)'
                    }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'rotateX(0deg) scale(1.02)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'rotateX(5deg)'}
                    >
                        <img
                            src="/dashboard-preview.png"
                            alt="Prévia do Dashboard Persona exibindo gráficos de receitas e despesas"
                            style={{ width: '100%', height: 'auto', display: 'block' }}
                        />
                    </div>
                </div>
            </section>

            {/* Features */}
            <section style={{ padding: '4rem 1rem', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                    <FeatureCard icon={LayoutDashboard} title="Controle Total" text="Dashboard intuitivo com todas as suas contas em um só lugar." />
                    <FeatureCard icon={Database} title="Organização Automática" text="Categorias inteligentes e filtros poderosos para suas transações." />
                    <FeatureCard icon={Zap} title="Planejamento Real" text="Defina orçamentos e alcance suas metas financeiras mais rápido." />
                </div>
            </section>

            {/* Pricing */}
            <section style={{ padding: '6rem 1rem', textAlign: 'center' }}>
                <h2 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '3rem' }}>Planos para você</h2>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                    <PricingCard
                        title="Grátis"
                        price="R$ 0"
                        features={['5 Carteiras', '10 Orçamentos', 'Análise Básica']}
                    />
                    <PricingCard
                        title="Intermediário"
                        price="R$ 14,90"
                        features={['Carteiras Ilimitadas', 'Orçamentos Ilimitados', 'Sem Anúncios']}
                        buttonText="Assinar Intermediário"
                        color="#12c2e9"
                    // featured removed so it doesn't fight for attention
                    />
                    <PricingCard
                        title="Completo"
                        price="R$ 29,90"
                        featured
                        features={['Tudo do Intermediário', 'IA Financeira', 'Exportação Excel', 'Suporte VIP']}
                        buttonText="Assinar Completo"
                        color="#FFD700"
                    />
                </div>
            </section>

            {/* Footer */}
            <footer style={{ borderTop: '1px solid var(--glass-border)', padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '2rem' }}>
                    <Link to="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>Termos de Uso</Link>
                    <Link to="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacidade</Link>
                </div>
                <p>© 2026 Persona Finance. Todos os direitos reservados.</p>
            </footer>
        </div>
    );
}

function FeatureCard({ icon: Icon, title, text }) {
    return (
        <div className="glass-card" style={{ padding: '2rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(17, 153, 142, 0.1)', borderRadius: '12px', width: 'fit-content', marginBottom: '1rem', color: '#38ef7d' }}>
                <Icon size={24} />
            </div>
            <h3 style={{ marginBottom: '0.5rem' }}>{title}</h3>
            <p style={{ color: 'var(--text-muted)' }}>{text}</p>
        </div>
    );
}

function PricingCard({ title, price, features, featured, buttonText = "Começar", color = "#38ef7d" }) {
    return (
        <div className="glass-card" style={{
            padding: '2rem',
            width: '100%',
            maxWidth: '350px',
            border: featured ? `1px solid ${color}` : '1px solid var(--glass-border)',
            position: 'relative',
            overflow: 'visible',
            boxShadow: featured ? `0 0 20px ${color}20` : 'none'
        }}>
            {featured && (
                <div style={{
                    position: 'absolute',
                    top: -12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: color,
                    color: '#000',
                    padding: '0.2rem 1rem',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap'
                }}>
                    MAIS POPULAR
                </div>
            )}
            <h3>{title}</h3>
            <div style={{ fontSize: '3rem', fontWeight: 700, margin: '1rem 0' }}>{price}<span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-muted)' }}>/mês</span></div>
            <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left', marginBottom: '2rem' }}>
                {features.map((f, i) => (
                    <li key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.8rem', color: 'var(--text-secondary)' }}>
                        <Check size={18} color={color} /> {f}
                    </li>
                ))}
            </ul>
            <Link to="/login">
                <Button className={featured ? 'btn-primary' : 'btn-ghost'} style={{
                    width: '100%',
                    justifyContent: 'center',
                    background: featured ? color : 'transparent',
                    borderColor: featured ? color : 'var(--glass-border)',
                    color: featured ? '#000' : 'inherit'
                }}>
                    {buttonText}
                </Button>
            </Link>
        </div>
    );
}
