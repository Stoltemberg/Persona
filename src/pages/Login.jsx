import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Compass, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

const highlights = [
    { icon: Sparkles, title: 'Menos friccao', text: 'Entre e retome sua rotina sem abrir tres telas diferentes.' },
    { icon: TrendingUp, title: 'Contexto continuo', text: 'Saldo, metas e recorrencias seguem no mesmo fluxo.' },
    { icon: Compass, title: 'Direcao diaria', text: 'Use o painel como centro de decisao, nao como vitrine.' },
    { icon: ShieldCheck, title: 'Acesso protegido', text: 'Sessao e dados seguem controles de acesso do sistema.' },
];

const shellVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.45, staggerChildren: 0.08 } },
};

const reveal = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const shell = {
    position: 'relative',
    isolation: 'isolate',
    overflow: 'hidden',
};

const panel = {
    border: '1px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(12, 13, 15, 0.8)',
    boxShadow: '0 36px 70px -30px rgba(0, 0, 0, 0.55)',
};

export default function Login() {
    const { signIn, signUp, user } = useAuth();
    const reduceMotion = useReducedMotion();
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [notice, setNotice] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');

    if (user) return <Navigate to="/" />;

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        setNotice(null);

        try {
            if (isSignUp) {
                await signUp(email, password, fullName);
                setNotice('Cadastro criado. Verifique seu e-mail para confirmar a conta antes de entrar.');
                setIsSignUp(false);
            } else {
                await signIn(email, password);
            }
        } catch (err) {
            let message = err.message;
            if (message.includes('Invalid login credentials')) message = 'E-mail ou senha incorretos.';
            if (message.includes('User already registered')) message = 'Este e-mail ja esta cadastrado.';
            if (message.includes('Password should be at least')) message = 'A senha deve ter pelo menos 6 caracteres.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.main className="public-shell login-surface" variants={shellVariants} initial="hidden" animate="visible" style={shell}>
            <Helmet>
                <title>{isSignUp ? 'Criar Conta | Persona' : 'Acessar Persona | Login'}</title>
                <meta name="description" content="Entre na Persona e organize sua vida financeira com uma experiencia mais clara, moderna e confiavel." />
                <link rel="canonical" href="https://persona.dev.br/login" />
            </Helmet>

            <Backdrop reduceMotion={reduceMotion} />

            <div className="public-auth-grid" style={{ position: 'relative', zIndex: 1 }}>
                <motion.section className="public-auth-hero" variants={reveal} style={{ paddingRight: 'clamp(0rem, 2vw, 2rem)' }}>
                    <span className="dashboard-kicker">Acesso seguro</span>
                    <h1 style={{ fontSize: 'clamp(3rem, 6vw, 5.2rem)', lineHeight: 0.95, letterSpacing: '-0.06em', maxWidth: '11ch' }}>
                        Seu dinheiro continua exatamente de onde parou.
                    </h1>
                    <p style={{ maxWidth: '54ch' }}>
                        Entre para acompanhar saldos, planejar metas e transformar movimentacoes em decisoes simples de acompanhar.
                    </p>

                    <motion.div variants={shellVariants} initial="hidden" animate="visible" style={{ display: 'grid', gap: '0.9rem', marginTop: '0.5rem' }}>
                        {highlights.map(({ icon: Icon, title, text }, index) => (
                            <motion.div
                                key={title}
                                variants={reveal}
                                whileHover={reduceMotion ? undefined : { x: 3 }}
                                transition={{ duration: 0.2 }}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'auto 1fr',
                                    gap: '0.85rem',
                                    paddingTop: index === 0 ? '0.25rem' : '0.95rem',
                                    borderTop: index === 0 ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                                }}
                            >
                                <span
                                    className="app-inline-icon"
                                    style={{
                                        width: '2.5rem',
                                        height: '2.5rem',
                                        display: 'grid',
                                        placeItems: 'center',
                                        borderRadius: '14px',
                                        background: 'rgba(255, 255, 255, 0.04)',
                                        border: '1px solid rgba(255, 255, 255, 0.08)',
                                    }}
                                >
                                    <Icon size={18} />
                                </span>
                                <div>
                                    <strong style={{ display: 'block', color: 'var(--text-main)', marginBottom: '0.15rem' }}>{title}</strong>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{text}</span>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.section>

                <motion.section
                    className="public-card public-auth-card"
                    variants={reveal}
                    whileHover={reduceMotion ? undefined : { y: -2 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    style={{ ...panel, borderRadius: '30px', padding: 'clamp(1.35rem, 3vw, 2rem)' }}
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: '1rem',
                            alignItems: 'start',
                            marginBottom: '0.5rem',
                        }}
                    >
                        <div>
                            <span className="dashboard-kicker">{isSignUp ? 'Criar conta' : 'Entrar'}</span>
                            <h2 style={{ marginTop: '0.35rem' }}>{isSignUp ? 'Comece agora' : 'Bem-vindo de volta'}</h2>
                            <p style={{ marginBottom: 0 }}>{isSignUp ? 'Monte sua estrutura financeira em poucos minutos.' : 'Acesse sua rotina financeira de onde parou.'}</p>
                        </div>
                        <div
                            aria-hidden="true"
                            style={{
                                width: '3rem',
                                height: '3rem',
                                borderRadius: '16px',
                                display: 'grid',
                                placeItems: 'center',
                                background: 'rgba(255, 255, 255, 0.04)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                color: '#d4af37',
                            }}
                        >
                            <Sparkles size={18} />
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="public-auth-form">
                        <AnimatePresence initial={false}>
                            {isSignUp && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.25 }}
                                    style={{ overflow: 'hidden' }}
                                >
                                    <Input
                                        label="Nome completo"
                                        placeholder="Seu nome"
                                        value={fullName}
                                        onChange={(event) => setFullName(event.target.value)}
                                        required
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <Input label="Email" type="email" placeholder="exemplo@email.com" value={email} onChange={(event) => setEmail(event.target.value)} required />

                        <Input
                            label="Senha"
                            type="password"
                            placeholder="Digite sua senha"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            required
                            minLength={6}
                        />

                        {error && (
                            <div className="public-form-alert is-error" role="alert" aria-live="assertive">
                                {error}
                            </div>
                        )}
                        {notice && (
                            <div className="public-form-alert is-success" role="status" aria-live="polite">
                                {notice}
                            </div>
                        )}

                        <Button type="submit" className="btn-primary" loading={loading} style={{ width: '100%', justifyContent: 'center' }}>
                            {isSignUp ? 'Criar conta' : 'Entrar'}
                        </Button>
                    </form>

                    <div className="public-auth-toggle">
                        <span>{isSignUp ? 'Ja tem cadastro?' : 'Novo por aqui?'}</span>
                        <button
                            type="button"
                            className="toggle-btn"
                            onClick={() => {
                                setError(null);
                                setNotice(null);
                                setIsSignUp(!isSignUp);
                            }}
                        >
                            {isSignUp ? 'Fazer login' : 'Criar conta'}
                        </button>
                    </div>
                </motion.section>
            </div>
        </motion.main>
    );
}

function Backdrop({ reduceMotion }) {
    return (
        <div aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
            <motion.div
                animate={reduceMotion ? undefined : { x: [0, -14, 0], y: [0, 12, 0], scale: [1, 1.03, 1] }}
                transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                    position: 'absolute',
                    top: '-10%',
                    right: '-12%',
                    width: '32rem',
                    height: '32rem',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(212, 175, 55, 0.18) 0%, rgba(212, 175, 55, 0.05) 34%, transparent 70%)',
                    filter: 'blur(18px)',
                }}
            />
            <motion.div
                animate={reduceMotion ? undefined : { x: [0, 18, 0], y: [0, -14, 0] }}
                transition={{ duration: 21, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                    position: 'absolute',
                    left: '-12%',
                    bottom: '-10%',
                    width: '28rem',
                    height: '28rem',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(18, 194, 233, 0.12) 0%, transparent 68%)',
                    filter: 'blur(18px)',
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage:
                        'linear-gradient(rgba(255,255,255,0.026) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.026) 1px, transparent 1px)',
                    backgroundSize: '96px 96px',
                    opacity: 0.16,
                    maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.78), transparent 88%)',
                }}
            />
        </div>
    );
}
