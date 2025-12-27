export interface Project {
    id: string;
    name: string;
    description?: string;
    color?: string;
    user_id: string;
    created_at?: string;
}

export interface Category {
    id: string;
    user_id: string;
    nome: string;
    cor?: string | null;
    is_investment?: boolean;
    tipo: 'income' | 'expense';
}

export interface Transaction {
    id: string;
    descricao: string;
    valor: number;
    tipo: "receita" | "despesa";
    data: string;
    categoria_id: string | null;
    pago: boolean;
    categories: Category | null;
    project_id?: string | null;
    related_transaction_id?: string | null;
    recurrence_id?: string | null;
    installment_number?: number | null;
    total_installments?: number | null;
    projects?: Project | null;
    attachment_path?: string | null;
}

export interface Profile {
    id: string;
    email: string;
    deletion_scheduled_at?: string | null;
    subscription_tier?: 'FREE' | 'PRO';
    full_name?: string | null;
    avatar_url?: string | null;
    investimento_percentual?: number | null;
    investimento_base?: 'BRUTO' | 'SOBRA' | null;
}
