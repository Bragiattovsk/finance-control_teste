import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { DashboardWidgetConfig, WidgetLayout, WidgetType, WidgetSize } from '@/types/dashboard';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { arrayMove } from '@dnd-kit/sortable';

export const useDashboardWidgets = () => {
    const { user } = useAuth();
    const [widgets, setWidgets] = useState<DashboardWidgetConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const initializingRef = useRef(false);
    const { toast } = useToast();

    const createDefaultWidgets = useCallback(async () => {
        if (!user) return;
        const defaults = [
            {
                user_id: user.id,
                title: "Despesas por Categoria",
                chart_type: "EXPENSE_BY_CATEGORY",
                layout_config: { i: crypto.randomUUID(), size: 'md' as WidgetSize },
                data_config: {}
            },
            {
                user_id: user.id,
                title: "Receitas vs Despesas",
                chart_type: "REVENUE_VS_EXPENSE",
                layout_config: { i: crypto.randomUUID(), size: 'md' as WidgetSize },
                data_config: {}
            }
        ];

        try {
            const { data, error } = await supabase
                .from("dashboard_widgets")
                .insert(defaults)
                .select();

            if (error) throw error;

            if (data) {
                // Map the response to DashboardWidget type
                const newWidgets = data.map(w => ({
                    ...w,
                    layout_config: w.layout_config as WidgetLayout
                })) as DashboardWidgetConfig[];

                setWidgets(newWidgets);
                toast({ title: "Dashboard Inicializado", description: "Adicionamos alguns gráficos para você começar." });
            }
        } catch (error) {
            console.error("Erro ao criar defaults:", error);
            if (error instanceof Error) {
                setError(error.message);
            }
        } finally {
            initializingRef.current = false;
        }
    }, [user, toast]);

    const fetchWidgets = useCallback(async () => {
        if (!user) return;
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('dashboard_widgets')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: true });

            if (error) throw error;

            // LÓGICA DE SEEDING
            if ((!data || data.length === 0) && !initializingRef.current) {
                initializingRef.current = true;
                await createDefaultWidgets();
            } else {
                const formattedWidgets: DashboardWidgetConfig[] = (data || []).map((w) => {
                    const dataConfig = w.data_config as Record<string, unknown>;
                    const rawLayout = w.layout_config as (Partial<WidgetLayout> & { order?: number });

                    const size: WidgetSize = rawLayout.size ?? (() => {
                        const width = rawLayout.w ?? 6;
                        if (width < 4) return 'sm';
                        if (width < 8) return 'md';
                        if (width < 12) return 'lg';
                        return 'full';
                    })();

                    return {
                        ...w,
                        type: w.chart_type as WidgetType,
                        chart_type: w.chart_type as WidgetType,
                        layout_config: {
                            ...rawLayout,
                            size
                        } as WidgetLayout,
                        data_config: dataConfig
                    };
                });

                // Sort by order if available, otherwise keep SQL order (created_at)
                formattedWidgets.sort((a, b) => {
                    const orderA = (a.layout_config as WidgetLayout & { order?: number }).order;
                    const orderB = (b.layout_config as WidgetLayout & { order?: number }).order;

                    // If both have valid order, compare them
                    if (typeof orderA === 'number' && typeof orderB === 'number') {
                        return orderA - orderB;
                    }
                    // If only A has order, it comes first (or last? usually defined comes first)
                    if (typeof orderA === 'number') return -1;
                    if (typeof orderB === 'number') return 1;
                    
                    // If neither has order, keep original order (0)
                    return 0;
                });

                setWidgets(formattedWidgets);
            }

        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    }, [user, createDefaultWidgets]);

    const saveLayout = useCallback(async (orderedWidgets: DashboardWidgetConfig[]) => {
        try {
            // Optimistic update local state immediately
            setWidgets(orderedWidgets);

            const updates = orderedWidgets.map((w, index) => {
                return supabase
                    .from('dashboard_widgets')
                    .update({
                        layout_config: {
                            ...w.layout_config,
                            size: w.layout_config.size,
                            // Persist order in the json
                            order: index
                        }
                    })
                    .eq('id', w.id);
            });

            await Promise.all(updates);

        } catch (err: unknown) {
            console.error('Error saving layout:', err);
            if (err instanceof Error) {
                setError(err.message);
            }
        }
    }, []);

    const reorderWidgets = useCallback((activeId: string, overId: string) => {
        // Find indices based on either DB id or layout id (i)
        const oldIndex = widgets.findIndex(
            (w) => w.id === activeId || w.layout_config.i === activeId
        );
        const newIndex = widgets.findIndex(
            (w) => w.id === overId || w.layout_config.i === overId
        );

        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
            return;
        }

        const next = arrayMove(widgets, oldIndex, newIndex);

        // Optimistic update
        setWidgets(next);
        // Persist new order
        void saveLayout(next);
    }, [widgets, saveLayout]);

    const addWidget = useCallback(async (
        type: WidgetType,
        size: WidgetSize = 'md',
        options?: { title?: string; config?: { categoryIds?: string[] } }
    ) => {
        try {
            if (!user) return;

            const newWidgetId = crypto.randomUUID();
            
            // New widget goes to the end

            const widgetPayload = {
                id: newWidgetId,
                user_id: user.id,
                title: options?.title || 'Novo Widget',
                chart_type: type,
                layout_config: {
                    size: size,
                    i: newWidgetId,
                },
                data_config: options?.config || {},
            };

            console.log('Enviando Payload:', widgetPayload);

            const { data, error } = await supabase
                .from('dashboard_widgets')
                .insert(widgetPayload)
                .select()
                .single();

            if (error) throw error;

            if (data) {
                const finalWidget: DashboardWidgetConfig = {
                    ...data,
                    id: newWidgetId,
                    type: data.chart_type as WidgetType,
                    chart_type: 'pie', // Default visual type
                    layout_config: data.layout_config as WidgetLayout,
                    data_config: data.data_config as Record<string, unknown>,
                };

                setWidgets(prev => [...prev, finalWidget]);
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            }
        }
    }, [user]);

    const deleteWidget = useCallback(async (id: string) => {
        try {
            // Optimistic Update
            setWidgets(prev => prev.filter(w => w.id !== id));

            const { error } = await supabase
                .from('dashboard_widgets')
                .delete()
                .eq('id', id);

            if (error) throw error;

        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            }
            // Rollback would go here
        }
    }, []);

    useEffect(() => {
        fetchWidgets();
    }, [fetchWidgets]);

    return { widgets, loading, error, saveLayout, addWidget, deleteWidget, reorderWidgets, refresh: fetchWidgets };
};
