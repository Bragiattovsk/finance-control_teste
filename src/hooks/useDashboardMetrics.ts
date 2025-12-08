import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-hooks';
import { useProject } from '@/contexts/project-hooks';
import { applyProjectScope } from '@/lib/supabase-helpers';
import { startOfMonth, endOfMonth, formatISO, subMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

export interface BalanceHistoryPoint {
    month: string;
    balance: number;
}

interface DashboardAnalytics {
    income: number;
    expense: number;
    monthlyBalance: number;
    walletBalance: number;
    balanceHistory: BalanceHistoryPoint[];
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

export function useDashboardAnalytics(currentDate: Date): DashboardAnalytics {
    const { user } = useAuth();
    const { selectedProject } = useProject();
    const [income, setIncome] = useState(0);
    const [expense, setExpense] = useState(0);
    const [monthlyBalance, setMonthlyBalance] = useState(0);
    const [walletBalance, setWalletBalance] = useState(0);
    const [balanceHistory, setBalanceHistory] = useState<BalanceHistoryPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchMonthlyData = async (date: Date) => {
        if (!user) return { income: 0, expense: 0, balance: 0 };
        const start = startOfMonth(date);
        const end = endOfMonth(date);
        
        let query = supabase
            .from('transactions')
            .select('valor, tipo')
            .eq('user_id', user.id)
            .gte('data', formatISO(start))
            .lte('data', formatISO(end));
            
        query = applyProjectScope(query, selectedProject);
            
        const { data, error: supaError } = await query;
        
        if (supaError) throw supaError;
        let inc = 0;
        let exp = 0;
        (data || []).forEach((t: { valor: number; tipo: 'receita' | 'despesa' }) => {
            const v = Number(t.valor) || 0;
            if (t.tipo === 'receita') inc += v; else exp += v;
        });
        return { income: inc, expense: exp, balance: inc - exp };
    };

    const fetchGlobalBalance = async () => {
        if (!user) return 0;
        try {
            // We use direct query to support project filtering correctly
            // RPC might not support project_id yet
            let query = supabase
                .from('transactions')
                .select('valor, tipo')
                .eq('user_id', user.id);
                
            query = applyProjectScope(query, selectedProject);
            
            const { data, error: supaError } = await query;
            
            if (supaError) throw supaError;
            let inc = 0;
            let exp = 0;
            (data || []).forEach((t: { valor: number; tipo: 'receita' | 'despesa' }) => {
                const v = Number(t.valor) || 0;
                if (t.tipo === 'receita') inc += v; else exp += v;
            });
            return inc - exp;
        } catch (err) {
            console.error('Error fetching global balance:', err);
            return 0;
        }
    };

    const fetchBalanceHistory = async () => {
        if (!user) return [];
        try {
            // Calculate history client-side to support project filtering
            const endDate = endOfMonth(currentDate);
            const startDate = startOfMonth(subMonths(currentDate, 11)); // Last 12 months including current

            let query = supabase
                .from('transactions')
                .select('valor, tipo, data')
                .eq('user_id', user.id)
                .gte('data', formatISO(startDate))
                .lte('data', formatISO(endDate));

            query = applyProjectScope(query, selectedProject);

            const { data, error } = await query;
            if (error) throw error;

            const transactions = data || [];
            
            // Group by month
            const monthlyData = new Map<string, number>();
            
            // Initialize all months with 0
            for (let i = 0; i < 12; i++) {
                const d = subMonths(currentDate, i);
                const monthKey = format(d, 'yyyy-MM');
                monthlyData.set(monthKey, 0);
            }

            transactions.forEach(t => {
                const date = t.data.slice(0, 7); // YYYY-MM
                const val = Number(t.valor);
                const current = monthlyData.get(date) || 0;
                
                if (t.tipo === 'receita') {
                    monthlyData.set(date, current + val);
                } else {
                    monthlyData.set(date, current - val);
                }
            });

            // Convert to array and sort
            const history: BalanceHistoryPoint[] = Array.from(monthlyData.entries())
                .map(([key, balance]) => {
                    // Format month name (e.g. "Dez")
                    const [year, month] = key.split('-');
                    const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
                    return {
                        month: format(dateObj, 'MMM', { locale: ptBR }), // Short month name
                        balance
                    };
                })
                .reverse(); // Show oldest to newest? Or match UI expectation?
                // The UI usually expects chronological order for charts
                // My loop was backwards (0 to 11 months ago), but Map preserves insertion order?
                // No, I inserted from current backwards. So map has [current, current-1, ...]
                // .reverse() will make it [current-11, ..., current] which is correct for charts.

            return history;

        } catch (err) {
            console.error('Error fetching balance history:', err);
            return [];
        }
    };

    const fetchAll = async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const [monthly, globalBal, history] = await Promise.all([
                fetchMonthlyData(currentDate),
                fetchGlobalBalance(),
                fetchBalanceHistory()
            ]);
            setIncome(monthly.income);
            setExpense(monthly.expense);
            setMonthlyBalance(monthly.balance);
            setWalletBalance(globalBal);
            setBalanceHistory(history);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Erro ao carregar métricas'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, currentDate, selectedProject]);

    return { income, expense, monthlyBalance, walletBalance, balanceHistory, loading, error, refetch: fetchAll };
}
