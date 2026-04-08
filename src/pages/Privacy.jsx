import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const sections = [
    {
        title: '1. Dados coletados',
        text: 'Coletamos apenas as informacoes necessarias para autenticacao, personalizacao da conta e funcionamento dos recursos financeiros.',
    },
    {
        title: '2. Uso dos dados',
        text: 'Os dados sao utilizados exclusivamente para operar a plataforma, gerar analises e entregar a experiencia contratada.',
    },
    {
        title: '3. Seguranca',
        text: 'Aplicamos praticas modernas de seguranca, incluindo conexoes criptografadas e regras de acesso no banco de dados.',
    },
    {
        title: '4. Cookies',
        text: 'Utilizamos cookies e armazenamento local apenas para manter sessoes, preferencias e melhorar a experiencia de uso.',
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

export default function Privacy() {
    return (
        <motion.main className="public-shell" variants={pageVariants} initial="hidden" animate="visible">
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

                <motion.div className="public-card public-legal-card" variants={cardVariants}>
                    <span className="dashboard-kicker">Privacidade</span>
                    <h1>Politica de privacidade</h1>

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
