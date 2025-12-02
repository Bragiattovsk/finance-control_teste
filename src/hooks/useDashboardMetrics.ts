import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { startOfMonth, endOfMonth, formatISO } from 'date-fns';

export interface ChartData {
    name: string;
    value: number;
    color: string;
    [key: string]: string | number | undefined;
}

interface TransactionResponse {
    valor: number;
    categories: {
        nome: string;
        cor: string;
    } | null;
}

interface MetricsResult {
    data: ChartData[];
    isLoading: boolean;
    error: Error | null;
}

export function useFixedExpensesMetrics(): MetricsResult {
    const { user } = useAuth();
    const [data, setData] = useState<ChartData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const { data: transactions, error: supabaseError } = await supabase
                    .from('transactions')
                    .select(`
                        valor,
                        categories (
                            nome,
                            cor
                        )
                    `)
                    .eq('user_id', user.id)
                    .eq('tipo', 'despesa')
                    .eq('is_recurrent_copy', true)
                    .returns<TransactionResponse[]>();

                if (supabaseError) throw supabaseError;

                if (!transactions || transactions.length === 0) {
                    setData([]);
                    return;
                }

                // Group by category name
                const grouped = transactions.reduce((acc, curr) => {
                    const categoryName = curr.categories?.nome || 'Sem Categoria';
                    // Fallback color: Gray-400 (#9ca3af) for 'Sem Categoria' or missing color
                    const color = curr.categories?.cor || '#9ca3af';
                    const value = Number(curr.valor);

                    if (!acc[categoryName]) {
                        acc[categoryName] = { value: 0, color };
                    }
                    acc[categoryName].value += value;
                    return acc;
                }, {} as Record<string, { value: number; color: string }>);

                const chartData = Object.entries(grouped).map(([name, { value, color }]) => ({
                    name,
                    value: Number(value),
                    color
                }));

                // Sort by value descending for better visualization
                chartData.sort((a, b) => b.value - a.value);

                setData(chartData);
            } catch (err) {
                console.error('Error fetching fixed expenses:', err);
                setError(err instanceof Error ? err : new Error('Unknown error'));
                setData([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user]);

    return { data, isLoading, error };
}

export function useVariableExpensesMetrics(): MetricsResult {
    const { user } = useAuth();
    const [data, setData] = useState<ChartData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const currentDate = new Date();
                const start = startOfMonth(currentDate);
                const end = endOfMonth(currentDate);

                const { data: transactions, error: supabaseError } = await supabase
                    .from('transactions')
                    .select(`
                        valor,
                        categories (
                            nome,
                            cor
                        )
                    `)
                    .eq('user_id', user.id)
                    .eq('tipo', 'despesa')
                    .eq('is_recurrent_copy', false)
                    .gte('data', formatISO(start))
                    .lte('data', formatISO(end))
                    .returns<TransactionResponse[]>();

                if (supabaseError) throw supabaseError;

                if (!transactions || transactions.length === 0) {
                    setData([]);
                    return;
                }

                // Group by category name
                const grouped = transactions.reduce((acc, curr) => {
                    const categoryName = curr.categories?.nome || 'Sem Categoria';
                    // Fallback color: Gray-400 (#9ca3af) for 'Sem Categoria' or missing color
                    const color = curr.categories?.cor || '#9ca3af';
                    const value = Number(curr.valor);

                    if (!acc[categoryName]) {
                        acc[categoryName] = { value: 0, color };
                    }
                    acc[categoryName].value += value;
                    return acc;
                }, {} as Record<string, { value: number; color: string }>);

                const chartData = Object.entries(grouped).map(([name, { value, color }]) => ({
                    name,
                    value: Number(value),
                    color
                }));

                // Sort by value descending
                chartData.sort((a, b) => b.value - a.value);

                setData(chartData);
            } catch (err) {
                console.error('Error fetching variable expenses:', err);
                setError(err instanceof Error ? err : new Error('Unknown error'));
                setData([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user]);

    return { data, isLoading, error };
}
