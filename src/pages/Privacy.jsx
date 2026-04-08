import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function Privacy() {
    return (
        <main className="public-shell">
            <Helmet>
                <title>Politica de Privacidade | Persona</title>
                <meta
                    name="description"
                    content="Politica de privacidade da Persona. Saiba como tratamos seus dados com seguranca e transparencia."
                />
                <link rel="canonical" href="https://persona.dev.br/privacy" />
            </Helmet>

            <div className="public-legal-shell">
                <Link to="/" className="public-back-link">
                    <ArrowLeft size={18} />
                    Voltar
                </Link>

                <div className="public-card public-legal-card">
                    <span className="dashboard-kicker">Privacidade</span>
                    <h1>Politica de privacidade</h1>

                    <section>
                        <h3>1. Dados coletados</h3>
                        <p>Coletamos apenas as informacoes necessarias para autenticacao, personalizacao da conta e funcionamento dos recursos financeiros.</p>
                    </section>

                    <section>
                        <h3>2. Uso dos dados</h3>
                        <p>Os dados sao utilizados exclusivamente para operar a plataforma, gerar analises e entregar a experiencia contratada.</p>
                    </section>

                    <section>
                        <h3>3. Seguranca</h3>
                        <p>Aplicamos praticas modernas de seguranca, incluindo conexoes criptografadas e regras de acesso no banco de dados.</p>
                    </section>

                    <section>
                        <h3>4. Cookies</h3>
                        <p>Utilizamos cookies e armazenamento local apenas para manter sessoes, preferencias e melhorar a experiencia de uso.</p>
                    </section>

                    <p className="public-legal-date">Ultima atualizacao: Janeiro de 2026</p>
                </div>
            </div>
        </main>
    );
}
