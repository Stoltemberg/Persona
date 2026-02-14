import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Navigate } from 'react-router-dom';
import { TrendingUp, Plane, Zap, Shield, Globe, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Login() {
    const { signIn, signUp, user } = useAuth();
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');

    if (user) return <Navigate to="/" />;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (isSignUp) {
                await signUp(email, password, fullName);
                alert('Verifique seu e-mail para confirmar o cadastro!');
            } else {
                await signIn(email, password);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">

            {/* Background Effects - Removed for Minimalism */}

            <div className="container login-grid">

                {/* Hero Section */}
                <div className="fade-in login-hero">
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '50px', marginBottom: '1.5rem', border: '1px solid var(--glass-border)' }}>
                        <Star size={14} fill="var(--color-brand)" stroke="var(--color-brand)" />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>O FUTURO DAS FINANÇAS</span>
                    </div>

                    <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', lineHeight: 1.1, marginBottom: '1.5rem' }}>
                        Domine seu dinheiro <br />
                        <span style={{ color: 'var(--text-muted)' }}>com elegância.</span>
                    </h1>

                    <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '3rem', maxWidth: '500px', lineHeight: 1.6 }}>
                        Persona não é apenas uma planilha. É um sistema inteligente que categoriza, prevê e otimiza sua vida financeira.
                    </p>

                    <div className="login-features-grid">
                        <div className="login-feature-item">
                            <div style={{ padding: '0.8rem', background: 'var(--bg-card)', borderRadius: '12px', color: 'var(--text-main)', border: '1px solid var(--glass-border)' }}>
                                <Zap size={24} />
                            </div>
                            <div>
                                <h4 style={{ fontWeight: 700 }}>Smart IA</h4>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Auto-categorização</p>
                            </div>
                        </div>

                        <div className="login-feature-item">
                            <div style={{ padding: '0.8rem', background: 'var(--bg-card)', borderRadius: '12px', color: 'var(--text-main)', border: '1px solid var(--glass-border)' }}>
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <h4 style={{ fontWeight: 700 }}>Simulador</h4>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Projeção de futuro</p>
                            </div>
                        </div>

                        <div className="login-feature-item">
                            <div style={{ padding: '0.8rem', background: 'var(--bg-card)', borderRadius: '12px', color: 'var(--text-main)', border: '1px solid var(--glass-border)' }}>
                                <Plane size={24} />
                            </div>
                            <div>
                                <h4 style={{ fontWeight: 700 }}>Modo Viagem</h4>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Contextos dinâmicos</p>
                            </div>
                        </div>

                        <div className="login-feature-item">
                            <div style={{ padding: '0.8rem', background: 'var(--bg-card)', borderRadius: '12px', color: 'var(--text-main)', border: '1px solid var(--glass-border)' }}>
                                <Shield size={24} />
                            </div>
                            <div>
                                <h4 style={{ fontWeight: 700 }}>Privacidade</h4>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Modo Discreto</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Login Form with Animation */}
                <div className="fade-in stagger-1 login-card-container">
                    <motion.div
                        layout
                        className="glass-card"
                        style={{ width: '100%', maxWidth: '420px', overflow: 'hidden', padding: '2.5rem' }}
                        transition={{ duration: 0.4, type: 'spring', stiffness: 100 }}
                    >
                        <motion.h2 layout="position" style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '1.75rem' }}>
                            {isSignUp ? 'Criar Conta' : 'Acessar Persona'}
                        </motion.h2>
                        <motion.p layout="position" style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
                            {isSignUp ? 'Comece sua jornada financeira hoje.' : 'Bem-vindo de volta.'}
                        </motion.p>

                        <form onSubmit={handleSubmit}>
                            <AnimatePresence initial={false}>
                                {isSignUp && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                        animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                        transition={{ duration: 0.3 }}
                                        style={{ overflow: 'hidden' }}
                                    >
                                        <Input
                                            label="Nome Completo"
                                            placeholder="Seu nome"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            required
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <motion.div layout="position">
                                <Input
                                    label="Email"
                                    type="email"
                                    placeholder="exemplo@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </motion.div>

                            <motion.div layout="position">
                                <Input
                                    label="Senha"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </motion.div>

                            {error && <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    padding: '0.75rem',
                                    background: 'rgba(246, 79, 89, 0.1)',
                                    border: '1px solid rgba(246, 79, 89, 0.2)',
                                    borderRadius: '8px',
                                    color: '#f64f59',
                                    marginBottom: '1.5rem',
                                    fontSize: '0.9rem',
                                    textAlign: 'center'
                                }}
                            >{error}</motion.div>}

                            <motion.div layout="position">
                                <Button
                                    type="submit"
                                    className="btn-primary"
                                    style={{ width: '100%', justifyContent: 'center', marginBottom: '1.5rem', marginTop: '0.5rem', height: '50px', fontSize: '1.1rem' }}
                                    loading={loading}
                                >
                                    {isSignUp ? 'Começar Agora' : 'Entrar'}
                                </Button>
                            </motion.div>
                        </form>

                        <motion.div layout="position" style={{ textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
                            <p className="text-small">
                                {isSignUp ? 'Já tem cadastro?' : "Novo por aqui?"}{' '}
                                <button
                                    className="toggle-btn"
                                    onClick={() => {
                                        setError(null);
                                        setIsSignUp(!isSignUp);
                                    }}
                                >
                                    {isSignUp ? 'Fazer Login' : 'Criar Conta'}
                                </button>
                            </p>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
