import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Navigate } from 'react-router-dom';
import { TrendingUp, Plane, Zap, Shield, Globe, Star } from 'lucide-react';

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
            padding: '2rem',
            position: 'relative',
            overflow: 'hidden'
        }}>

            {/* Background Effects */}
            <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, var(--color-1) 0%, transparent 70%)', opacity: 0.2, filter: 'blur(80px)', zIndex: -1 }} />
            <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, var(--color-2) 0%, transparent 70%)', opacity: 0.2, filter: 'blur(80px)', zIndex: -1 }} />

            <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '4rem', alignItems: 'center', maxWidth: '1200px' }}>

                {/* Hero Section */}
                <div className="fade-in">
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '50px', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Star size={14} fill="#FFD700" stroke="#FFD700" />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.05em' }}>O FUTURO DAS FINANÇAS</span>
                    </div>

                    <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', lineHeight: 1.1, marginBottom: '1.5rem' }}>
                        Domine seu dinheiro <br />
                        <span className="text-gradient">com elegância.</span>
                    </h1>

                    <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '3rem', maxWidth: '500px', lineHeight: 1.6 }}>
                        Persona não é apenas uma planilha. É um sistema inteligente que categoriza, prevê e otimiza sua vida financeira.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
                        <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '1rem' }}>
                            <div style={{ padding: '0.8rem', background: 'rgba(18, 194, 233, 0.15)', borderRadius: '12px', color: '#12c2e9' }}>
                                <Zap size={24} />
                            </div>
                            <div>
                                <h4 style={{ fontWeight: 700 }}>Smart IA</h4>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Auto-categorização</p>
                            </div>
                        </div>

                        <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '1rem' }}>
                            <div style={{ padding: '0.8rem', background: 'rgba(196, 113, 237, 0.15)', borderRadius: '12px', color: '#c471ed' }}>
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <h4 style={{ fontWeight: 700 }}>Simulador</h4>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Projeção de futuro</p>
                            </div>
                        </div>

                        <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '1rem' }}>
                            <div style={{ padding: '0.8rem', background: 'rgba(246, 79, 89, 0.15)', borderRadius: '12px', color: '#f64f59' }}>
                                <Plane size={24} />
                            </div>
                            <div>
                                <h4 style={{ fontWeight: 700 }}>Modo Viagem</h4>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Contextos dinâmicos</p>
                            </div>
                        </div>

                        <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '1rem' }}>
                            <div style={{ padding: '0.8rem', background: 'rgba(0, 235, 199, 0.15)', borderRadius: '12px', color: '#00ebc7' }}>
                                <Shield size={24} />
                            </div>
                            <div>
                                <h4 style={{ fontWeight: 700 }}>Privacidade</h4>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Modo Discreto</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Login Form */}
                <div className="fade-in stagger-1" style={{ display: 'flex', justifyContent: 'center' }}>
                    <Card style={{ width: '100%', maxWidth: '420px', padding: '2.5rem', backdropFilter: 'blur(20px)', background: 'rgba(255,255,255,0.03)' }}>
                        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '1.75rem' }}>
                            {isSignUp ? 'Criar Conta' : 'Acessar Persona'}
                        </h2>
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
                            {isSignUp ? 'Comece sua jornada financeira hoje.' : 'Bem-vindo de volta.'}
                        </p>

                        <form onSubmit={handleSubmit}>
                            {isSignUp && (
                                <Input
                                    label="Nome Completo"
                                    placeholder="Seu nome"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                />
                            )}
                            <Input
                                label="Email"
                                type="email"
                                placeholder="exemplo@email.com"
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

                            {error && <div style={{
                                padding: '0.75rem',
                                background: 'rgba(246, 79, 89, 0.1)',
                                border: '1px solid rgba(246, 79, 89, 0.2)',
                                borderRadius: '8px',
                                color: '#f64f59',
                                marginBottom: '1.5rem',
                                fontSize: '0.9rem',
                                textAlign: 'center'
                            }}>{error}</div>}

                            <Button
                                type="submit"
                                className="btn-primary"
                                style={{ width: '100%', justifyContent: 'center', marginBottom: '1.5rem', marginTop: '0.5rem', height: '50px', fontSize: '1.1rem' }}
                                loading={loading}
                            >
                                {isSignUp ? 'Começar Agora' : 'Entrar'}
                            </Button>
                        </form>

                        <div style={{ textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
                            <p className="text-small">
                                {isSignUp ? 'Já tem cadastro?' : "Novo por aqui?"}{' '}
                                <button
                                    className="toggle-btn"
                                    onClick={() => setIsSignUp(!isSignUp)}
                                >
                                    {isSignUp ? 'Fazer Login' : 'Criar Conta'}
                                </button>
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
