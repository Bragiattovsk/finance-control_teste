import React from 'react';
import { useFixedExpensesMetrics } from '@/hooks/useDashboardMetrics';
import { ExpensePieChart } from './ExpensePieChart';

export const FixedExpensesWidget: React.FC = () => {
    const { data, isLoading, error } = useFixedExpensesMetrics();

    return (
        <ExpensePieChart
            data={data}
            isLoading={isLoading}
            error={error}
            title="Despesas Fixas"
            emptyMessage="Nenhuma despesa fixa encontrada"
        />
    );
};
