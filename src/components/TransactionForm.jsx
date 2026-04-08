import { AnimatePresence, motion } from 'framer-motion';
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
    compact = false,
}) {
    const navigate = useNavigate();
    const baseTransition = {
        duration: 0.22,
        ease: 'easeOut',
    };

    return (
        <form onSubmit={onSubmit} className={`fab-form-shell${compact ? ' is-compact' : ''}`}>
            <motion.div
                className="fab-type-toggle"
                initial={compact ? { opacity: 0, y: 8 } : false}
                animate={compact ? { opacity: 1, y: 0 } : undefined}
                transition={baseTransition}
            >
                <button
                    type="button"
                    className={`fab-type-btn${type === 'expense' ? ' active expense' : ''}`}
                    onClick={() => onTypeChange('expense')}
                >
                    Despesa
                </button>
                <button
                    type="button"
                    className={`fab-type-btn${type === 'income' ? ' active income' : ''}`}
                    onClick={() => onTypeChange('income')}
                >
                    Receita
                </button>
            </motion.div>

            <motion.div
                className="fab-form-grid"
                initial={compact ? { opacity: 0, y: 10 } : false}
                animate={compact ? { opacity: 1, y: 0 } : undefined}
                transition={{ ...baseTransition, delay: 0.04 }}
            >
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
            </motion.div>

            <motion.div
                className="app-section-card fab-field-card"
                initial={compact ? { opacity: 0, y: 10 } : false}
                animate={compact ? { opacity: 1, y: 0 } : undefined}
                transition={{ ...baseTransition, delay: 0.08 }}
            >
                <div className="app-list-card-main fab-field-card-header">
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
            </motion.div>

            <motion.div
                className="app-section-card fab-field-card"
                initial={compact ? { opacity: 0, y: 10 } : false}
                animate={compact ? { opacity: 1, y: 0 } : undefined}
                transition={{ ...baseTransition, delay: 0.12 }}
            >
                <div className="app-list-card-main fab-field-card-header">
                    <span className="app-inline-icon">
                        <Tag size={16} />
                    </span>
                    <div>
                        <strong>Categoria</strong>
                        <span>Escolha uma categoria para organizar analises, filtros e planejamento.</span>
                    </div>
                </div>

                {availableCategories.length > 0 ? (
                    <motion.div
                        className="fab-categories-grid"
                        layout
                    >
                        {availableCategories.map((category, index) => {
                            const isSelected = selectedCategory?.id === category.id;

                            return (
                                <motion.button
                                    key={category.id}
                                    type="button"
                                    onClick={() => onCategorySelect(category)}
                                    className={`fab-category-tile${isSelected ? ' is-selected' : ''}`}
                                    style={isSelected ? {
                                        borderColor: category.color,
                                        background: `${category.color}18`,
                                    } : undefined}
                                    initial={compact ? { opacity: 0, y: 8 } : false}
                                    animate={compact ? { opacity: 1, y: 0 } : undefined}
                                    transition={{ ...baseTransition, delay: 0.02 * index }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <span className="app-inline-icon" style={{ color: category.color }}>
                                        <CategoryIcon icon={category.icon} size={16} />
                                    </span>
                                    <strong>{category.name}</strong>
                                </motion.button>
                            );
                        })}
                    </motion.div>
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
            </motion.div>

            <AnimatePresence mode="wait">
                {type === 'expense' && (
                    <motion.div
                        key="expense-type"
                        className="app-section-card fab-field-card"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={baseTransition}
                    >
                        <div className="app-list-card-main fab-field-card-header">
                            <span className="app-inline-icon">
                                <CalendarDays size={16} />
                            </span>
                            <div>
                                <strong>Tipo de gasto</strong>
                                <span>Defina como esse valor deve aparecer no controle e nos relatorios.</span>
                            </div>
                        </div>

                        <div className="app-chip-row fab-chip-row-tight">
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
                    </motion.div>
                )}
            </AnimatePresence>

            {showRecurringToggle && (
                <motion.button
                    type="button"
                    className={`fab-recurring-card${isRecurring ? ' is-active' : ''}`}
                    onClick={() => onRecurringChange(!isRecurring)}
                    initial={compact ? { opacity: 0, y: 10 } : false}
                    animate={compact ? { opacity: 1, y: 0 } : undefined}
                    transition={{ ...baseTransition, delay: 0.16 }}
                    whileTap={{ scale: 0.99 }}
                >
                    <span className="fab-highlight-icon">
                        <RefreshCw size={16} />
                    </span>
                    <div>
                        <strong>Repetir mensalmente</strong>
                        <span>Cria tambem um modelo recorrente para os proximos meses.</span>
                    </div>
                </motion.button>
            )}

            <motion.div
                initial={compact ? { opacity: 0, y: 10 } : false}
                animate={compact ? { opacity: 1, y: 0 } : undefined}
                transition={{ ...baseTransition, delay: 0.2 }}
            >
                <Input
                    label="Descricao"
                    placeholder="Ex: Supermercado, salario, academia"
                    value={description}
                    onChange={(event) => onDescriptionChange(event.target.value)}
                    required
                />
            </motion.div>

            <motion.div
                initial={compact ? { opacity: 0, y: 10 } : false}
                animate={compact ? { opacity: 1, y: 0 } : undefined}
                transition={{ ...baseTransition, delay: 0.24 }}
            >
                <Button type="submit" className="btn-primary fab-submit" loading={loading}>
                    {submitLabel}
                </Button>
            </motion.div>
        </form>
    );
}
