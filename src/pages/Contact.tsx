import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Bug, HelpCircle } from 'lucide-react';

export function ContactPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-zinc-950 p-6 md:p-12 font-sans antialiased">
            <div className="max-w-5xl mx-auto">
                <Button 
                    variant="ghost" 
                    className="mb-8 text-zinc-400 hover:text-white pl-0 hover:bg-transparent" 
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                </Button>

                <h1 className='text-3xl font-bold text-white mb-2'>Fale Conosco</h1>
                <p className="text-zinc-400">Estamos aqui para ajudar você a ter o controle financeiro total.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                    {/* Coluna 1: Canais */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                            <Mail className="h-5 w-5 text-purple-400" /> Canais de Atendimento
                        </h2>

                        <Card className="bg-zinc-900/50 border-white/10 hover:border-purple-500/50 transition-colors">
                            <CardHeader>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-purple-500/10">
                                        <Mail className="h-5 w-5 text-purple-400" />
                                    </div>
                                    <CardTitle className="text-lg text-zinc-50">Suporte Técnico</CardTitle>
                                </div>
                                <p className="text-zinc-400 text-sm">Dúvidas sobre sua conta ou pagamentos.</p>
                            </CardHeader>
                            <CardContent>
                                <a href="mailto:suporte.lumiefinance@gmail.com" className="text-purple-400 hover:text-purple-300 text-sm font-medium">
                                    suporte.lumiefinance@gmail.com
                                </a>
                            </CardContent>
                        </Card>

                        <Card className="bg-zinc-900/50 border-white/10 hover:border-purple-500/50 transition-colors">
                            <CardHeader>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 rounded-lg bg-amber-500/10">
                                        <Bug className="h-5 w-5 text-amber-400" />
                                    </div>
                                    <CardTitle className="text-lg text-zinc-50">Bugs e Sugestões</CardTitle>
                                </div>
                                <p className="text-zinc-400 text-sm">Encontrou um erro? Use o widget de feedback no canto da tela para enviar logs automaticamente.</p>
                            </CardHeader>
                        </Card>
                    </div>

                    {/* Coluna 2: FAQ */}
                    <div>
                        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                            <HelpCircle className="h-5 w-5 text-purple-400" /> Perguntas Frequentes
                        </h2>
                        
                        <div className="space-y-8">
                            <div className="space-y-2">
                                <h3 className="text-lg font-medium text-zinc-50">Tenho garantia?</h3>
                                <p className="text-zinc-400 leading-relaxed">
                                    Sim. Se não gostar, você tem 7 dias para pedir reembolso total direto pelo painel.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-lg font-medium text-zinc-50">Como cancelo?</h3>
                                <p className="text-zinc-400 leading-relaxed">
                                    Sem burocracia. A opção de cancelar está na aba Configurações e é efetivada na hora.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-lg font-medium text-zinc-50">Meus dados estão seguros?</h3>
                                <p className="text-zinc-400 leading-relaxed">
                                    Sim. Usamos criptografia de ponta a ponta e não vendemos seus dados para terceiros.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
