const RECURRING_TEMPLATE_BASE_FIELDS = [
    'id',
    'description',
    'amount',
    'type',
    'category',
    'expense_type',
    'frequency',
    'next_due_date',
    'last_generated_date',
    'profile_id',
];

export const getRecurringTemplateSelectFields = ({ includeWalletId = true } = {}) => (
    includeWalletId
        ? [...RECURRING_TEMPLATE_BASE_FIELDS, 'wallet_id'].join(', ')
        : RECURRING_TEMPLATE_BASE_FIELDS.join(', ')
);

export const getRecurringOwnerProfileId = (templateOrBill, fallbackProfileId) => (
    templateOrBill?.profile_id || fallbackProfileId
);

export const buildRecurringTransactionPayload = (templateOrBill, fallbackProfileId, date = new Date().toISOString()) => ({
    description: templateOrBill.description,
    amount: templateOrBill.amount,
    type: templateOrBill.type,
    category: templateOrBill.category,
    wallet_id: templateOrBill.wallet_id,
    expense_type: templateOrBill.expense_type,
    date,
    profile_id: getRecurringOwnerProfileId(templateOrBill, fallbackProfileId),
});

export const getNextRecurringDueDate = (currentDueDate, frequency) => {
    const nextDate = new Date(currentDueDate);

    if (frequency === 'weekly') {
        nextDate.setDate(nextDate.getDate() + 7);
        return nextDate;
    }

    nextDate.setMonth(nextDate.getMonth() + 1);
    return nextDate;
};
