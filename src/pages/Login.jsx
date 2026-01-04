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
        <div className="flex-center" style={{ minHeight: '100vh', padding: '1rem', flexDirection: 'column' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '3rem', background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Persona
                </h1>
                <p>Seu futuro financeiro compartilhado começa aqui.</p>
            </div>

            <Card style={{ width: '100%', maxWidth: '400px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    {isSignUp ? 'Criar Conta' : 'Bem-vindo(a)'}
                </h2>

                <form onSubmit={handleSubmit}>
                    {isSignUp && (
                        <Input
                            placeholder="Nome Completo"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                        />
                    )}
                    <Input
                        type="email"
                        placeholder="Endereço de E-mail"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <Input
                        type="password"
                        placeholder="Senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                    />

                    {error && <p style={{ color: 'var(--accent)', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</p>}

                    <Button
                        type="submit"
                        className="btn-primary"
                        style={{ width: '100%', justifyContent: 'center', marginBottom: '1rem' }}
                        loading={loading}
                    >
                        {isSignUp ? 'Cadastrar' : 'Entrar'}
                    </Button>
                </form>

                <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '0.9rem' }}>
                        {isSignUp ? 'Já tem uma conta?' : "Não tem uma conta?"}{' '}
                        <button
                            className="btn-ghost"
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.9rem', color: 'var(--secondary)' }}
                            onClick={() => setIsSignUp(!isSignUp)}
                        >
                            {isSignUp ? 'Entrar' : 'Cadastrar'}
                        </button>
                    </p>
                </div>
            </Card>
        </div>
    );
}
