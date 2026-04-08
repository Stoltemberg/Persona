import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const sections = [
    {
        title: '1. Aceitacao',
        text: 'Ao acessar e usar a Persona, voce concorda com estes termos e com as regras de utilizacao da plataforma.',
    },
    {
        title: '2. O servico',
        text: 'A Persona e uma ferramenta de organizacao financeira pessoal e familiar, com recursos gratuitos e planos pagos.',
    },
    {
        title: '3. Planos e pagamentos',
        text: 'Os pagamentos sao processados por parceiros especializados. Nao armazenamos dados de cartao de credito diretamente.',
    },
    {
        title: '4. Responsabilidades',
        text: 'Voce e responsavel por proteger sua conta, credenciais e pelas informacoes inseridas no sistema.',
    },
    {
        title: '5. Cancelamento',
        text: 'Voce pode interromper o uso da plataforma quando quiser. Regras de cancelamento e reembolso seguem a legislacao aplicavel.',
    },
];

const pageVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            duration: 0.4,
            staggerChildren: 0.06,
        },
    },
};

const cardVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.35, ease: 'easeOut' },
    },
};

export default function Terms() {
    return (
        <motion.main className="public-shell" variants={pageVariants} initial="hidden" animate="visible">
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

                <motion.div className="public-card public-legal-card" variants={cardVariants}>
                    <span className="dashboard-kicker">Documento legal</span>
                    <h1>Termos de uso</h1>

                    {sections.map(({ title, text }) => (
                        <motion.section key={title} variants={cardVariants}>
                            <h3>{title}</h3>
                            <p>{text}</p>
                        </motion.section>
                    ))}

                    <p className="public-legal-date">Ultima atualizacao: Janeiro de 2026</p>
                </motion.div>
            </div>
        </motion.main>
    );
}
