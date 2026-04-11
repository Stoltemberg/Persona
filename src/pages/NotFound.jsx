import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Home, Search } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Button } from '../components/Button';

const pageVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.35, staggerChildren: 0.08 } },
};

const reveal = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

const shell = {
    position: 'relative',
    isolation: 'isolate',
    overflow: 'hidden',
};

export default function NotFound() {
    const reduceMotion = useReducedMotion();

    return (
        <motion.main
            className="public-shell public-centered-shell"
            variants={pageVariants}
            initial="hidden"
            animate="visible"
            style={{ ...shell, minHeight: '100svh' }}
        >
            <Helmet>
                <title>404 | Persona</title>
                <meta name="description" content="Pagina nao encontrada na Persona." />
            </Helmet>

            <Backdrop reduceMotion={reduceMotion} />

            <motion.div
                variants={reveal}
                style={{
                    position: 'relative',
                    zIndex: 1,
                    width: 'min(920px, 100%)',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '2rem',
                    alignItems: 'center',
                }}
            >
                <div style={{ display: 'grid', gap: '1rem' }}>
                    <span className="dashboard-kicker" style={{ width: 'fit-content' }}>
                        <Search size={14} />
                        Rota nao encontrada
                    </span>
                    <h1
                        style={{
                            fontSize: 'clamp(5rem, 14vw, 10rem)',
                            lineHeight: 0.86,
                            letterSpacing: '-0.08em',
                            marginBottom: 0,
                        }}
                    >
                        404
                    </h1>
                    <p style={{ maxWidth: '34ch', marginBottom: 0 }}>
                        Essa pagina nao existe mais ou o link foi digitado de forma incorreta.
                    </p>
                    <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                        <Link to="/">
                            <Button className="btn-primary">
                                <Home size={18} />
                                Voltar ao inicio
                            </Button>
                        </Link>
                        <Link to="/login" style={{ color: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                            <ArrowLeft size={16} />
                            Ir para login
                        </Link>
                    </div>
                </div>

                <motion.div
                    aria-hidden="true"
                    animate={reduceMotion ? undefined : { rotate: 360 }}
                    transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
                    style={{
                        aspectRatio: '1',
                        borderRadius: '50%',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'grid',
                        placeItems: 'center',
                        background:
                            'radial-gradient(circle at center, rgba(212, 175, 55, 0.12) 0%, rgba(255,255,255,0.03) 48%, rgba(255,255,255,0.01) 100%)',
                        boxShadow: 'inset 0 0 80px rgba(255, 255, 255, 0.03)',
                    }}
                >
                    <div
                        style={{
                            width: '72%',
                            aspectRatio: '1',
                            borderRadius: '50%',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            display: 'grid',
                            placeItems: 'center',
                        }}
                    >
                        <div
                            style={{
                                width: '38%',
                                aspectRatio: '1',
                                borderRadius: '50%',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                display: 'grid',
                                placeItems: 'center',
                                color: '#d4af37',
                            }}
                        >
                            <Search size={20} />
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </motion.main>
    );
}

function Backdrop({ reduceMotion }) {
    return (
        <div aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
            <motion.div
                animate={reduceMotion ? undefined : { x: [0, -12, 0], y: [0, 10, 0] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                    position: 'absolute',
                    top: '-10%',
                    right: '-12%',
                    width: '30rem',
                    height: '30rem',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.04) 35%, transparent 72%)',
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
