import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function AboutPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-zinc-950 p-6 md:p-12 font-sans antialiased flex flex-col items-center">
            <div className="w-full max-w-3xl">
                <Button 
                    variant="ghost" 
                    className="mb-8 text-zinc-400 hover:text-white pl-0 hover:bg-transparent" 
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                </Button>

                <h1 className='text-4xl font-bold text-white mb-12'>Sobre a Lumie</h1>
                
                <div className="relative">
                    {/* Manifesto Style */}
                    <div className="border-l-4 border-purple-500 pl-6 py-2 md:pl-10 space-y-6 text-lg leading-relaxed text-zinc-300">
                        <p>
                            Durante anos, trabalhei como freelancer e desenvolvedor. Todo mês era a mesma história: o dinheiro do projeto caía na conta, eu pagava o aluguel, comprava um equipamento e, no final, não sabia quanto era lucro da empresa e quanto era meu salário.
                        </p>
                        <p>
                            Tentei planilhas (ficavam desatualizadas). Tentei apps famosos (eram focados só em cartão de crédito pessoal ou complexos demais para empresas).
                        </p>
                        <p>
                            A Lumie nasceu dessa dor. Eu queria um sistema que entendesse que o Profissional Moderno é Híbrido. Não somos apenas CPF, nem apenas CNPJ. Somos os dois.
                        </p>
                        <p>
                            Este software é desenvolvido, mantido e usado diariamente por mim. Se você tiver uma ideia ou encontrar um bug, vai falar diretamente com quem constrói o produto.
                        </p>
                        <p className="font-semibold text-white pt-4">
                            Obrigado por confiar no meu trabalho.
                        </p>
                        <footer className="text-zinc-500 font-medium">
                            — Luis Gustavo Bragiatto, Fundador da Lumie.
                        </footer>
                    </div>
                </div>
            </div>
        </div>
    );
}
