import React from 'react';
import { User, Users, Heart } from 'lucide-react';
import { useAuth } from '../features/auth/useAuth';
import { Skeleton } from './Skeleton';
import clsx from 'clsx';

export function PartnerFilter({ activeFilter, onFilterChange, className }) {
    const { profile, partnerProfile } = useAuth();

    // If the user has a partner but it's not loaded yet, show a skeleton
    if (profile?.partner_id && !partnerProfile) {
        return (
            <div className={clsx("partner-filter-bar", className)}>
                <Skeleton width="60px" height="32px" style={{ borderRadius: 'var(--radius-pill)' }} />
                <Skeleton width="80px" height="32px" style={{ borderRadius: 'var(--radius-pill)' }} />
                <Skeleton width="70px" height="32px" style={{ borderRadius: 'var(--radius-pill)' }} />
            </div>
        );
    }

    if (!partnerProfile) return null;

    const filters = [
        { id: 'me', label: 'Eu', icon: User },
        { id: 'partner', label: partnerProfile.nickname || 'Parceiro', icon: Heart },
        { id: 'all', label: 'Casal', icon: Users },
    ];

    return (
        <div className={clsx("partner-filter-bar", className)} role="radiogroup" aria-label="Filtro de parceiro">
            {filters.map((f) => {
                const Icon = f.icon;
                const isActive = activeFilter === f.id;
                
                return (
                    <button
                        key={f.id}
                        onClick={() => onFilterChange(f.id)}
                        className={clsx("partner-filter-btn", isActive && "active")}
                        aria-pressed={isActive}
                        role="radio"
                        aria-checked={isActive}
                    >
                        <Icon size={14} aria-hidden="true" />
                        <span style={{ textWrap: 'balance' }}>{f.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
