import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Search } from 'lucide-react';
import { Button } from '../components/Button';

const pageVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            duration: 0.35,
            staggerChildren: 0.08,
        },
    },
};

const cardVariants = {
    hidden: { opacity: 0, y: 16, scale: 0.98 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.35, ease: 'easeOut' },
    },
};

export default function NotFound() {
    return (
        <motion.main className="public-shell public-centered-shell" variants={pageVariants} initial="hidden" animate="visible">
            <motion.div className="public-card public-message-card" variants={cardVariants}>
                <span className="dashboard-kicker">
                    <Search size={14} />
                    Rota nao encontrada
                </span>
                <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }}>
                    404
                </motion.h1>
                <p>Essa pagina nao existe mais ou o link foi digitado de forma incorreta.</p>
                <Link to="/">
                    <Button className="btn-primary">
                        <Home size={18} />
                        Voltar ao inicio
                    </Button>
                </Link>
            </motion.div>
        </motion.main>
    );
}
