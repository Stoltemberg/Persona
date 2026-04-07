import { Button } from './Button';
import { Input } from './Input';
import { useNavigate } from 'react-router-dom';

export function TransactionForm({
    amount,
    onAmountChange,
    date,
    onDateChange,
    type,
    onTypeChange,
    wallets,
    selectedWalletId,
    onWalletChange,
    availableCategories,
    selectedCategory,
    onCategorySelect,
    expenseType,
    onExpenseTypeChange,
    showRecurringToggle = false,
    isRecurring = false,
    onRecurringChange,
    description,
    onDescriptionChange,
    onSubmit,
    submitLabel,
    loading,
}) {
    const navigate = useNavigate();

    return (
        <form onSubmit={onSubmit}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <Button
                    type="button"
                    className={type === 'expense' ? 'btn-primary' : 'btn-ghost'}
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        background: type === 'expense' ? 'var(--color-danger)' : undefined,
                        border: type === 'expense' ? 'none' : undefined,
                        color: type === 'expense' ? '#fff' : undefined,
                    }}
                    onClick={() => onTypeChange('expense')}
                >
                    Despesa
                </Button>
                <Button
                    type="button"
                    className={type === 'income' ? 'btn-primary' : 'btn-ghost'}
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        background: type === 'income' ? 'var(--color-success)' : undefined,
                        border: type === 'income' ? 'none' : undefined,
                        color: type === 'income' ? '#fff' : undefined,
                    }}
                    onClick={() => onTypeChange('income')}
                >
                    Receita
                </Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Input
                    label="Valor"
                    placeholder="0,00"
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => onAmountChange(e.target.value)}
                    required
                />
                <Input
                    label="Data"
                    type="date"
                    value={date}
                    onChange={(e) => onDateChange(e.target.value)}
                    required
                />
            </div>

            <div className="input-group">
                <label className="input-label">Carteira</label>
                <select
                    className="input-field"
                    value={selectedWalletId}
                    onChange={(e) => onWalletChange(e.target.value)}
                    required
                >
                    {wallets.length === 0 ? (
                        <option value="">Cadastre uma carteira primeiro</option>
                    ) : (
                        wallets.map((wallet) => (
                            <option key={wallet.id} value={wallet.id}>
                                {wallet.name}
                            </option>
                        ))
                    )}
                </select>
            </div>

            <div className="input-group" style={{ marginBottom: '1rem' }}>
                <label className="input-label">Categoria</label>
                {availableCategories.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.5rem' }}>
                        {availableCategories.map((cat) => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => onCategorySelect(cat)}
                                className={!selectedCategory || selectedCategory.id !== cat.id ? 'surface-secondary' : ''}
                                style={{
                                    padding: '0.5rem',
                                    borderRadius: '8px',
                                    background: selectedCategory?.id === cat.id ? `${cat.color}40` : undefined,
                                    border: selectedCategory?.id === cat.id ? `1px solid ${cat.color}` : '1px solid transparent',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.2rem',
                                    transition: 'all 0.2s',
                                    textAlign: 'center',
                                    color: 'var(--text-main)',
                                }}
                            >
                                <div style={{ fontSize: '1.5rem' }}>{cat.icon}</div>
                                <div style={{ fontSize: '0.7rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                                    {cat.name}
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="surface-secondary" style={{ padding: '1rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        <p>Nenhuma categoria criada.</p>
                        <Button
                            type="button"
                            variant="ghost"
                            className="btn-primary"
                            style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}
                            onClick={() => navigate('/categories')}
                        >
                            Criar agora
                        </Button>
                    </div>
                )}
            </div>

            {type === 'expense' && (
                <div className="input-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 500 }}>
                        Tipo de gasto <span style={{ color: '#f64f59' }}>*</span>
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                        {[
                            { value: 'fixed', label: 'Fixo', icon: 'F' },
                            { value: 'variable', label: 'Variável', icon: 'V' },
                            { value: 'lifestyle', label: 'Lazer', icon: 'L' },
                        ].map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => onExpenseTypeChange(option.value)}
                                className={expenseType !== option.value ? 'surface-secondary' : ''}
                                style={{
                                    padding: '0.75rem 0.5rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    background: expenseType === option.value ? 'rgba(246, 79, 89, 0.2)' : undefined,
                                    border: expenseType === option.value ? '1px solid #f64f59' : '1px solid transparent',
                                    transition: 'all 0.2s',
                                    color: 'var(--text-main)',
                                }}
                            >
                                <div style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>{option.icon}</div>
                                <div style={{ fontSize: '0.8rem', fontWeight: expenseType === option.value ? 600 : 400 }}>
                                    {option.label}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {showRecurringToggle && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                    <input
                        type="checkbox"
                        id="recurring"
                        checked={isRecurring}
                        onChange={(e) => onRecurringChange(e.target.checked)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label htmlFor="recurring" style={{ cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}>
                        Repetir mensalmente?
                    </label>
                </div>
            )}

            <Input
                label="Descrição"
                placeholder="Ex: Supermercado"
                value={description}
                onChange={(e) => onDescriptionChange(e.target.value)}
                required
            />

            <Button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }} loading={loading}>
                {submitLabel}
            </Button>
        </form>
    );
}
