import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { ArrowLeft } from 'lucide-react';

export default function Terms() {
    return (
        <div className="fade-in" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
            <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', color: 'var(--text-muted)' }}>
                <ArrowLeft size={20} /> Voltar
            </Link>

            <h1 className="text-gradient" style={{ marginBottom: '2rem' }}>Termos de Uso</h1>

            <div className="glass-card" style={{ padding: '2rem', lineHeight: '1.6' }}>
                <h3>1. Aceitação</h3>
                <p>Ao acessar e usar o Persona, você aceita e concorda em cumprir os termos e disposições deste contrato.</p>

                <h3>2. O Serviço</h3>
                <p>O Persona é uma ferramenta de gestão financeira pessoal. Oferecemos planos gratuitos e pagos ("Pro"). O serviço é fornecido "como está".</p>

                <h3>3. Planos e Pagamentos</h3>
                <p>O plano Pro oferece recursos adicionais. O pagamento é processado via Mercado Pago. Não armazenamos dados de cartão de crédito. O acesso é liberado após a confirmação do pagamento.</p>

                <h3>4. Responsabilidades</h3>
                <p>Você é responsável por manter a confidencialidade da sua conta e senha. O Persona não se responsabiliza por perdas decorrentes do uso do software.</p>

                <h3>5. Cancelamento</h3>
                <p>Você pode parar de usar o serviço a qualquer momento. Planos pagos não são reembolsáveis, exceto conforme exigido por lei.</p>

                <p style={{ marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Última atualização: Janeiro de 2026</p>
            </div>
        </div>
    );
}
