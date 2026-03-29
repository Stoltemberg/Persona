import React from 'react';
import { User, Users, Heart } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function PartnerFilter({ activeFilter, onFilterChange }) {
    const { partnerProfile } = useAuth();

    if (!partnerProfile) return null;

    const filters = [
        { id: 'me', label: 'Eu', icon: User },
        { id: 'partner', label: partnerProfile.nickname || 'Parceiro', icon: Heart },
        { id: 'all', label: 'Casal', icon: Users },
    ];

    return (
        <div className="partner-filter-container" style={{
            display: 'inline-flex',
            background: 'var(--input-bg)',
            padding: '4px',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--glass-border)',
            gap: '4px',
            marginBottom: '1rem'
        }}>
            {filters.map((f) => {
                const Icon = f.icon;
                const isActive = activeFilter === f.id;
                
                return (
                    <button
                        key={f.id}
                        onClick={() => onFilterChange(f.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            borderRadius: 'var(--radius-pill)',
                            border: 'none',
                            background: isActive ? 'var(--color-brand)' : 'transparent',
                            color: isActive ? '#0A0A0A' : 'var(--text-secondary)',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                    >
                        <Icon size={14} />
                        <span style={{ whiteSpace: 'nowrap' }}>{f.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
