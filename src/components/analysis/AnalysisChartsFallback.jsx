import { Card } from '../../components/Card';
import { Skeleton } from '../../components/Skeleton';

export function AnalysisChartsFallback() {
    return (
        <div className="app-two-column-grid">
            <Card className="glass-card app-section-card" style={{ minHeight: '400px' }}>
                <div className="app-section-header">
                    <div>
                        <h3>Distribuicao de gastos</h3>
                        <p>Carregando visualizacoes...</p>
                    </div>
                </div>
                <Skeleton width="100%" height="300px" borderRadius="18px" />
            </Card>
            <Card className="glass-card app-section-card" style={{ minHeight: '400px' }}>
                <div className="app-section-header">
                    <div>
                        <h3>Tendencia dos ultimos 6 meses</h3>
                        <p>Carregando visualizacoes...</p>
                    </div>
                </div>
                <Skeleton width="100%" height="300px" borderRadius="18px" />
            </Card>
        </div>
    );
}
