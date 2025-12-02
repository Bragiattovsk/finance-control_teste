import { ComponentType } from 'react';

export type WidgetType =
  | 'REVENUE_VS_EXPENSE'
  | 'EXPENSE_BY_CATEGORY'
  | 'CUSTOM_EXPENSE';

export type ChartType = 'pie' | 'bar' | 'line' | 'metric'

export type WidgetSize = 'sm' | 'md' | 'lg' | 'full';

export interface WidgetLayout {
    i: string
    /** @deprecated Use size instead */
    x?: number
    /** @deprecated Use size instead */
    y?: number
    /** @deprecated Use size instead */
    w?: number
    /** @deprecated Use size instead */
    h?: number
    /** @deprecated Use size instead */
    minW?: number
    /** @deprecated Use size instead */
    minH?: number
    size: WidgetSize
}

// Grid widget used by react-grid-layout
export interface DashboardWidget {
    i: string
    /** @deprecated Use size instead */
    x?: number
    /** @deprecated Use size instead */
    y?: number
    /** @deprecated Use size instead */
    w?: number
    /** @deprecated Use size instead */
    h?: number
    /** @deprecated Use size instead */
    minW?: number
    /** @deprecated Use size instead */
    minH?: number
    static?: boolean
    type: WidgetType
    size: WidgetSize
    title?: string
    props?: Record<string, unknown>
}

// Database-stored widget configuration
export interface DashboardWidgetConfig {
    id: string
    title: string
    type: WidgetType
    chart_type: WidgetType
    layout_config: WidgetLayout
    data_config: Record<string, unknown>
    created_at?: string
    user_id?: string
}

export interface WidgetRegistryItem {
    component: ComponentType<Record<string, unknown>>;
}
