import React from 'react';
import { Lock, Star } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

interface PremiumFeatureLockProps {
    children?: React.ReactNode;
    onUpgrade?: () => void;
}

export const PremiumFeatureLock: React.FC<PremiumFeatureLockProps> = ({ children, onUpgrade }) => {
    return (
        <div className="relative w-full h-full min-h-[400px] rounded-lg overflow-hidden border border-border/50">
            {/* Background Content (Blurred) */}
            <div className="absolute inset-0 filter blur-sm pointer-events-none opacity-50 select-none" aria-hidden="true">
                {children}
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-background/30 backdrop-blur-[2px]">
                <Card className="w-full max-w-md mx-4 shadow-lg border-primary/20 bg-background/95 backdrop-blur-md">
                    <CardContent className="flex flex-col items-center text-center p-8 space-y-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                            <Lock className="h-6 w-6 text-primary" />
                        </div>

                        <h3 className="text-xl font-bold tracking-tight">Funcionalidade Exclusiva PRO</h3>

                        <p className="text-muted-foreground text-sm max-w-xs">
                            Tenha controle total dos seus dados com dashboards personalizados e gráficos avançados.
                        </p>

                        <Button
                            onClick={onUpgrade}
                            className="w-full max-w-xs gap-2 mt-4 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 shadow-md hover:shadow-primary/25"
                        >
                            <Star className="h-4 w-4 fill-current" />
                            Fazer Upgrade Agora
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
