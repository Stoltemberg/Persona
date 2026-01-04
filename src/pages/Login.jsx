import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Navigate } from 'react-router-dom';

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
        <div className="flex-center" style={{ minHeight: '100vh', padding: '1rem', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>

            {/* Background Decor - Optional additional blobs if desired, but body has them */}

            <div style={{ textAlign: 'center', marginBottom: '3rem', position: 'relative', zIndex: 10 }} className="fade-in">
                <h1 style={{
                    fontSize: '4rem',
                    background: 'linear-gradient(135deg, #fff 0%, #c471ed 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 0 20px rgba(196, 113, 237, 0.3))'
                }}>
                    Persona
                </h1>
                <p style={{ fontSize: '1.2rem', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.8)' }}>
                    Finanças a dois, simplificadas.
                </p>
            </div>

            <Card style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }} className="fade-in stagger-1">
                <h2 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '1.75rem' }}>
                    {isSignUp ? 'Criar Conta' : 'Bem-vindo(a)'}
                </h2>

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
                        style={{ width: '100%', justifyContent: 'center', marginBottom: '1.5rem', marginTop: '0.5rem' }}
                        loading={loading}
                    >
                        {isSignUp ? 'Começar Agora' : 'Acessar Conta'}
                    </Button>
                </form>

                <div style={{ textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
                    <p style={{ fontSize: '0.9rem' }}>
                        {isSignUp ? 'Já tem cadastro?' : "Novo por aqui?"}{' '}
                        <button
                            className=""
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#c471ed',
                                fontWeight: 600,
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                marginLeft: '0.5rem',
                                fontSize: '0.9rem'
                            }}
                            onClick={() => setIsSignUp(!isSignUp)}
                        >
                            {isSignUp ? 'Fazer Login' : 'Criar Conta'}
                        </button>
                    </p>
                </div>
            </Card>
        </div>
    );
}
