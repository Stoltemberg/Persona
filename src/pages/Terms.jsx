import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function Terms() {
    return (
        <main className="public-shell">
            <Helmet>
                <title>Termos de Uso | Persona</title>
                <meta
                    name="description"
                    content="Termos de uso do Persona. Conheca as regras e diretrizes para utilizacao segura do aplicativo."
                />
                <link rel="canonical" href="https://persona.dev.br/terms" />
            </Helmet>

            <div className="public-legal-shell">
                <Link to="/" className="public-back-link">
                    <ArrowLeft size={18} />
                    Voltar
                </Link>

                <div className="public-card public-legal-card">
                    <span className="dashboard-kicker">Documento legal</span>
                    <h1>Termos de uso</h1>

                    <section>
                        <h3>1. Aceitacao</h3>
                        <p>Ao acessar e usar a Persona, voce concorda com estes termos e com as regras de utilizacao da plataforma.</p>
                    </section>

                    <section>
                        <h3>2. O servico</h3>
                        <p>A Persona e uma ferramenta de organizacao financeira pessoal e familiar, com recursos gratuitos e planos pagos.</p>
                    </section>

                    <section>
                        <h3>3. Planos e pagamentos</h3>
                        <p>Os pagamentos sao processados por parceiros especializados. Nao armazenamos dados de cartao de credito diretamente.</p>
                    </section>

                    <section>
                        <h3>4. Responsabilidades</h3>
                        <p>Voce e responsavel por proteger sua conta, credenciais e pelas informacoes inseridas no sistema.</p>
                    </section>

                    <section>
                        <h3>5. Cancelamento</h3>
                        <p>Voce pode interromper o uso da plataforma quando quiser. Regras de cancelamento e reembolso seguem a legislacao aplicavel.</p>
                    </section>

                    <p className="public-legal-date">Ultima atualizacao: Janeiro de 2026</p>
                </div>
            </div>
        </main>
    );
}
