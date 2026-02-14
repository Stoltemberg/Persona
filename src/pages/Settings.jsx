import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Bell, Shield, Wallet, Moon, Sun, ChevronRight, LogOut } from 'lucide-react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';

export default function Settings() {
    const { profile, user, signOut } = useAuth();
    const { changeTheme } = useTheme();
    const { addToast } = useToast();
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [fullName, setFullName] = useState(profile?.full_name || '');

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id);
        if (!error) {
            addToast('Perfil atualizado', 'success');
            setIsEditProfileOpen(false);
        }
    };

    const SettingItem = ({ icon: Icon, label, value, onClick, color = '#007AFF' }) => (
        <div
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                padding: '1rem',
                background: 'white',
                cursor: 'pointer',
                borderBottom: '1px solid var(--divider-subtle)'
            }}
        >
            <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '1rem'
            }}>
                <Icon size={18} color="white" />
            </div>
            <div style={{ flex: 1, fontSize: '1rem', fontWeight: '500' }}>{label}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                {value && <span style={{ fontSize: '0.9rem' }}>{value}</span>}
                <ChevronRight size={20} color="var(--text-tertiary)" />
            </div>
        </div>
    );

    return (
        <div className="container fade-in" style={{ paddingBottom: '4rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '2rem' }}>Ajustes</h1>

            {/* Profile Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', padding: '1rem', background: 'white', borderRadius: '12px' }}>
                <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'var(--bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    fontWeight: '600',
                    color: 'var(--text-secondary)'
                }}>
                    {profile?.full_name?.[0] || user?.email?.[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>{profile?.full_name || 'Usuário'}</h2>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{user?.email}</p>
                </div>
                <Button variant="ghost" onClick={() => setIsEditProfileOpen(true)} style={{ color: 'var(--color-blue)' }}>Editar</Button>
            </div>

            {/* List Groups */}
            <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '2rem', background: 'white' }}>
                <SettingItem icon={Wallet} label="Assinatura" value="Gratuito" color="#34C759" />
                <SettingItem icon={Bell} label="Notificações" color="#FF3B30" />
            </div>

            <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '2rem', background: 'white' }}>
                <SettingItem icon={Sun} label="Tema Claro" onClick={() => changeTheme('light')} color="#FF9500" />
                <SettingItem icon={Moon} label="Tema Escuro" onClick={() => changeTheme('dark')} color="#5856D6" />
            </div>

            <Button
                onClick={signOut}
                style={{
                    width: '100%',
                    justifyContent: 'center',
                    color: 'var(--color-red)',
                    background: 'white',
                    padding: '1rem',
                    borderRadius: '12px',
                    fontWeight: '600'
                }}
            >
                Sair da Conta
            </Button>

            <Modal isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} title="Editar Perfil">
                <form onSubmit={handleUpdateProfile}>
                    <Input label="Nome" value={fullName} onChange={e => setFullName(e.target.value)} />
                    <Button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Salvar</Button>
                </form>
            </Modal>
        </div>
    );
}
