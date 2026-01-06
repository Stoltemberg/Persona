import React from 'react';
import { Button } from './Button';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
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
                    <h1 className="text-gradient" style={{ marginBottom: '1rem' }}>Ops! Algo deu errado.</h1>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', maxWidth: '500px' }}>
                        Não se preocupe, seus dados estão seguros. Foi apenas um erro momentâneo na interface.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Button className="btn-primary" onClick={() => window.location.reload()}>
                            Recarregar Página
                        </Button>
                        <Button className="btn-ghost" onClick={() => window.location.href = '/'}>
                            Voltar ao Início
                        </Button>
                    </div>
                    {process.env.NODE_ENV === 'development' && (
                        <pre style={{
                            marginTop: '2rem',
                            padding: '1rem',
                            background: 'rgba(0,0,0,0.3)',
                            borderRadius: '8px',
                            textAlign: 'left',
                            maxWidth: '800px',
                            overflow: 'auto',
                            color: '#ff6b6b'
                        }}>
                            {this.state.error && this.state.error.toString()}
                        </pre>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}
