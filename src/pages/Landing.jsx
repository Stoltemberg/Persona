import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, Check, Compass, Sparkles, Target, Wallet } from 'lucide-react';
import { Button } from '../components/Button';

const heroStats = [
    { value: 'R$ 8.450,00', label: 'saldo consolidado' },
    { value: '6', label: 'recorrencias ativas' },
    { value: '2', label: 'metas em andamento' },
];

const features = [
    {
        icon: Compass,
        title: 'Leitura imediata',
        text: 'Saldo, metas e proximos passos aparecem na mesma linha de raciocinio.',
    },
    {
        icon: Wallet,
        title: 'Operacao organizada',
        text: 'Receitas, despesas e carteiras ficam conectadas sem perder contexto.',
    },
    {
        icon: Target,
        title: 'Planejamento acionavel',
        text: 'Orcamentos e objetivos acompanham o ritmo real da rotina.',
    },
];

const plans = [
    { title: 'Free', price: 'R$ 0', features: ['1 carteira', '5 orcamentos', 'Analise basica'] },
    { title: 'One', price: 'R$ 14,90', features: ['3 carteiras', '10 orcamentos', 'Analise basica'] },
    {
        title: 'Duo',
        price: 'R$ 29,90',
        featured: true,
        features: ['Carteiras ilimitadas', 'IA financeira', 'Exportacao completa', 'Modo casal', 'Orcamentos ilimitados'],
    },
];

const pageVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.4, staggerChildren: 0.08 },
    },
};

const reveal = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
};

const shell = {
    position: 'relative',
    isolation: 'isolate',
    overflow: 'hidden',
};

const panel = {
    border: '1px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(12, 13, 15, 0.78)',
    boxShadow: '0 36px 70px -30px rgba(0, 0, 0, 0.55)',
};

const statBox = {
    padding: '1rem 1.05rem',
    borderRadius: '18px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    background: 'rgba(255, 255, 255, 0.035)',
    display: 'grid',
    gap: '0.3rem',
};

export default function Landing() {
    const reduceMotion = useReducedMotion();

    return (
        <motion.main className="landing-page public-shell" variants={pageVariants} initial="hidden" animate="visible" style={shell}>
            <Helmet>
                <title>Persona - Seu sistema operacional financeiro</title>
                <meta
                    name="description"
                    content="A Persona organiza saldo, metas, recorrencias e planejamento em uma experiencia mais clara, premium e confiavel."
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
                            "description": "Plataforma financeira para planejar, acompanhar e evoluir decisoes com clareza."
                        }
                    `}
                </script>
            </Helmet>

            <Backdrop reduceMotion={reduceMotion} />

            <motion.header className="landing-header" variants={reveal}>
                <div className="landing-container landing-header-content" style={{ position: 'relative', zIndex: 1 }}>
                    <div className="landing-brand">
                        <div
                            className="landing-brand-icon"
                            style={{
                                display: 'grid',
                                placeItems: 'center',
                                color: '#07110d',
                                fontSize: '0.95rem',
                                fontWeight: 800,
                                letterSpacing: '-0.08em',
                            }}
                        >
                            P
                        </div>
                        Persona
                    </div>
                    <Link to="/login">
                        <Button className="btn-primary">Entrar</Button>
                    </Link>
                </div>
            </motion.header>

            <motion.section className="landing-hero" variants={reveal} style={{ position: 'relative', zIndex: 1 }}>
                <div
                    className="landing-container landing-hero-grid"
                    style={{ minHeight: 'calc(100svh - 11rem)', alignItems: 'center', gap: 'clamp(2rem, 4vw, 4.5rem)' }}
                >
                    <motion.div className="landing-hero-copy" variants={stagger} initial="hidden" animate="visible">
                        <motion.div
                            className="landing-pill"
                            variants={reveal}
                            style={{ background: 'rgba(255, 255, 255, 0.045)', borderColor: 'rgba(255, 255, 255, 0.1)' }}
                        >
                            <Sparkles size={16} />
                            Persona / leitura financeira
                        </motion.div>
                        <motion.h1
                            variants={reveal}
                            style={{
                                fontSize: 'clamp(3.1rem, 6vw, 5.6rem)',
                                lineHeight: 0.93,
                                letterSpacing: '-0.06em',
                                maxWidth: '10ch',
                                marginBottom: '1rem',
                            }}
                        >
                            Sua rotina financeira, editada para clareza.
                        </motion.h1>
                        <motion.p variants={reveal} style={{ fontSize: '1.05rem', maxWidth: '56ch', marginBottom: '1.75rem' }}>
                            A Persona organiza carteiras, transacoes, metas e recorrencias em uma experiencia mais calma, precisa
                            e facil de ler.
                        </motion.p>
                        <motion.div className="landing-hero-actions" variants={reveal}>
                            <Link to="/login">
                                <Button className="btn-primary" style={{ padding: '1rem 1.35rem', fontSize: '1rem' }}>
                                    Experimentar agora
                                    <ArrowRight />
                                </Button>
                            </Link>
                            <a className="landing-inline-link" href="#recursos">
                                Ver recursos
                            </a>
                        </motion.div>
                        <motion.div
                            className="landing-highlights"
                            variants={stagger}
                            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.9rem', marginTop: '2rem', maxWidth: '38rem' }}
                        >
                            {heroStats.map((item) => (
                                <motion.div key={item.label} variants={reveal} style={statBox}>
                                    <strong style={{ color: 'var(--text-main)', fontSize: '1.05rem' }}>{item.value}</strong>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', lineHeight: 1.35 }}>
                                        {item.label}
                                    </span>
                                </motion.div>
                            ))}
                        </motion.div>
                    </motion.div>

                    <motion.aside
                        variants={reveal}
                        whileHover={reduceMotion ? undefined : { y: -4, scale: 1.01 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        style={{ ...panel, position: 'relative', minHeight: '560px', padding: '1.35rem', borderRadius: '34px', overflow: 'hidden' }}
                    >
                        <div
                            aria-hidden="true"
                            style={{
                                position: 'absolute',
                                inset: 0,
                                background:
                                    'radial-gradient(circle at 18% 18%, rgba(212, 175, 55, 0.22), transparent 32%), radial-gradient(circle at 82% 16%, rgba(18, 194, 233, 0.15), transparent 28%), radial-gradient(circle at 50% 100%, rgba(56, 239, 125, 0.08), transparent 30%)',
                            }}
                        />
                        <div
                            aria-hidden="true"
                            style={{
                                position: 'absolute',
                                inset: 0,
                                backgroundImage:
                                    'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
                                backgroundSize: '96px 96px',
                                opacity: 0.16,
                                maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.85), transparent 88%)',
                            }}
                        />
                        <motion.div
                            aria-hidden="true"
                            animate={reduceMotion ? undefined : { x: [0, -14, 0], y: [0, 10, 0], scale: [1, 1.03, 1] }}
                            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
                            style={{
                                position: 'absolute',
                                right: '-8%',
                                top: '-10%',
                                width: '68%',
                                aspectRatio: '1',
                                borderRadius: '50%',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                            }}
                        />
                        <motion.div
                            aria-hidden="true"
                            animate={reduceMotion ? undefined : { x: [0, 12, 0], y: [0, -10, 0] }}
                            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
                            style={{
                                position: 'absolute',
                                left: '-12%',
                                bottom: '-10%',
                                width: '52%',
                                aspectRatio: '1',
                                borderRadius: '50%',
                                background: 'radial-gradient(circle, rgba(18, 194, 233, 0.14), transparent 62%)',
                                filter: 'blur(12px)',
                            }}
                        />

                        <div style={{ position: 'relative', zIndex: 1, display: 'grid', gap: '1rem', height: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                                <span className="dashboard-kicker">Resumo do periodo</span>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Atualizado agora</span>
                            </div>
                            <div style={{ display: 'grid', gap: '0.55rem' }}>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                                    Saldo consolidado
                                </div>
                                <div style={{ fontSize: 'clamp(3rem, 6vw, 5.1rem)', lineHeight: 0.92, fontWeight: 800, letterSpacing: '-0.07em', color: 'var(--text-main)' }}>
                                    R$ 8.450,00
                                </div>
                                <p style={{ marginBottom: 0, maxWidth: '30ch' }}>
                                    Carteiras, metas e recorrencias alinhadas em uma unica leitura.
                                </p>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.85rem' }}>
                                {heroStats.map((item) => (
                                    <div key={item.label} style={statBox}>
                                        <strong style={{ color: 'var(--text-main)', fontSize: '0.98rem' }}>{item.value}</strong>
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.3 }}>{item.label}</span>
                                    </div>
                                ))}
                            </div>
                            <svg viewBox="0 0 600 220" preserveAspectRatio="none" style={{ width: '100%', height: '220px', display: 'block', marginTop: 'auto' }}>
                                <defs>
                                    <linearGradient id="persona-line" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#12c2e9" />
                                        <stop offset="100%" stopColor="#d4af37" />
                                    </linearGradient>
                                    <linearGradient id="persona-fill" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="rgba(18,194,233,0.35)" />
                                        <stop offset="100%" stopColor="rgba(18,194,233,0.02)" />
                                    </linearGradient>
                                </defs>
                                <motion.path
                                    d="M 20 176 C 88 148, 112 112, 170 126 S 286 195, 338 142 S 462 74, 530 92 S 578 70, 580 56"
                                    fill="none"
                                    stroke="url(#persona-line)"
                                    strokeWidth="3.5"
                                    strokeLinecap="round"
                                    initial={reduceMotion ? false : { pathLength: 0, opacity: 0.25 }}
                                    animate={reduceMotion ? undefined : { pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 1.4, ease: 'easeOut' }}
                                />
                                <motion.path
                                    d="M 20 176 C 88 148, 112 112, 170 126 S 286 195, 338 142 S 462 74, 530 92 S 578 70, 580 56 L 580 220 L 20 220 Z"
                                    fill="url(#persona-fill)"
                                    initial={reduceMotion ? false : { opacity: 0 }}
                                    animate={reduceMotion ? undefined : { opacity: 1 }}
                                    transition={{ duration: 1.1, delay: 0.15 }}
                                />
                            </svg>
                        </div>
                    </motion.aside>
                </div>
            </motion.section>

            <motion.section id="recursos" aria-label="Recursos" className="landing-section" variants={reveal} style={{ position: 'relative', zIndex: 1 }}>
                <div className="landing-container">
                    <div style={{ maxWidth: '46rem', marginBottom: '1.5rem' }}>
                        <span className="dashboard-kicker">Recursos</span>
                        <h2 className="landing-section-title" style={{ textAlign: 'left', marginBottom: '0.75rem' }}>
                            Tudo que voce precisa para ganhar previsibilidade
                        </h2>
                        <p style={{ maxWidth: '48ch', marginBottom: 0 }}>
                            Uma estrutura enxuta, com decisao visual clara e menos ruido ornamental.
                        </p>
                    </div>

                    <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }}>
                        {features.map((feature, index) => (
                            <motion.article
                                key={feature.title}
                                variants={reveal}
                                whileHover={reduceMotion ? undefined : { x: 4 }}
                                transition={{ duration: 0.2, ease: 'easeOut' }}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'auto minmax(0, 1fr) auto',
                                    gap: '1rem',
                                    alignItems: 'center',
                                    padding: '1.15rem 0',
                                    borderTop: index === 0 ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(255, 255, 255, 0.06)',
                                }}
                            >
                                <div
                                    style={{
                                        width: '3rem',
                                        height: '3rem',
                                        borderRadius: '16px',
                                        display: 'grid',
                                        placeItems: 'center',
                                        background: 'rgba(255, 255, 255, 0.04)',
                                        border: '1px solid rgba(255, 255, 255, 0.08)',
                                        color: '#38ef7d',
                                    }}
                                >
                                    <feature.icon size={18} />
                                </div>
                                <div>
                                    <h3 style={{ marginBottom: '0.35rem' }}>{feature.title}</h3>
                                    <p style={{ marginBottom: 0, maxWidth: '42ch' }}>{feature.text}</p>
                                </div>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{String(index + 1).padStart(2, '0')}</span>
                            </motion.article>
                        ))}
                    </motion.div>
                </div>
            </motion.section>

            <motion.section className="landing-section landing-pricing" variants={reveal} style={{ position: 'relative', zIndex: 1 }}>
                <div className="landing-container">
                    <div style={{ maxWidth: '46rem', marginBottom: '1.5rem' }}>
                        <span className="dashboard-kicker">Planos</span>
                        <h2 className="landing-section-title text-gradient" style={{ textAlign: 'left', marginBottom: '0.75rem' }}>
                            Planos para cada fase da sua rotina
                        </h2>
                        <p style={{ maxWidth: '50ch', marginBottom: 0 }}>
                            Uma leitura simples dos niveis de uso, com destaque claro para a camada mais completa.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {plans.map((plan, index) => (
                            <motion.article
                                key={plan.title}
                                variants={reveal}
                                whileHover={reduceMotion ? undefined : { y: -3 }}
                                transition={{ duration: 0.2, ease: 'easeOut' }}
                                style={{
                                    position: 'relative',
                                    display: 'grid',
                                    gridTemplateColumns: 'minmax(0, 1fr) auto',
                                    gap: '1rem',
                                    padding: '1.35rem 1.3rem',
                                    borderRadius: plan.featured ? '28px' : '24px',
                                    border: plan.featured ? '1px solid rgba(212, 175, 55, 0.24)' : '1px solid rgba(255, 255, 255, 0.08)',
                                    background: plan.featured ? 'linear-gradient(180deg, rgba(212, 175, 55, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)' : 'rgba(255, 255, 255, 0.03)',
                                    boxShadow: plan.featured ? '0 22px 48px -30px rgba(212, 175, 55, 0.38)' : 'none',
                                    overflow: 'hidden',
                                }}
                            >
                                {plan.featured && (
                                    <div className="landing-pricing-badge" style={{ top: '1rem', left: 'auto', right: '1rem', transform: 'none' }}>
                                        Mais escolhido
                                    </div>
                                )}
                                <div style={{ paddingRight: plan.featured ? '7rem' : 0 }}>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
                                        {String(index + 1).padStart(2, '0')} / Plano
                                    </div>
                                    <h3 style={{ margin: '0.2rem 0 0.65rem' }}>{plan.title}</h3>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                                        {plan.features.map((feature) => (
                                            <li
                                                key={feature}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.45rem',
                                                    padding: '0.55rem 0.7rem',
                                                    borderRadius: '999px',
                                                    background: 'rgba(255, 255, 255, 0.035)',
                                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                                    color: 'var(--text-secondary)',
                                                    fontSize: '0.85rem',
                                                }}
                                            >
                                                <Check size={16} color={plan.featured ? '#d4af37' : '#38ef7d'} />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div style={{ textAlign: 'right', display: 'grid', gap: '0.7rem', alignContent: 'start' }}>
                                    <div>
                                        <div style={{ fontSize: '2.4rem', lineHeight: 0.98, fontWeight: 800, letterSpacing: '-0.05em', color: 'var(--text-main)' }}>
                                            {plan.price}
                                        </div>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>/mes</span>
                                    </div>
                                    <Link to="/login" style={{ justifySelf: 'end' }}>
                                        <Button className={plan.featured ? 'btn-primary' : 'btn-ghost'} style={{ minWidth: '140px', justifyContent: 'center' }}>
                                            Comecar
                                        </Button>
                                    </Link>
                                </div>
                            </motion.article>
                        ))}
                    </div>
                </div>
            </motion.section>

            <motion.footer className="landing-footer" variants={reveal} style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    <Link to="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>
                        Termos de uso
                    </Link>
                    <Link to="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>
                        Privacidade
                    </Link>
                </div>
                <p>Persona Finance. Todos os direitos reservados.</p>
                <address style={{ marginTop: '1rem', fontStyle: 'normal', fontSize: '0.8rem', opacity: 0.65 }}>
                    Sao Paulo, SP - Brasil
                </address>
            </motion.footer>
        </motion.main>
    );
}

function Backdrop({ reduceMotion }) {
    return (
        <div aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
            <motion.div
                animate={reduceMotion ? undefined : { x: [0, -18, 0], y: [0, 12, 0], scale: [1, 1.04, 1] }}
                transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                    position: 'absolute',
                    top: '-12%',
                    right: '-10%',
                    width: '36rem',
                    height: '36rem',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(212, 175, 55, 0.22) 0%, rgba(212, 175, 55, 0.06) 34%, transparent 70%)',
                    filter: 'blur(18px)',
                }}
            />
            <motion.div
                animate={reduceMotion ? undefined : { x: [0, 22, 0], y: [0, -16, 0] }}
                transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                    position: 'absolute',
                    left: '-14%',
                    top: '18%',
                    width: '32rem',
                    height: '32rem',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(18, 194, 233, 0.16) 0%, rgba(18, 194, 233, 0.05) 36%, transparent 72%)',
                    filter: 'blur(18px)',
                }}
            />
            <motion.div
                animate={reduceMotion ? undefined : { x: [0, 12, 0], y: [0, -8, 0] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                    position: 'absolute',
                    right: '20%',
                    bottom: '-10%',
                    width: '26rem',
                    height: '26rem',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(56, 239, 125, 0.08) 0%, transparent 68%)',
                    filter: 'blur(16px)',
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage:
                        'linear-gradient(rgba(255,255,255,0.026) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.026) 1px, transparent 1px)',
                    backgroundSize: '96px 96px',
                    opacity: 0.18,
                    maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent 86%)',
                }}
            />
        </div>
    );
}
