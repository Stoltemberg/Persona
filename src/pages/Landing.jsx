import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, Check, Compass, ShieldCheck, Sparkles, Target, Wallet } from 'lucide-react';
import { Button } from '../components/Button';

const pageVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            duration: 0.45,
            staggerChildren: 0.08,
        },
    },
};

const revealVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.45, ease: 'easeOut' },
    },
};

export default function Landing() {
    return (
        <motion.main className="landing-page fade-in" variants={pageVariants} initial="hidden" animate="visible">
            <Helmet>
                <title>Persona - Seu sistema operacional financeiro</title>
                <meta
                    name="description"
                    content="Planeje, acompanhe e evolua sua rotina financeira com uma experiencia mais clara, integrada e confiavel."
                />
                <script type="application/ld+json">
                    {`
                        {
                            "@context": "https://schema.org",
                            "@type": "SoftwareApplication",
                            "name": "Persona",
                            "applicationCategory": "FinanceApplication",
                            "operatingSystem": "Web",
                            "url": "https://persona.dev.br/",
                            "description": "Plataforma financeira para planejar, automatizar e evoluir decisoes com clareza."
                        }
                    `}
                </script>
            </Helmet>

            <motion.header className="landing-header" variants={revealVariants}>
                <div className="landing-container landing-header-content">
                    <div className="landing-brand">
                        <div className="landing-brand-icon" />
                        Persona
                    </div>
                    <Link to="/login">
                        <Button className="btn-primary">Entrar</Button>
                    </Link>
                </div>
            </motion.header>

            <motion.section className="landing-hero" variants={revealVariants}>
                <div className="landing-container landing-hero-grid">
                    <motion.div className="landing-hero-copy" variants={pageVariants}>
                        <div className="landing-pill fade-in stagger-1">
                            <Sparkles size={16} />
                            Financas pessoais e familiares em um fluxo mais claro
                        </div>
                        <h1 className="text-gradient fade-in stagger-2">Seu dinheiro com direcao, visibilidade e tranquilidade.</h1>
                        <p className="fade-in stagger-3">
                            A Persona organiza saldos, metas, recorrencias e planejamento em uma experiencia unica para voce agir com menos ruido.
                        </p>
                        <div className="landing-hero-actions fade-in stagger-4">
                            <Link to="/login">
                                <Button className="btn-primary" style={{ padding: '1rem 2rem', fontSize: '1rem' }}>
                                    Experimentar agora
                                    <ArrowRight />
                                </Button>
                            </Link>
                            <a className="landing-inline-link" href="#recursos">Ver recursos</a>
                        </div>
                        <div className="landing-highlights fade-in stagger-5">
                            <Badge icon={Wallet} text="Carteiras, transacoes e saldos no mesmo lugar" />
                            <Badge icon={Target} text="Metas e orcamentos acompanhados em tempo real" />
                            <Badge icon={ShieldCheck} text="Privacidade, seguranca e controle por padrao" />
                        </div>
                    </motion.div>

                    <motion.article
                        className="landing-preview-card fade-in stagger-5 landing-preview-panel"
                        variants={revealVariants}
                        whileHover={{ y: -4, scale: 1.01 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="landing-preview-metric">
                            <span className="dashboard-kicker">Resumo do mes</span>
                            <strong>R$ 8.450,00</strong>
                            <p>Saldo consolidado com proximos vencimentos e meta principal em destaque.</p>
                        </div>
                        <div className="landing-preview-list">
                            <PreviewItem title="Carteiras" value="4 ativas" />
                            <PreviewItem title="Metas" value="2 em andamento" />
                            <PreviewItem title="Recorrencias" value="6 automatizadas" />
                        </div>
                    </motion.article>
                </div>
            </motion.section>

            <motion.section id="recursos" aria-label="Recursos" className="landing-section" variants={revealVariants}>
                <div className="landing-container">
                    <h2 className="landing-section-title">Tudo que voce precisa para ganhar previsibilidade</h2>
                    <div className="landing-grid">
                        <FeatureCard icon={Compass} title="Painel com contexto" text="Veja prioridades, saldos e proximos passos em uma unica superficie." />
                        <FeatureCard icon={Wallet} title="Operacao financeira organizada" text="Registre receitas, despesas e recorrencias sem perder a origem do dinheiro." />
                        <FeatureCard icon={Target} title="Planejamento acionavel" text="Metas, simulacoes e orcamentos ficam conectados ao dia a dia." />
                    </div>
                </div>
            </motion.section>

            <motion.section className="landing-section landing-pricing" variants={revealVariants}>
                <div className="landing-container">
                    <h2 className="text-gradient landing-section-title">Planos para cada fase da sua rotina</h2>

                    <div className="landing-pricing-grid">
                        <PricingCard
                            title="Free"
                            price="R$ 0"
                            features={['1 carteira', '5 orcamentos', 'Analise basica']}
                        />
                        <PricingCard
                            title="One"
                            price="R$ 14,90"
                            color="#12c2e9"
                            features={['3 carteiras', '10 orcamentos', 'Analise basica']}
                        />
                        <PricingCard
                            title="Duo"
                            price="R$ 29,90"
                            featured
                            color="#FFD700"
                            features={['Carteiras ilimitadas', 'IA financeira', 'Exportacao completa', 'Modo casal', 'Orcamentos ilimitados']}
                        />
                    </div>
                </div>
            </motion.section>

            <motion.footer className="landing-footer" variants={revealVariants}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <Link to="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>Termos de uso</Link>
                    <Link to="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacidade</Link>
                </div>
                <p>© 2026 Persona Finance. Todos os direitos reservados.</p>
                <address style={{ marginTop: '1rem', fontStyle: 'normal', fontSize: '0.8rem', opacity: 0.6 }}>Sao Paulo, SP - Brasil</address>
            </motion.footer>
        </motion.main>
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
        <motion.article
            className="glass-card landing-feature-card"
            variants={revealVariants}
            whileHover={{ y: -6, scale: 1.01 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
        >
            <div className="landing-feature-icon">
                <Icon size={24} />
            </div>
            <h3>{title}</h3>
            <p>{text}</p>
        </motion.article>
    );
}

function PreviewItem({ title, value }) {
    return (
        <div className="landing-preview-item">
            <span>{title}</span>
            <strong>{value}</strong>
        </div>
    );
}

function PricingCard({ title, price, features, featured, color = '#38ef7d' }) {
    return (
        <motion.article
            className={`glass-card landing-pricing-card${featured ? ' is-featured' : ''}`}
            style={{ '--landing-card-accent': color }}
            variants={revealVariants}
            whileHover={{ y: -6, scale: 1.01 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
        >
            {featured && <div className="landing-pricing-badge">Mais escolhido</div>}
            <h3>{title}</h3>
            <div className="landing-pricing-price">
                {price}
                <span>/mes</span>
            </div>
            <ul>
                {features.map((feature) => (
                    <li key={feature}>
                        <Check size={18} color={color} />
                        {feature}
                    </li>
                ))}
            </ul>
            <Link to="/login">
                <Button className={featured ? 'btn-primary' : 'btn-ghost'} style={{ width: '100%', justifyContent: 'center' }}>
                    Comecar
                </Button>
            </Link>
        </motion.article>
    );
}
