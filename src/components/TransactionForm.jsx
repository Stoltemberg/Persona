import { CalendarDays, RefreshCw, Tag, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './Button';
import { Input } from './Input';
import { CategoryIcon } from '../utils/categoryIcons';

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
        <form onSubmit={onSubmit} className="fab-form-shell">
            <div className="app-chip-row" style={{ marginBottom: '0.25rem' }}>
                <button
                    type="button"
                    className={`app-filter-chip${type === 'expense' ? ' is-active danger' : ''}`}
                    onClick={() => onTypeChange('expense')}
                >
                    Despesa
                </button>
                <button
                    type="button"
                    className={`app-filter-chip${type === 'income' ? ' is-active success' : ''}`}
                    onClick={() => onTypeChange('income')}
                >
                    Receita
                </button>
            </div>

            <div className="fab-form-grid">
                <Input
                    label="Valor"
                    placeholder="0,00"
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(event) => onAmountChange(event.target.value)}
                    required
                />
                <Input
                    label="Data"
                    type="date"
                    value={date}
                    onChange={(event) => onDateChange(event.target.value)}
                    required
                />
            </div>

            <div className="app-section-card fab-field-card">
                <div className="app-list-card-main">
                    <span className="app-inline-icon">
                        <Wallet size={16} />
                    </span>
                    <div>
                        <strong>Carteira</strong>
                        <span>Selecione a origem para refletir o saldo corretamente.</span>
                    </div>
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                    <select
                        className="input-field"
                        value={selectedWalletId}
                        onChange={(event) => onWalletChange(event.target.value)}
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
            </div>

            <div className="app-section-card fab-field-card">
                <div className="app-list-card-main">
                    <span className="app-inline-icon">
                        <Tag size={16} />
                    </span>
                    <div>
                        <strong>Categoria</strong>
                        <span>Escolha uma categoria para organizar analises, filtros e planejamento.</span>
                    </div>
                </div>

                {availableCategories.length > 0 ? (
                    <div className="fab-categories-grid">
                        {availableCategories.map((category) => {
                            const isSelected = selectedCategory?.id === category.id;

                            return (
                                <button
                                    key={category.id}
                                    type="button"
                                    onClick={() => onCategorySelect(category)}
                                    className={`fab-category-tile${isSelected ? ' is-selected' : ''}`}
                                    style={isSelected ? {
                                        borderColor: category.color,
                                        background: `${category.color}18`,
                                    } : undefined}
                                >
                                    <span className="app-inline-icon" style={{ color: category.color }}>
                                        <CategoryIcon icon={category.icon} size={16} />
                                    </span>
                                    <strong>{category.name}</strong>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="app-empty-inline">
                        <Tag size={16} />
                        <div>
                            <strong style={{ display: 'block', color: 'var(--text-main)', marginBottom: '0.15rem' }}>Nenhuma categoria criada</strong>
                            <span>Crie categorias para deixar os lancamentos mais consistentes.</span>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => navigate('/categories')}
                            style={{ marginLeft: 'auto' }}
                        >
                            Criar agora
                        </Button>
                    </div>
                )}
            </div>

            {type === 'expense' && (
                <div className="app-section-card fab-field-card">
                    <div className="app-list-card-main">
                        <span className="app-inline-icon">
                            <CalendarDays size={16} />
                        </span>
                        <div>
                            <strong>Tipo de gasto</strong>
                            <span>Defina como esse valor deve aparecer no controle e nos relatorios.</span>
                        </div>
                    </div>

                    <div className="app-chip-row">
                        {[
                            { value: 'fixed', label: 'Fixo' },
                            { value: 'variable', label: 'Variavel' },
                            { value: 'lifestyle', label: 'Lazer' },
                        ].map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                className={`app-filter-chip${expenseType === option.value ? ' is-active danger' : ''}`}
                                onClick={() => onExpenseTypeChange(option.value)}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {showRecurringToggle && (
                <button
                    type="button"
                    className={`fab-recurring-card${isRecurring ? ' is-active' : ''}`}
                    onClick={() => onRecurringChange(!isRecurring)}
                >
                    <span className="fab-highlight-icon">
                        <RefreshCw size={16} />
                    </span>
                    <div>
                        <strong>Repetir mensalmente</strong>
                        <span>Cria tambem um modelo recorrente para os proximos meses.</span>
                    </div>
                </button>
            )}

            <Input
                label="Descricao"
                placeholder="Ex: Supermercado, salario, academia"
                value={description}
                onChange={(event) => onDescriptionChange(event.target.value)}
                required
            />

            <Button type="submit" className="btn-primary fab-submit" loading={loading}>
                {submitLabel}
            </Button>
        </form>
    );
}
