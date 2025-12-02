import React from 'react';
import { DashboardWidgetConfig, WidgetType, ChartType } from '@/types/dashboard';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
// Removed unused chart imports after standardization
// Removed unused fixed/variable widgets after type standardization
import { CustomChartWidget } from './widgets/CustomChartWidget';
import { CustomExpenseWidget } from './widgets/CustomExpenseWidget';

// --- Placeholder Components ---

// Removed placeholder widgets after type standardization

// --- Registry ---

// Note: We use `any` here because different widgets have different props, 
// and we want to keep the registry generic.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const WIDGET_REGISTRY: Record<WidgetType, React.ComponentType<any>> = {
    REVENUE_VS_EXPENSE: CustomChartWidget,
    EXPENSE_BY_CATEGORY: CustomChartWidget,
    CUSTOM_EXPENSE: CustomExpenseWidget,
};

const FallbackWidget = ({ type }: { type: string }) => (
    <Card className="h-full border-yellow-500 bg-yellow-50/10">
        <CardContent className="flex flex-col items-center justify-center h-full p-6 text-center text-yellow-600">
            <AlertCircle className="h-8 w-8 mb-2" />
            <p className="font-semibold">Widget Desconhecido</p>
            <p className="text-xs opacity-70">Tipo: {type}</p>
        </CardContent>
    </Card>
);

// --- Renderer ---

interface WidgetRendererProps {
    widget: DashboardWidgetConfig;
    currentDate: Date;
}

export const WidgetRenderer = ({ widget, currentDate }: WidgetRendererProps) => {
    const typeKey = widget.chart_type as WidgetType;
    const Component = WIDGET_REGISTRY[typeKey];

    if (!Component) {
        return (
            <div className="h-full w-full">
                <FallbackWidget type={widget.type} />
            </div>
        );
    }

    // Check if it's a CustomChartWidget (either by Enum or simple type)
    const isCustomChart = typeKey === 'REVENUE_VS_EXPENSE' || typeKey === 'EXPENSE_BY_CATEGORY';

    if (typeKey === 'CUSTOM_EXPENSE') {
        const props = (widget as unknown as { props?: Record<string, unknown>; title?: string }).props || {}
        const title = (widget as unknown as { title?: string }).title || (props['title'] as string) || 'Gráfico Personalizado'
        const categoryIds = Array.isArray(props['categoryIds']) ? (props['categoryIds'] as string[]) : []
        return (
            <div className="h-full w-full">
                <CustomExpenseWidget categoryIds={categoryIds} title={title} currentDate={currentDate} />
            </div>
        )
    }

    if (isCustomChart) {
        const visualChartType: ChartType = typeKey === 'REVENUE_VS_EXPENSE' ? 'bar' : 'pie';
        return (
            <div className="h-full w-full">
                <Component
                    title={widget.title}
                    chartType={visualChartType}
                    dataConfig={widget.data_config}
                    currentDate={currentDate}
                />
            </div>
        );
    }

    return (
        <div className="h-full w-full">
            <Component />
        </div>
    );
};
