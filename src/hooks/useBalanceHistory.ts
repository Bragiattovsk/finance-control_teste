import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-hooks';
import { startOfYear, subMonths, startOfMonth, format, parseISO, isSameYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface MonthlyHistoryItem {
    month: string;
    year: number;
    income: number;
    expense: number;
    result: number;
    date: Date;
}

export interface AnnualSummary {
    income: number;
    expense: number;
    result: number;
}

export interface BalanceHistoryData {
    annualSummary: AnnualSummary;
    monthlyHistory: MonthlyHistoryItem[];
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

export function useBalanceHistory(): BalanceHistoryData {
    const { user } = useAuth();
    const [annualSummary, setAnnualSummary] = useState<AnnualSummary>({ income: 0, expense: 0, result: 0 });
    const [monthlyHistory, setMonthlyHistory] = useState<MonthlyHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);

        try {
            const today = new Date();
            const currentYearStart = startOfYear(today);
            const twelveMonthsAgo = startOfMonth(subMonths(today, 11)); // Current month + 11 previous months = 12 months

            // Determine the earliest date we need to fetch
            const earliestDate = currentYearStart < twelveMonthsAgo ? currentYearStart : twelveMonthsAgo;
            
            // Fetch transactions
            const { data, error: supaError } = await supabase
                .from('transactions')
                .select('valor, tipo, data')
                .eq('user_id', user.id)
                .gte('data', earliestDate.toISOString());

            if (supaError) throw supaError;

            const transactions = data || [];

            // Calculate Annual Summary (Current Year)
            const currentYearSummary = transactions.reduce((acc, t) => {
                const tDate = parseISO(t.data);
                if (isSameYear(tDate, today)) {
                    const val = Number(t.valor) || 0;
                    if (t.tipo === 'receita') {
                        acc.income += val;
                    } else {
                        acc.expense += val;
                    }
                }
                return acc;
            }, { income: 0, expense: 0 });

            setAnnualSummary({
                ...currentYearSummary,
                result: currentYearSummary.income - currentYearSummary.expense
            });

            // Calculate Monthly History (Last 12 months)
            const historyMap = new Map<string, MonthlyHistoryItem>();
            
            // Initialize map with last 12 months to ensure all months are present even if no transactions
            for (let i = 0; i < 12; i++) {
                const d = subMonths(today, i);
                const key = format(d, 'yyyy-MM');
                historyMap.set(key, {
                    month: format(d, 'MMM', { locale: ptBR }), // e.g., "dez"
                    year: d.getFullYear(),
                    income: 0,
                    expense: 0,
                    result: 0,
                    date: d
                });
            }

            transactions.forEach(t => {
                const tDate = parseISO(t.data);
                const key = format(tDate, 'yyyy-MM');
                
                if (historyMap.has(key)) {
                    const item = historyMap.get(key)!;
                    const val = Number(t.valor) || 0;
                    if (t.tipo === 'receita') {
                        item.income += val;
                    } else {
                        item.expense += val;
                    }
                    item.result = item.income - item.expense;
                }
            });

            // Convert map to array and sort descending by date
            const historyArray = Array.from(historyMap.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
            
            setMonthlyHistory(historyArray);

        } catch (err) {
            console.error("Error fetching balance history:", err);
            setError(err instanceof Error ? err : new Error("Erro ao buscar histórico de saldo"));
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { annualSummary, monthlyHistory, loading, error, refetch: fetchData };
}
