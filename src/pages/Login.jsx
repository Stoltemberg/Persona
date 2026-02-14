import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Navigate } from 'react-router-dom';
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
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-deep)',
            padding: '20px'
        }}>
            <div className="glass-card" style={{
                width: '100%',
                maxWidth: '400px',
                padding: '40px',
                textAlign: 'center',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--glass-border)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
            }}>
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>
                        {isSignUp ? 'Criar ID Persona' : 'Entrar'}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
                        {isSignUp ? 'Gerencie suas finanças com elegância.' : 'Bem-vindo de volta.'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <AnimatePresence initial={false}>
                        {isSignUp && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                                <Input
                                    label="Nome"
                                    placeholder="Seu nome"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <Input
                        label="Email"
                        type="email"
                        placeholder="nome@icloud.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <Input
                        label="Senha"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                    />

                    {error && (
                        <div style={{
                            color: 'var(--color-red)',
                            fontSize: '13px',
                            textAlign: 'left',
                            background: 'rgba(255, 59, 48, 0.1)',
                            padding: '8px 12px',
                            borderRadius: '8px'
                        }}>
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="btn-primary"
                        style={{ width: '100%', marginTop: '8px' }}
                        loading={loading}
                    >
                        {isSignUp ? 'Continuar' : 'Iniciar Sessão'}
                    </Button>
                </form>

                <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--glass-border)' }}>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                        {isSignUp ? 'Já tem uma conta?' : 'Não tem uma conta?'}
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--color-blue)',
                                marginLeft: '6px',
                                fontWeight: 500,
                                cursor: 'pointer'
                            }}
                        >
                            {isSignUp ? 'Entrar' : 'Criar agora'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
