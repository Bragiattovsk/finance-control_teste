import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function TermsPage() {
    const navigate = useNavigate();
    
    return (
        <div className="min-h-screen bg-zinc-950 p-6 md:p-12 font-sans antialiased">
            <div className="max-w-3xl mx-auto">
                <Button 
                    variant="ghost" 
                    className="mb-8 text-zinc-400 hover:text-white pl-0 hover:bg-transparent" 
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                </Button>

                <h1 className='text-3xl font-bold text-white mb-8'>Termos de Uso - Lumie</h1>
                
                <div className='text-zinc-300 space-y-6 leading-relaxed'>
                    <p><strong>Última atualização: 04 de Dezembro de 2025</strong></p>
                    
                    <h3 className='text-xl font-semibold text-white mt-8'>1. Aceitação dos Termos</h3>
                    <p>Ao acessar o site ou aplicativo <strong>Lumie</strong>, você concorda em cumprir estes termos de serviço, todas as leis e regulamentos aplicáveis. Se você não concordar com algum desses termos, está proibido de usar ou acessar este site.</p>
                    
                    <h3 className='text-xl font-semibold text-white mt-8'>2. Responsável Legal</h3>
                    <p>O serviço Lumie é desenvolvido e operado por <strong>Luis Gustavo Bragiatto</strong>, referido como 'DESENVOLVEDOR', atuando como profissional autônomo sob as leis do Brasil.</p>
                    
                    <h3 className='text-xl font-semibold text-white mt-8'>3. Licença de Uso</h3>
                    <p>É concedida permissão para baixar temporariamente uma cópia dos materiais no site Lumie, apenas para visualização transitória pessoal e não comercial (exceto no âmbito das funcionalidades PRO).</p>
                    
                    <h3 className='text-xl font-semibold text-white mt-8'>4. Assinaturas e Pagamentos</h3>
                    <ul className='list-disc pl-6 space-y-2'>
                        <li><strong>Plano Free:</strong> Gratuito, com funcionalidades limitadas.</li>
                        <li><strong>Plano Pro:</strong> Pago mensalmente. Garante acesso a funcionalidades exclusivas.</li>
                        <li><strong>Processamento:</strong> O processamento é realizado via Stripe. Os pagamentos são processados em nome do DESENVOLVEDOR (Pessoa Física).</li>
                    </ul>
                    
                    <h3 className='text-xl font-semibold text-white mt-8'>5. Cancelamento e Reembolso</h3>
                    <p>Você pode cancelar sua assinatura a qualquer momento. Conforme o Art. 49 do Código de Defesa do Consumidor, garantimos o reembolso integral em caso de desistência no prazo de 7 dias corridos após a primeira assinatura.</p>
                    
                    <h3 className='text-xl font-semibold text-white mt-8'>6. Limitação de Responsabilidade</h3>
                    <p>O Lumie é fornecido 'como está'. O DESENVOLVEDOR não oferece garantias expressas ou implícitas. O software atua como uma ferramenta passiva de organização e não substitui assessoria contábil.</p>
                    
                    <hr className='border-white/10 my-8'/>
                    
                    <p className='text-sm text-zinc-500'>
                        <strong>Contato e Suporte:</strong><br/>
                        E-mail: suporte.lumiefinance@gmail.com<br/>
                        CPF: 474.986.948-16
                    </p>
                </div>
            </div>
        </div>
    );
}
