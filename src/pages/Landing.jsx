import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { ArrowRight, Check, Sparkles, Zap, LayoutDashboard, Database, HandCoins, Target, ShieldCheck } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function Landing() {
    return (
        <main className="landing-page fade-in">
            <Helmet>
                <title>Persona - Seu sistema operacional financeiro</title>
                <meta name="description" content="Reimagine sua vida financeira com uma experiência visual moderna: planejamento, automações, metas e decisões mais inteligentes em um só lugar." />
                <script type="application/ld+json">
                    {`
                        {
                            "@context": "https://schema.org",
                            "@type": "SoftwareApplication",
                            "name": "Persona",
                            "applicationCategory": "FinanceApplication",
                            "operatingSystem": "Web",
                            "url": "https://persona.dev.br/",
                            "description": "Plataforma financeira para planejar, automatizar e evoluir suas decisões com clareza."
                        }
                    `}
                </script>
            </Helmet>

            <header className="landing-header">
                <div className="landing-container landing-header-content">
                    <div className="landing-brand">
                        <div className="landing-brand-icon" />
                        Persona
                    </div>
                    <Link to="/login">
                        <Button className="btn-primary">Entrar</Button>
                    </Link>
                </div>
            </header>

            <section className="landing-hero">
                <div className="landing-container landing-hero-grid">
                    <div className="landing-hero-copy">
                        <div className="landing-pill fade-in stagger-1">
                            <Sparkles size={16} /> Reimagine suas finanças pessoais e familiares
                        </div>
                        <h1 className="text-gradient fade-in stagger-2">
                            Seu dinheiro com direção, contexto e tranquilidade.
                        </h1>
                        <p className="fade-in stagger-3">
                            A Persona virou seu centro de comando financeiro: organiza rotinas, mostra oportunidades e transforma números em decisões simples.
                        </p>
                        <div className="landing-hero-actions fade-in stagger-4">
                            <Link to="/login">
                                <Button className="btn-primary" style={{ padding: '1rem 2rem', fontSize: '1rem' }}>
                                    Experimentar agora <ArrowRight />
                                </Button>
                            </Link>
                            <a className="landing-inline-link" href="#roadmap">Ver como funciona</a>
                        </div>
                        <div className="landing-highlights fade-in stagger-5">
                            <Badge icon={HandCoins} text="Fluxo de caixa em tempo real" />
                            <Badge icon={Target} text="Metas com acompanhamento inteligente" />
                            <Badge icon={ShieldCheck} text="Privacidade e segurança por padrão" />
                        </div>
                    </div>

                    <div className="landing-preview-card fade-in stagger-5">
                        <img
                            src="/dashboard-preview.png"
                            alt="Persona Dashboard"
                        />
                    </div>
                </div>
            </section>

            <section id="roadmap" aria-label="Recursos" className="landing-section">
                <div className="landing-container">
                    <h2 className="landing-section-title">Tudo que você precisa para ganhar previsibilidade</h2>
                    <div className="landing-grid">
                    <FeatureCard icon={LayoutDashboard} title="Controle Total" text="Dashboard intuitivo com todas as suas contas em um só lugar." />
                    <FeatureCard icon={Database} title="Organização Automática" text="Categorias inteligentes e filtros poderosos para suas transações." />
                    <FeatureCard icon={Zap} title="Planejamento Real" text="Defina orçamentos e alcance suas metas financeiras mais rápido." />
                    </div>
                </div>
            </section>

            <section className="landing-section landing-pricing">
                <div className="landing-container">
                    <h2 className="text-gradient landing-section-title">Planos para cada estágio da sua jornada</h2>

                <div className="landing-pricing-grid">
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
                </div>
            </section>

            <footer className="landing-footer">
                <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <Link to="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>Termos de Uso</Link>
                    <Link to="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacidade</Link>
                </div>
                <p>© 2026 Persona Finance. Todos os direitos reservados.</p>
                <address style={{ marginTop: '1rem', fontStyle: 'normal', fontSize: '0.8rem', opacity: 0.6 }}>São Paulo, SP - Brasil</address>
            </footer>
        </main>
    );
}

function Badge({ icon: Icon, text }) {
    return (
        <span className="landing-badge">
            <Icon size={15} />
            {text}
        </span>
    );
}

function FeatureCard({ icon: Icon, title, text }) {
    return (
        <article className="glass-card" style={{ padding: '2rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(17, 153, 142, 0.1)', borderRadius: '12px', width: 'fit-content', marginBottom: '1rem', color: '#38ef7d' }}>
                <Icon size={24} />
            </div>
            <h3 style={{ marginBottom: '0.5rem' }}>{title}</h3>
            <p style={{ color: 'var(--text-muted)' }}>{text}</p>
        </article>
    );
}

function PricingCard({ title, price, features, featured, buttonText = "Começar", color = "#38ef7d" }) {
    return (
        <article className="glass-card" style={{
            padding: '2rem',
            width: '100%',
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
        </article>
    );
}
