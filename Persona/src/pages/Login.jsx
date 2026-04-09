import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Compass, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import { useAuth } from '../features/auth/useAuth';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

const highlights = [
    { icon: Sparkles, title: 'Categorias inteligentes', text: 'Organize lancamentos com menos friccao.' },
    { icon: TrendingUp, title: 'Planejamento claro', text: 'Entenda metas, limites e oportunidades.' },
    { icon: Compass, title: 'Direcao diaria', text: 'Use o dashboard como centro de comando.' },
    { icon: ShieldCheck, title: 'Privacidade em primeiro lugar', text: 'Controle seus dados com seguranca.' },
];

const shellVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            duration: 0.5,
            staggerChildren: 0.08,
        },
    },
};

const panelVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.45, ease: 'easeOut' },
    },
};

export default function Login() {
    const { signIn, signUp, user } = useAuth();
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
        <motion.main
            className="public-shell login-surface"
            variants={shellVariants}
            initial="hidden"
            animate="visible"
        >
            <Helmet>
                <title>{isSignUp ? 'Criar Conta | Persona' : 'Acessar Persona | Login'}</title>
                <meta name="description" content="Entre na Persona e organize sua vida financeira com uma experiencia mais clara, moderna e confiavel." />
                <link rel="canonical" href="https://persona.dev.br/login" />
            </Helmet>

            <div className="public-auth-grid">
                <motion.section className="public-auth-hero" variants={panelVariants}>
                    <span className="dashboard-kicker">Centro de comando financeiro</span>
                    <h1>Seu dinheiro com mais clareza, contexto e continuidade.</h1>
                    <p>Entre para acompanhar saldos, planejar metas e transformar movimentacoes em decisoes simples de acompanhar.</p>

                    <motion.div className="public-auth-highlight-grid" variants={shellVariants}>
                        {highlights.map(({ icon: Icon, title, text }) => (
                            <motion.article
                                key={title}
                                className="public-auth-highlight-card"
                                variants={panelVariants}
                                whileHover={{ y: -3, scale: 1.01 }}
                                transition={{ duration: 0.2 }}
                            >
                                <span className="app-inline-icon">
                                    <Icon size={18} />
                                </span>
                                <div>
                                    <strong>{title}</strong>
                                    <span>{text}</span>
                                </div>
                            </motion.article>
                        ))}
                    </motion.div>
                </motion.section>

                <motion.section
                    className="public-card public-auth-card"
                    variants={panelVariants}
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                    <span className="dashboard-kicker">{isSignUp ? 'Criar conta' : 'Entrar'}</span>
                    <h2>{isSignUp ? 'Comece agora' : 'Bem-vindo de volta'}</h2>
                    <p>{isSignUp ? 'Monte sua estrutura financeira em poucos minutos.' : 'Acesse sua rotina financeira de onde parou.'}</p>

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

                        <Input
                            label="Email"
                            type="email"
                            placeholder="exemplo@email.com"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                        />

                        <Input
                            label="Senha"
                            type="password"
                            placeholder="Digite sua senha"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            required
                            minLength={6}
                        />

                        {error && <div className="public-form-alert is-error">{error}</div>}
                        {notice && <div className="public-form-alert is-success">{notice}</div>}

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
