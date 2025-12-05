import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function PrivacyPage() {
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

                <h1 className='text-3xl font-bold text-white mb-8'>Política de Privacidade - Lumie</h1>
                
                <div className='text-zinc-300 space-y-6 leading-relaxed'>
                    <h3 className='text-xl font-semibold text-white mt-8'>1. Controlador dos Dados</h3>
                    <p>Para fins da Lei Geral de Proteção de Dados (LGPD), o controlador dos dados é <strong>Luis Gustavo Bragiatto</strong>, pessoa física, residente no Brasil.</p>
                    
                    <h3 className='text-xl font-semibold text-white mt-8'>2. Informações que coletamos</h3>
                    <ul className='list-disc pl-6 space-y-2'>
                        <li><strong>Dados de Cadastro:</strong> Nome e e-mail (via Supabase Auth).</li>
                        <li><strong>Dados Financeiros:</strong> Transações e valores inseridos por você.</li>
                        <li><strong>Arquivos:</strong> Comprovantes que você optar por anexar.</li>
                    </ul>
                    
                    <h3 className='text-xl font-semibold text-white mt-8'>3. Compartilhamento</h3>
                    <p>Compartilhamos dados estritamente necessários apenas com processadores essenciais: <strong>Stripe</strong> (pagamentos) e <strong>Supabase</strong> (banco de dados).</p>
                    
                    <h3 className='text-xl font-semibold text-white mt-8'>4. Segurança</h3>
                    <p>Utilizamos serviços de nuvem com criptografia de ponta a ponta (SSL) para proteger seus dados.</p>
                    
                    <h3 className='text-xl font-semibold text-white mt-8'>5. Seus Direitos</h3>
                    <p>Você tem o direito de solicitar o acesso, correção ou a exclusão completa de sua conta e dados a qualquer momento.</p>
                    
                    <hr className='border-white/10 my-8'/>
                    
                    <p className='text-sm text-zinc-500'>
                        <strong>Contato do Encarregado de Dados:</strong><br/>
                        E-mail: suporte.lumiefinance@gmail.com
                    </p>
                </div>
            </div>
        </div>
    );
}
