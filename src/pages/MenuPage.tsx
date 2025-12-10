import { useNavigate } from "react-router-dom";
import { Tags, Settings, FileBarChart } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function MenuPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Menu e Ferramentas
        </h1>
        <p className="text-muted-foreground">
          Gerencie suas categorias e configurações
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Categorias */}
        <Card
          onClick={() => navigate("/categories")}
          className={cn(
            "cursor-pointer transition-all duration-200",
            "hover:bg-zinc-100 dark:hover:bg-zinc-900",
            "border-border shadow-sm hover:shadow-md"
          )}
        >
          <CardHeader className="flex flex-row items-start gap-4 space-y-0">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Tags className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-1">
              <CardTitle>Categorias</CardTitle>
              <CardDescription>Personalize seus tipos de gastos.</CardDescription>
            </div>
          </CardHeader>
        </Card>

        {/* Configurações */}
        <Card
          onClick={() => navigate("/settings")}
          className={cn(
            "cursor-pointer transition-all duration-200",
            "hover:bg-zinc-100 dark:hover:bg-zinc-900",
            "border-border shadow-sm hover:shadow-md"
          )}
        >
          <CardHeader className="flex flex-row items-start gap-4 space-y-0">
            <div className="p-2 bg-muted rounded-lg">
              <Settings className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <CardTitle>Configurações</CardTitle>
              <CardDescription>Perfil, segurança e dados.</CardDescription>
            </div>
          </CardHeader>
        </Card>

        {/* Relatórios (Placeholder) */}
        <Card
          className={cn(
            "opacity-50 cursor-not-allowed",
            "border-border shadow-sm"
          )}
        >
          <CardHeader className="flex flex-row items-start gap-4 space-y-0">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <FileBarChart className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="space-y-1">
              <CardTitle>Relatórios</CardTitle>
              <CardDescription>Em breve.</CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
