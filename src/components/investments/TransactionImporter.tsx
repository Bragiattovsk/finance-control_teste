import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, Check, X, Download, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-hooks';

interface ImportedTransaction {
  Data: Date | string;
  Descricao: string;
  Valor: number;
  Categoria: string;
  Tipo: 'income' | 'expense';
}

interface RawRow {
  Data: any;
  Descricao: any;
  Valor: any;
  Categoria: any;
  Tipo: any;
  [key: string]: any;
}

interface TransactionImporterProps {
  onSuccess?: () => void;
}

export function TransactionImporter({ onSuccess }: TransactionImporterProps) {
  const [previewData, setPreviewData] = useState<ImportedTransaction[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const excelDateToJSDate = (serial: number): Date => {
    const utc_days  = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);

    const fractional_day = serial - Math.floor(serial) + 0.0000001;
    let total_seconds = Math.floor(86400 * fractional_day);

    const seconds = total_seconds % 60;

    total_seconds -= seconds;

    const hours = Math.floor(total_seconds / (60 * 60));
    const minutes = Math.floor(total_seconds / 60) % 60;

    return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
  };

  const parseDate = (value: any): Date | string => {
    if (typeof value === 'number') {
      return excelDateToJSDate(value);
    }
    if (value instanceof Date) return value;
    // Tenta fazer o parse de string se necessário, ou retorna a string original
    return value;
  };

  const normalizeType = (value: any): 'income' | 'expense' => {
    if (!value) return 'expense';
    const str = String(value).toLowerCase().trim();
    if (str === 'receita' || str === 'income') return 'income';
    return 'expense';
  };

  // Helper para normalizar chaves de busca
  const normalizeKey = (key: string) => 
    key.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

  // Função de busca inteligente de valores
  const findValue = (row: any, possibleKeys: string[]) => {
    const rowKeys = Object.keys(row);
    for (const possibleKey of possibleKeys) {
      const foundKey = rowKeys.find(k => normalizeKey(k) === possibleKey);
      if (foundKey) return row[foundKey];
    }
    return undefined;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let file: File | undefined;
    
    if ('dataTransfer' in e) {
       e.preventDefault();
       if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
         file = e.dataTransfer.files[0];
       }
    } else {
       if (e.target.files && e.target.files.length > 0) {
         file = e.target.files[0];
       }
    }

    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast({
        title: "Formato inválido",
        description: "Por favor, envie um arquivo Excel (.xlsx ou .xls).",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const arrayBuffer = evt.target?.result;
        const wb = XLSX.read(arrayBuffer, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<RawRow>(ws);

        if (data.length === 0) {
            toast({
                title: "Arquivo vazio",
                description: "Nenhuma transação encontrada no arquivo.",
                variant: "destructive"
            });
            return;
        }

        // Validate headers roughly by checking first row keys
        // Note: sheet_to_json uses first row as keys by default.
        // We expect Data, Descricao, Valor, Categoria, Tipo.
        
        const mappedData: ImportedTransaction[] = data.map((row) => {
           return {
             Data: parseDate(row.Data),
             Descricao: row.Descricao || row['Descrição'] || row['descrição'] || 'Sem descrição',
             Valor: Number(row.Valor) || 0,
             Categoria: row.Categoria || 'Outros',
             Tipo: normalizeType(row.Tipo)
           };
        });
        
        const validData = mappedData.filter(d => d.Valor !== 0);

        setPreviewData(validData);
        toast({
            title: "Arquivo lido com sucesso",
            description: `${validData.length} transações encontradas.`
        });

      } catch (error) {
        console.error(error);
        toast({
          title: "Erro na leitura",
          description: "Não foi possível processar o arquivo. Verifique se as colunas estão corretas (Data, Descricao, Valor, Categoria, Tipo).",
          variant: "destructive"
        });
        setPreviewData([]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    setIsDragging(false);
    handleFileUpload(e);
  };

  const handleCancel = () => {
    setPreviewData([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirm = async () => {
    if (!user) {
        toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
        return;
    }

    setLoading(true);
    try {
        // 1. Mapeamento de categorias únicas
        const uniqueCategoryNames = Array.from(new Set(previewData.map(t => t.Categoria.trim())));
        
        // 2. Buscar categorias existentes
        const { data: existingCategories, error: fetchError } = await supabase
            .from('categories')
            .select('id, nome')
            .eq('user_id', user.id);

        if (fetchError) throw fetchError;

        const existingMap = new Map<string, string>(
            (existingCategories as any[])?.map(c => [c.nome.toLowerCase(), c.id]) || []
        );
        const categoryMap = new Map<string, string>(); // Nome original -> ID

        // 3. Identificar novas categorias
        const newCategoriesToInsert: any[] = [];
        
        uniqueCategoryNames.forEach(catName => {
            const lowerName = catName.toLowerCase();
            if (existingMap.has(lowerName)) {
                categoryMap.set(catName, existingMap.get(lowerName)!);
            } else {
                // Preparar para inserção
                // Tenta inferir o tipo baseada na primeira transação dessa categoria (heurística simples)
                const firstTx = previewData.find(t => t.Categoria.trim() === catName);
                const type = firstTx?.Tipo || 'expense'; 
                
                newCategoriesToInsert.push({
                    user_id: user.id,
                    nome: catName,
                    tipo: type, 
                    cor: '#64748b' // Default slate-500
                });
            }
        });

        // 4. Inserir novas categorias
        if (newCategoriesToInsert.length > 0) {
            const { data: insertedCategories, error: insertError } = await supabase
                .from('categories')
                .insert(newCategoriesToInsert)
                .select();

            if (insertError) throw insertError;

            (insertedCategories as any[])?.forEach(c => {
                // Mapeia o nome que foi inserido (pode ter mudado caso banco force algo, mas aqui assumimos igual)
                // Precisamos mapear o nome original do Excel para o novo ID.
                // Como inserimos em batch, a ordem pode não ser garantida ou os nomes podem vir diferentes?
                // O supabase retorna os dados inseridos. Vamos encontrar pelo nome.
                categoryMap.set(c.nome, c.id);
                // Fallback para case insensitive search se necessário, mas aqui o nome deve bater
                const originalName = uniqueCategoryNames.find(u => u.toLowerCase() === c.nome.toLowerCase());
                if (originalName) categoryMap.set(originalName, c.id);
            });
        }

        // 5. Preparar payload das transações
        const transactionsPayload = previewData.map(t => {
            const catId = categoryMap.get(t.Categoria.trim()) || categoryMap.get(t.Categoria);
            
            // Converter data para formato ISO
            let dateStr = new Date().toISOString();
            if (t.Data instanceof Date) {
                dateStr = t.Data.toISOString();
            } else {
                // Fallback seguro, embora o parseExcelDate já deva ter garantido Date object
                try {
                    const d = new Date(t.Data);
                    if (!isNaN(d.getTime())) dateStr = d.toISOString();
                } catch (e) {
                    console.error("Data inválida no payload", t.Data);
                }
            }

            // Normalizar valor (sempre positivo no banco se o tipo define a direção? 
            // Normalmente bancos guardam valor absoluto e o tipo define.
            // Mas se vier negativo do Excel, vamos assumir valor absoluto.)
            const absValor = Math.abs(t.Valor);

            return {
                user_id: user.id,
                descricao: t.Descricao,
                valor: absValor,
                data: dateStr,
                tipo: t.Tipo === 'income' ? 'receita' : 'despesa',
                categoria_id: catId,
                pago: true // Assumindo transações passadas como pagas
            };
        });

        // 6. Bulk Insert
        const { error: txError } = await supabase
            .from('transactions')
            .insert(transactionsPayload);

        if (txError) throw txError;

        toast({
            title: "Sucesso!",
            description: `${previewData.length} transações importadas com sucesso.`,
            className: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600",
        });

        if (onSuccess) onSuccess();

        // Limpar estado
        handleCancel();

    } catch (error: any) {
        console.error('Erro na importação:', error);
        toast({
            title: "Erro ao importar",
            description: error.message || "Ocorreu um erro ao salvar os dados.",
            variant: "destructive"
        });
    } finally {
        setLoading(false);
    }
  };

  return (
    <Card className="w-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
       <CardHeader>
         <CardTitle className="flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
            <FileSpreadsheet className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
            Importar Transações
         </CardTitle>
         <CardDescription className="text-zinc-500 dark:text-zinc-500">
            Carregue suas transações via Excel. <a href="/modelo_importacao.xlsx" className="text-violet-600 dark:text-violet-400 hover:underline inline-flex items-center gap-1" download>Baixar modelo <Download className="h-3 w-3" /></a>
         </CardDescription>
       </CardHeader>
       <CardContent>
         {!previewData.length ? (
            <div 
              className={cn(
                "border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors",
                isDragging 
                  ? "border-violet-500 bg-violet-50 dark:bg-violet-900/10" 
                  : "border-zinc-200 dark:border-zinc-800 hover:border-violet-500/50 dark:hover:border-violet-500/50"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".xlsx, .xls" 
                onChange={handleFileUpload}
              />
              <Upload className="h-10 w-10 mx-auto text-zinc-400 mb-4" />
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Arraste seu arquivo aqui ou clique para selecionar
              </p>
              <p className="text-xs text-zinc-500 mt-2">
                Suporta apenas arquivos .xlsx
              </p>
            </div>
         ) : (
            <div className="rounded-md border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <Table>
                <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-zinc-700 dark:text-zinc-300">Data</TableHead>
                    <TableHead className="text-zinc-700 dark:text-zinc-300">Descrição</TableHead>
                    <TableHead className="text-zinc-700 dark:text-zinc-300">Categoria</TableHead>
                    <TableHead className="text-zinc-700 dark:text-zinc-300">Tipo</TableHead>
                    <TableHead className="text-right text-zinc-700 dark:text-zinc-300">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.slice(0, 5).map((t, i) => (
                    <TableRow key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800">
                       <TableCell className="text-zinc-600 dark:text-zinc-400">
                         {t.Data instanceof Date ? t.Data.toLocaleDateString('pt-BR') : String(t.Data)}
                       </TableCell>
                       <TableCell className="text-zinc-600 dark:text-zinc-400">{t.Descricao}</TableCell>
                       <TableCell className="text-zinc-600 dark:text-zinc-400">{t.Categoria}</TableCell>
                       <TableCell>
                         <span className={cn(
                           "px-2 py-1 rounded-full text-xs font-medium",
                           t.Tipo === 'income' 
                             ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                             : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                         )}>
                            {t.Tipo === 'income' ? 'Receita' : 'Despesa'}
                         </span>
                       </TableCell>
                       <TableCell className="text-right text-zinc-600 dark:text-zinc-400">
                         {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.Valor)}
                       </TableCell>
                    </TableRow>
                  ))}
                  {previewData.length > 5 && (
                    <TableRow className="border-zinc-200 dark:border-zinc-800">
                        <TableCell colSpan={5} className="text-center text-zinc-500 py-4">
                            E mais {previewData.length - 5} transações...
                        </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
         )}
       </CardContent>
       {previewData.length > 0 && (
         <CardFooter className="flex justify-between border-t border-zinc-100 dark:border-zinc-800 pt-6">
            <Button variant="outline" onClick={handleCancel} className="border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
                <X className="mr-2 h-4 w-4" /> Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={loading} className="bg-violet-600 hover:bg-violet-700 text-white dark:bg-violet-600 dark:hover:bg-violet-700">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />} Confirmar Importação
            </Button>
         </CardFooter>
       )}
    </Card>
  );
}
