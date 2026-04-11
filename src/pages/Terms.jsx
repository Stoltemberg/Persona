import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const sections = [
    {
        title: '1. Aceitacao',
        text: 'Ao acessar e usar a Persona, voce concorda com estes termos e com as regras de utilizacao da plataforma.',
    },
    {
        title: '2. O servico',
        text: 'A Persona e uma ferramenta de organizacao financeira pessoal e familiar, com recursos gratuitos e planos pagos.',
    },
    {
        title: '3. Planos e pagamentos',
        text: 'Os pagamentos sao processados por parceiros especializados. Nao armazenamos dados de cartao de credito diretamente.',
    },
    {
        title: '4. Responsabilidades',
        text: 'Voce e responsavel por proteger sua conta, credenciais e pelas informacoes inseridas no sistema.',
    },
    {
        title: '5. Cancelamento',
        text: 'Voce pode interromper o uso da plataforma quando quiser. Regras de cancelamento e reembolso seguem a legislacao aplicavel.',
    },
];

const pageVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.4, staggerChildren: 0.07 } },
};

const reveal = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

const shell = {
    position: 'relative',
    isolation: 'isolate',
    overflow: 'hidden',
};

const articleShell = {
    border: '1px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(10, 10, 11, 0.6)',
    boxShadow: '0 30px 60px -32px rgba(0, 0, 0, 0.5)',
};

export default function Terms() {
    const reduceMotion = useReducedMotion();

    return (
        <motion.main className="public-shell" variants={pageVariants} initial="hidden" animate="visible" style={shell}>
            <Helmet>
                <title>Termos de Uso | Persona</title>
                <meta name="description" content="Termos de uso do Persona. Conheca as regras e diretrizes para utilizacao segura do aplicativo." />
                <link rel="canonical" href="https://persona.dev.br/terms" />
            </Helmet>

            <Backdrop reduceMotion={reduceMotion} />

            <div className="public-legal-shell" style={{ position: 'relative', zIndex: 1, width: 'min(940px, 100%)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Link to="/" className="public-back-link">
                        <ArrowLeft size={18} />
                        Voltar
                    </Link>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Leitura rapida / 5 secoes</span>
                </div>

                <motion.article
                    variants={reveal}
                    style={{
                        ...articleShell,
                        borderRadius: '32px',
                        padding: 'clamp(1.5rem, 3vw, 2.5rem)',
                        display: 'grid',
                        gap: '1.35rem',
                    }}
                >
                    <div style={{ maxWidth: '52rem', display: 'grid', gap: '0.7rem' }}>
                        <span className="dashboard-kicker">Documento legal</span>
                        <h1 style={{ fontSize: 'clamp(2.6rem, 5vw, 4.3rem)', lineHeight: 0.96, letterSpacing: '-0.06em', marginBottom: 0 }}>
                            Termos de uso
                        </h1>
                        <p style={{ maxWidth: '58ch', marginBottom: 0 }}>
                            Estas regras resumem a relacao entre a pessoa usuaria e a plataforma, sem excesso de juridiquese.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                        {sections.map(({ title, text }, index) => (
                            <motion.section
                                key={title}
                                variants={reveal}
                                style={{
                                    display: 'grid',
                                    gap: '0.35rem',
                                    paddingTop: '1rem',
                                    borderTop: index === 0 ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(255, 255, 255, 0.06)',
                                }}
                            >
                                <h3 style={{ marginBottom: 0 }}>{title}</h3>
                                <p style={{ marginBottom: 0, maxWidth: '64ch' }}>{text}</p>
                            </motion.section>
                        ))}
                    </div>

                    <p className="public-legal-date" style={{ marginTop: '0.5rem' }}>
                        Ultima atualizacao: Abril de 2026
                    </p>
                </motion.article>
            </div>
        </motion.main>
    );
}

function Backdrop({ reduceMotion }) {
    return (
        <div aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
            <motion.div
                animate={reduceMotion ? undefined : { x: [0, -10, 0], y: [0, 8, 0] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                    position: 'absolute',
                    top: '-10%',
                    right: '-12%',
                    width: '30rem',
                    height: '30rem',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(212, 175, 55, 0.16) 0%, rgba(212, 175, 55, 0.04) 35%, transparent 72%)',
                    filter: 'blur(18px)',
                }}
            />
            <motion.div
                animate={reduceMotion ? undefined : { x: [0, 16, 0], y: [0, -12, 0] }}
                transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                    position: 'absolute',
                    left: '-12%',
                    bottom: '-14%',
                    width: '28rem',
                    height: '28rem',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(18, 194, 233, 0.1) 0%, transparent 68%)',
                    filter: 'blur(18px)',
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage:
                        'linear-gradient(rgba(255,255,255,0.024) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.024) 1px, transparent 1px)',
                    backgroundSize: '96px 96px',
                    opacity: 0.14,
                    maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent 86%)',
                }}
            />
        </div>
    );
}
