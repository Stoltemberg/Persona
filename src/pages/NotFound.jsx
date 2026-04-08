import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';
import { Button } from '../components/Button';

export default function NotFound() {
    return (
        <main className="public-shell public-centered-shell">
            <div className="public-card public-message-card">
                <span className="dashboard-kicker">
                    <Search size={14} />
                    Rota nao encontrada
                </span>
                <h1>404</h1>
                <p>Essa pagina nao existe mais ou o link foi digitado de forma incorreta.</p>
                <Link to="/">
                    <Button className="btn-primary">
                        <Home size={18} />
                        Voltar ao inicio
                    </Button>
                </Link>
            </div>
        </main>
    );
}
