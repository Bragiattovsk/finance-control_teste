import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-hooks';
import { DashboardWidget, WidgetType } from '@/types/dashboard';
import { useToast } from '@/hooks/use-toast';
import debounce from 'lodash.debounce';

export const DEFAULT_LAYOUT: DashboardWidget[] = [
    { i: 'exp-cat', x: 0, y: 0, w: 6, h: 4, type: 'EXPENSE_BY_CATEGORY', static: false, size: 'md' },
    { i: 'rev-vs-exp', x: 6, y: 0, w: 6, h: 4, type: 'REVENUE_VS_EXPENSE', static: false, size: 'md' }
];

export function useDashboardLayout() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [layout, setLayout] = useState<DashboardWidget[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // Ref to store the last successfully saved layout for rollback
    const lastSavedLayout = useRef<DashboardWidget[]>([]);

    const saveLayoutToDb = useCallback(async (newLayout: DashboardWidget[]) => {
        if (!user) return;
        
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ dashboard_layout: newLayout })
                .eq('user_id', user.id);

            if (error) throw error;
            
            lastSavedLayout.current = newLayout;
        } catch (error) {
            console.error('Error saving layout:', error);
            toast({
                title: "Erro ao salvar layout",
                description: "Não foi possível salvar as alterações. Revertendo...",
                variant: "destructive",
            });
            // Revert to last saved layout
            setLayout(lastSavedLayout.current);
        } finally {
            setIsSaving(false);
        }
    }, [user, toast]);

    // Ref to hold the latest version of saveLayoutToDb
    const saveLayoutToDbRef = useRef(saveLayoutToDb);

    useEffect(() => {
        saveLayoutToDbRef.current = saveLayoutToDb;
    }, [saveLayoutToDb]);

    // Create debounced save function
    const debouncedSave = useMemo(
        () => debounce((newLayout: DashboardWidget[]) => {
            saveLayoutToDbRef.current(newLayout);
        }, 2000),
        []
    );

    // Initial Fetch
    useEffect(() => {
        if (!user) return;

        const fetchLayout = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('dashboard_layout')
                    .eq('user_id', user.id)
                    .single();

                if (error) throw error;

                // Verificação explícita para corrigir bug do "Zumbi"
                // Se data.dashboard_layout for null, é a primeira vez -> usa DEFAULT
                // Se for array (mesmo vazio), usa o array
                if (data.dashboard_layout === null) {
                    // Primeira vez do usuário
                    setLayout(DEFAULT_LAYOUT);
                    lastSavedLayout.current = DEFAULT_LAYOUT;
                    saveLayoutToDb(DEFAULT_LAYOUT);
                } else if (Array.isArray(data.dashboard_layout)) {
                    // Usuário já tem layout salvo (pode ser vazio [])
                    setLayout(data.dashboard_layout);
                    lastSavedLayout.current = data.dashboard_layout;
                } else {
                    // Fallback de segurança
                    setLayout(DEFAULT_LAYOUT);
                    lastSavedLayout.current = DEFAULT_LAYOUT;
                }
            } catch (error) {
                console.error('Error fetching layout:', error);
                toast({
                    title: "Erro ao carregar layout",
                    description: "Usando layout padrão.",
                    variant: "destructive",
                });
                setLayout(DEFAULT_LAYOUT);
                lastSavedLayout.current = DEFAULT_LAYOUT;
            } finally {
                setIsLoading(false);
            }
        };

        fetchLayout();
        
        // Cleanup debounce on unmount
        return () => {
            debouncedSave.cancel();
        };
    }, [user, debouncedSave, saveLayoutToDb, toast]);

    const saveLayout = useCallback((newLayout: DashboardWidget[]) => {
        setLayout(newLayout); // Optimistic update
        debouncedSave(newLayout);
    }, [debouncedSave]);

    const addWidget = useCallback(async (type: WidgetType, config?: { categoryIds: string[], title?: string }) => {
        if (!user) return

        try {
            const newWidgetId = crypto.randomUUID()

            // Alterna colunas de forma simples
            const x = (layout.length % 2) * 6
            const y = Infinity
            const w = 6
            const h = 4

            const title = (type === 'CUSTOM_EXPENSE')
                ? (config?.title || 'Gráfico Personalizado')
                : 'Novo Widget'

            const dataConfig = config ? { ...config } : {}

            const widgetPayload = {
                id: newWidgetId,
                user_id: user.id,
                title,
                chart_type: type as unknown as string,
                layout_config: { i: newWidgetId, x, y, w, h },
                data_config: dataConfig,
            }

            console.log('Enviando Payload:', widgetPayload);

            const { error } = await supabase
                .from('dashboard_widgets')
                .insert(widgetPayload)

            if (error) throw error

            const localWidget: DashboardWidget = {
                i: newWidgetId,
                x,
                y,
                w,
                h,
                type,
                static: false,
                size: 'md',
                title: (type === 'CUSTOM_EXPENSE') ? title : undefined,
                props: (type === 'CUSTOM_EXPENSE') ? { categoryIds: config?.categoryIds || [], title } : undefined,
            }

            const newLayout = [...layout, localWidget]
            setLayout(newLayout)
            debouncedSave(newLayout)
        } catch (err) {
            console.error('Error adding widget:', err)
            toast({
                title: 'Erro ao adicionar widget',
                description: 'Não foi possível criar o widget.',
                variant: 'destructive',
            })
        }
    }, [user, layout, debouncedSave, toast])

    const removeWidget = useCallback((widgetId: string) => {
        setLayout((prev) => {
            const newLayout = prev.filter((item) => item.i !== widgetId);
            debouncedSave(newLayout);
            return newLayout;
        });
    }, [debouncedSave]);

    return {
        layout,
        isLoading,
        isSaving,
        saveLayout,
        addWidget,
        removeWidget,
        DEFAULT_LAYOUT
    };
}
