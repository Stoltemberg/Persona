-- Add expense_type column to transactions
-- Values: 'fixed', 'variable', 'lifestyle' (or null for income, though we can just ignore it for income)

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'expense_type') THEN
        ALTER TABLE transactions ADD COLUMN expense_type text;
        ALTER TABLE transactions ADD CONSTRAINT check_expense_type CHECK (expense_type IN ('fixed', 'variable', 'lifestyle'));
    END IF;
END $$;
