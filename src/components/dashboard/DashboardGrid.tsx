import { useState, useEffect } from 'react';
import { WidgetRenderer } from './WidgetRegistry';
import { Button } from '@/components/ui/button';
import { Loader2, X, LayoutDashboard, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConfirmModal } from '@/components/ConfirmModal';
import { WidgetSize, DashboardWidgetConfig } from '@/types/dashboard';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    TouchSensor,
    MouseSensor
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SIZE_MAP: Record<WidgetSize, string> = {
    'sm': 'col-span-1',
    'md': 'col-span-1 md:col-span-1 lg:col-span-2',
    'lg': 'col-span-1 md:col-span-2 lg:col-span-3',
    'full': 'col-span-1 md:col-span-2 lg:col-span-4'
};

interface SortableWidgetProps {
    widget: DashboardWidgetConfig;
    isEditing: boolean;
    isPro: boolean;
    onRemoveRequest: (id: string) => void;
    currentDate: Date;
}

function SortableWidget({ widget, isEditing, isPro, onRemoveRequest, currentDate }: SortableWidgetProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: widget.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
    };

    const sizeClass = SIZE_MAP[widget.layout_config.size || 'md'];

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "bg-card dark:bg-gray-800 rounded-xl shadow-sm border border-border/50 overflow-hidden flex flex-col relative group transition-shadow hover:shadow-md h-full",
                sizeClass,
                isEditing && "ring-2 ring-primary/20",
                isDragging && "opacity-50 shadow-xl ring-2 ring-primary scale-[1.02]"
            )}
        >
            {isEditing && (
                <div className="absolute top-2 right-2 z-20 flex gap-1 bg-background/80 backdrop-blur-sm rounded-md p-1 shadow-sm border border-border/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        {...attributes}
                        {...listeners}
                        className="p-1 hover:bg-accent rounded cursor-grab active:cursor-grabbing text-muted-foreground"
                        title="Arrastar widget"
                    >
                        <GripVertical className="h-4 w-4" />
                    </button>
                    {isPro && (
                        <button
                            onClick={() => onRemoveRequest(widget.id)}
                            className="p-1 hover:bg-red-500/10 rounded text-muted-foreground hover:text-red-500 transition-colors"
                            title="Remover widget"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            )}
            <div className="flex-1 min-h-0 p-4">
                <WidgetRenderer widget={widget} currentDate={currentDate} />
            </div>
        </div>
    );
}

interface DashboardGridProps {
    widgets: DashboardWidgetConfig[];
    loading: boolean;
    isEditing: boolean;
    isPro: boolean;
    onAddWidget: () => void;
    onRemoveWidget: (id: string) => void;
    onReorderWidgets: (activeId: string, overId: string) => void;
    currentDate: Date;
}

export function DashboardGrid({ widgets, loading, isEditing, isPro, onAddWidget, onRemoveWidget, onReorderWidgets, currentDate }: DashboardGridProps) {

    const [mounted, setMounted] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    // Sensors for drag and drop
    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 5, // Enable drag only after moving 5px
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250, // Delay for touch to distinguish from scroll
                tolerance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleRemoveRequest = (widgetId: string) => {
        setItemToDelete(widgetId);
    };

    const confirmRemove = () => {
        if (itemToDelete) {
            onRemoveWidget(itemToDelete);
            setItemToDelete(null);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            onReorderWidgets(active.id as string, over.id as string);
        }
    };

    if (loading || !mounted) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (widgets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-slate-700 rounded-lg bg-slate-900/50">
                <LayoutDashboard className="h-12 w-12 text-slate-500 mb-4" />
                <p className="text-slate-400 mb-4">Seu painel está vazio.</p>
                <Button
                    onClick={onAddWidget}
                    className="bg-purple-600 text-white hover:bg-purple-700 transition"
                >
                    + Adicionar Widget
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={widgets.map(w => w.id)}
                    strategy={rectSortingStrategy}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[minmax(300px,auto)] content-start items-start">
                        {widgets.map((widget) => (
                            <SortableWidget
                                key={widget.id}
                                widget={widget}
                                isEditing={isEditing}
                                isPro={isPro}
                                onRemoveRequest={handleRemoveRequest}
                                currentDate={currentDate}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            <ConfirmModal
                isOpen={!!itemToDelete}
                onOpenChange={(open) => !open && setItemToDelete(null)}
                onConfirm={confirmRemove}
                title="Remover Widget"
                description="Tem certeza que deseja remover este widget do seu dashboard?"
            />
        </div>
    );
}
