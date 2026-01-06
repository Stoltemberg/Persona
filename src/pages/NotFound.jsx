import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { Home } from 'lucide-react';

export default function NotFound() {
    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '2rem',
            background: 'var(--bg-deep)',
            color: 'var(--text-main)'
        }}>
            <h1 className="text-gradient" style={{ fontSize: '6rem', margin: 0, lineHeight: 1 }}>404</h1>
            <h2 style={{ marginBottom: '1rem', fontSize: '2rem' }}>Página não encontrada</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', maxWidth: '400px' }}>
                Opa! Parece que você se perdeu no multiverso financeiro. A página que você procura não existe.
            </p>
            <Link to="/">
                <Button className="btn-primary">
                    <Home size={18} /> Voltar ao Início
                </Button>
            </Link>
        </div>
    );
}
