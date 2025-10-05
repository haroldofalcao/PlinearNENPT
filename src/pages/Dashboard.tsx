import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FlaskConical, Calculator, TrendingDown, Package, BookOpen } from "lucide-react";
import { useAtom } from "jotai";
import { formulasAtom } from "@/store/formulas";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { trackPageView } from "@/lib/analytics";

export default function Dashboard() {
  const [formulas] = useAtom(formulasAtom);
  const navigate = useNavigate();
  
  useEffect(() => {
    trackPageView('dashboard', 'Dashboard');
  }, []);

  const stats = [
    {
      title: "Total de Fórmulas",
      value: formulas.length,
      icon: FlaskConical,
      description: "Disponíveis no banco de dados",
      color: "text-primary",
    },
    {
      title: "Acesso Central",
      value: formulas.filter((f) => f.via === "Central").length,
      icon: Package,
      description: "Fórmulas de via central",
      color: "text-accent",
    },
    {
      title: "Acesso Periférico",
      value: formulas.filter((f) => f.via === "Peripheral").length,
      icon: Package,
      description: "Fórmulas de via periférica",
      color: "text-success",
    },
    {
      title: "Custo Médio",
      value: `R$ ${(formulas.reduce((sum, f) => sum + f.base_cost, 0) / formulas.length).toFixed(2)}`,
      icon: TrendingDown,
      description: "Por fórmula",
      color: "text-warning",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-primary p-8 text-primary-foreground">
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-2">Otimizador de Nutrição Parenteral</h1>
          <p className="text-lg text-primary-foreground/90 mb-6 max-w-2xl">
            Otimize fórmulas de nutrição parenteral para minimizar custos enquanto atende todos os requisitos nutricionais.
            Otimização de programação linear de nível profissional para profissionais de saúde.
          </p>
          <div className="flex gap-3">
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate("/calculator")}
              className="bg-background text-primary hover:bg-background/90"
            >
              <Calculator className="mr-2 h-5 w-5" />
              Iniciar Otimização
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/formulas")}
              className=" bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20"
            >
              <FlaskConical className="mr-2 h-5 w-5" />
              Gerenciar Fórmulas
            </Button>
          </div>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-10">
          <FlaskConical className="h-full w-full" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={cn("h-4 w-4", stat.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Guia de Início Rápido</CardTitle>
            <CardDescription>
              Novo no otimizador? Comece aqui para aprender o básico.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/guide")} className="w-full">
              <BookOpen className="mr-2 h-4 w-4" />
              Ver Tutorial
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gerenciamento de Fórmulas</CardTitle>
            <CardDescription>
              Adicione, edite ou importe fórmulas de arquivos Excel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/formulas")} className="w-full">
              <FlaskConical className="mr-2 h-4 w-4" />
              Gerenciar Fórmulas
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Recursos Principais</CardTitle>
          <CardDescription>
            Ferramentas profissionais de otimização para nutrição parenteral
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <Calculator className="h-5 w-5" />
                <h3 className="font-semibold">Otimização de Custos</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Encontre a combinação de fórmulas mais econômica que atenda todas as restrições nutricionais.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-accent">
                <FlaskConical className="h-5 w-5" />
                <h3 className="font-semibold">Base de Dados de Fórmulas</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Base de dados abrangente com capacidades de importação/exportação e gerenciamento de custos personalizado.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-success">
                <TrendingDown className="h-5 w-5" />
                <h3 className="font-semibold">Análise de Restrições</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Filtragem avançada e análise de sensibilidade para explorar diferentes cenários.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
