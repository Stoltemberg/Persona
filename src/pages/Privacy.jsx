import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function Privacy() {
    return (
        <main className="fade-in" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
            <Helmet>
                <title>Política de Privacidade | Persona</title>
                <meta
                    name="description"
                    content="Política de Privacidade do Persona. Saiba como lidamos com seus dados e garantimos a sua segurança financeira."
                />
                <link rel="canonical" href="https://persona.dev.br/privacy" />
            </Helmet>

            <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', color: 'var(--text-muted)' }}>
                <ArrowLeft size={20} /> Voltar
            </Link>

            <h1 className="text-gradient" style={{ marginBottom: '2rem' }}>Política de Privacidade</h1>

            <div className="glass-card" style={{ padding: '2rem', lineHeight: '1.6' }}>
                <h3>1. Dados Coletados</h3>
                <p>Coletamos apenas o necessário para o funcionamento do serviço: email e nome via autenticação. Dados financeiros, como transações e saldos, são armazenados de forma segura e privada.</p>

                <h3>2. Uso dos Dados</h3>
                <p>Seus dados são usados exclusivamente para fornecer a funcionalidade do app. Não vendemos nem compartilhamos seus dados financeiros com terceiros.</p>

                <h3>3. Segurança</h3>
                <p>Utilizamos criptografia (SSL) e práticas modernas de segurança, incluindo Row Level Security no banco de dados, para garantir que apenas você tenha acesso aos seus dados.</p>

                <h3>4. Cookies</h3>
                <p>Utilizamos cookies apenas para manter sua sessão de login ativa.</p>

                <p style={{ marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Última atualização: Janeiro de 2026</p>
            </div>
        </main>
    );
}
