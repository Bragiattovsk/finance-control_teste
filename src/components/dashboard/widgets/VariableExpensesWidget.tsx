import React from 'react';
import { useVariableExpensesMetrics } from '@/hooks/useDashboardMetrics';
import { ExpensePieChart } from './ExpensePieChart';

export const VariableExpensesWidget: React.FC = () => {
    const { data, isLoading, error } = useVariableExpensesMetrics();

    return (
        <ExpensePieChart
            data={data}
            isLoading={isLoading}
            error={error}
            title="Despesas Variáveis (Mês Atual)"
            emptyMessage="Nenhuma despesa variável encontrada neste mês"
        />
    );
};
