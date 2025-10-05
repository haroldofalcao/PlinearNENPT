import { useState, useMemo, useEffect } from "react";
import { useAtom } from "jotai";
import { formulasAtom } from "@/store/formulas";
import { trackPageView, trackOptimizationStarted, trackOptimizationCompleted, trackOptimizationFailed } from "@/lib/analytics";
import { addOptimizationToHistoryAtom } from "@/store/optimizationHistory";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calculator as CalcIcon, CheckCircle2, XCircle, AlertCircle, Search } from "lucide-react";
import { OptimizationResult } from "@/types/formula";
import { toast } from "sonner";
import { useOptimizer } from "@/hooks/useOptimizer";
import { OptimizationHistory } from "@/components/OptimizationHistory";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--success))", "hsl(var(--warning))"];

// Optimization calculator with history and validation
export default function Calculator() {
  const [formulas] = useAtom(formulasAtom);
  const [, addToHistory] = useAtom(addOptimizationToHistoryAtom);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [selectedFormulas, setSelectedFormulas] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Track page view on mount
  useEffect(() => {
    trackPageView('calculator', 'Calculadora de Otimização');
  }, []);
  // Constraints otimizadas para NuTRIflex® Lipid Special 1000mL (PN037)
  // Essa fórmula fornece: 1200 kcal, 43.75g proteína por bolsa de 1000mL
  const [constraints, setConstraints] = useState({
    kcal_min: 1800,      // ~1.5 bolsas = 1800 kcal
    kcal_max: 2400,      // ~2 bolsas = 2400 kcal
    protein_min: 60,     // ~1.4 bolsas = 61.25g
    protein_max: 90,     // ~2 bolsas = 87.5g
    volume_max: 2500,    // Espaço para ~2.5 bolsas
    max_bags: 5,         // Número máximo de bolsas
  });

  const { optimize, isOptimizing, validationErrors } = useOptimizer(formulas);

  const getFieldError = (field: string) => {
    return validationErrors.find((e) => e.field === field)?.message;
  };

  const filteredFormulas = useMemo(() => {
    if (!searchTerm.trim()) return formulas;
    
    const search = searchTerm.toLowerCase();
    return formulas.filter((f) => 
      f.name.toLowerCase().includes(search) ||
      f.manufacturer.toLowerCase().includes(search) ||
      f.id.toLowerCase().includes(search) ||
      f.via.toLowerCase().includes(search)
    );
  }, [formulas, searchTerm]);

  const availableFormulas = useMemo(
    () => formulas.filter((f) => selectedFormulas.includes(f.id)),
    [formulas, selectedFormulas]
  );

  const toggleFormula = (id: string) => {
    setSelectedFormulas((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedFormulas(formulas.map((f) => f.id));
  };

  const deselectAll = () => {
    setSelectedFormulas([]);
  };

  const handleOptimize = () => {
    if (selectedFormulas.length === 0) {
      toast.error("Selecione ao menos uma fórmula para otimizar");
      return;
    }
    
    // Track optimization started
    trackOptimizationStarted(
      selectedFormulas,
      constraints.volume_max,
      false // hasCustomRequirements - pode adicionar lógica para detectar se há requisitos customizados
    );
    
    const startTime = performance.now();
    const optimizationResult = optimize(constraints, selectedFormulas);
    const executionTime = performance.now() - startTime;
    
    setResult(optimizationResult);

    // Add to history
    addToHistory({
      constraints,
      result: optimizationResult,
      selectedFormulas,
    });

    if (optimizationResult.status === "Optimal") {
      // Track successful optimization
      trackOptimizationCompleted(
        optimizationResult.num_bags,
        optimizationResult.total_cost || 0,
        executionTime,
        optimizationResult.total_volume
      );
      toast.success("Otimização concluída com sucesso!");
    } else if (optimizationResult.status === "Infeasible") {
      // Track failed optimization
      trackOptimizationFailed(
        optimizationResult.message || "Restrições não podem ser satisfeitas",
        constraints.volume_max
      );
      toast.error(optimizationResult.message || "Restrições não podem ser satisfeitas");
    } else {
      // Track failed optimization
      trackOptimizationFailed(
        optimizationResult.message || "Erro na otimização",
        constraints.volume_max
      );
      toast.error(optimizationResult.message || "Erro na otimização");
    }
  };

  const costData = result?.selected_bags.map((bag) => ({
    name: bag.name.split(" ")[0], // Shortened name
    cost: bag.total_cost,
  })) || [];

  const nutritionData = result ? [
    { name: "Calories", value: result.total_kcal, unit: "kcal", target: constraints.kcal_min },
    { name: "Protein", value: result.total_protein, unit: "g", target: constraints.protein_min },
    { name: "Volume", value: result.total_volume, unit: "mL", target: constraints.volume_max },
  ] : [];

  // Custom tooltip component with better contrast
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
          <p className="font-semibold text-popover-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm text-popover-foreground">
              <span style={{ color: entry.color }}>●</span> {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Calculadora de Otimização</h1>
        <p className="text-muted-foreground mt-1">
          Configure as restrições e otimize combinações de fórmulas
        </p>
      </div>

      {/* Formula Selection Card */}
      <Card>
        <CardHeader>
          <CardTitle>Seleção de Fórmulas</CardTitle>
          <CardDescription>
            Escolha quais fórmulas devem ser consideradas na otimização ({selectedFormulas.length} de {formulas.length} selecionadas)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar por nome, fabricante, código ou via..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="sm" onClick={selectAll}>
                Selecionar Todas
              </Button>
              <Button variant="outline" size="sm" onClick={deselectAll}>
                Desmarcar Todas
              </Button>
            </div>
            {filteredFormulas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhuma fórmula encontrada para "{searchTerm}"</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-1">
                {filteredFormulas.map((formula) => (
              <div
                key={formula.id}
                className="flex items-start space-x-2 rounded-lg border p-3 hover:bg-accent/50 transition-colors"
              >
                <Checkbox
                  id={formula.id}
                  checked={selectedFormulas.includes(formula.id)}
                  onCheckedChange={() => toggleFormula(formula.id)}
                />
                <label
                  htmlFor={formula.id}
                  className="flex-1 text-sm font-medium leading-none cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span>{formula.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {formula.via}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formula.manufacturer}
                  </p>
                </label>
              </div>
            ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Restrições Nutricionais</CardTitle>
            <CardDescription>
              Defina os requisitos mínimos e máximos para otimização
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <TooltipProvider>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Número Máximo de Bolsas</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Input
                        type="number"
                        min="1"
                        value={constraints.max_bags}
                        onChange={(e) =>
                          setConstraints({ ...constraints, max_bags: Number(e.target.value) })
                        }
                        className={getFieldError("max_bags") ? "border-destructive" : ""}
                      />
                    </TooltipTrigger>
                    {getFieldError("max_bags") && (
                      <TooltipContent side="bottom" className="bg-destructive text-destructive-foreground">
                        <p>{getFieldError("max_bags")}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                  <p className="text-xs text-muted-foreground">
                    Limite máximo de bolsas na solução
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Calorias (kcal) por dia</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Mínimo</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Input
                            type="number"
                            value={constraints.kcal_min}
                            onChange={(e) =>
                              setConstraints({ ...constraints, kcal_min: Number(e.target.value) })
                            }
                            className={getFieldError("kcal_min") ? "border-destructive" : ""}
                          />
                        </TooltipTrigger>
                        {getFieldError("kcal_min") && (
                          <TooltipContent side="bottom" className="bg-destructive text-destructive-foreground">
                            <p>{getFieldError("kcal_min")}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Máximo</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Input
                            type="number"
                            value={constraints.kcal_max}
                            onChange={(e) =>
                              setConstraints({ ...constraints, kcal_max: Number(e.target.value) })
                            }
                            className={getFieldError("kcal_max") ? "border-destructive" : ""}
                          />
                        </TooltipTrigger>
                        {getFieldError("kcal_max") && (
                          <TooltipContent side="bottom" className="bg-destructive text-destructive-foreground">
                            <p>{getFieldError("kcal_max")}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Proteína (g) por dia</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Mínimo</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Input
                            type="number"
                            value={constraints.protein_min}
                            onChange={(e) =>
                              setConstraints({ ...constraints, protein_min: Number(e.target.value) })
                            }
                            className={getFieldError("protein_min") ? "border-destructive" : ""}
                          />
                        </TooltipTrigger>
                        {getFieldError("protein_min") && (
                          <TooltipContent side="bottom" className="bg-destructive text-destructive-foreground">
                            <p>{getFieldError("protein_min")}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Máximo</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Input
                            type="number"
                            value={constraints.protein_max}
                            onChange={(e) =>
                              setConstraints({ ...constraints, protein_max: Number(e.target.value) })
                            }
                            className={getFieldError("protein_max") ? "border-destructive" : ""}
                          />
                        </TooltipTrigger>
                        {getFieldError("protein_max") && (
                          <TooltipContent side="bottom" className="bg-destructive text-destructive-foreground">
                            <p>{getFieldError("protein_max")}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Volume Máximo (mL) por dia</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Input
                        type="number"
                        value={constraints.volume_max}
                        onChange={(e) =>
                          setConstraints({ ...constraints, volume_max: Number(e.target.value) })
                        }
                        className={getFieldError("volume_max") ? "border-destructive" : ""}
                      />
                    </TooltipTrigger>
                    {getFieldError("volume_max") && (
                      <TooltipContent side="bottom" className="bg-destructive text-destructive-foreground">
                        <p>{getFieldError("volume_max")}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </div>
              </div>
            </TooltipProvider>

            <Button 
              onClick={handleOptimize} 
              className="w-full" 
              size="lg"
              disabled={selectedFormulas.length === 0 || isOptimizing}
            >
              <CalcIcon className="mr-2 h-5 w-5" />
              {isOptimizing ? "Otimizando..." : "Otimizar Combinação de Fórmulas"}
            </Button>
            {selectedFormulas.length === 0 && (
              <p className="text-sm text-destructive text-center">
                Selecione ao menos uma fórmula para otimizar
              </p>
            )}
          </CardContent>
        </Card>

        {/* Results Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Resultados da Otimização</CardTitle>
            <CardDescription>
              {result ? (
                <div className="flex items-center gap-2 mt-2">
                  {result.status === "Optimal" ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span className="text-success">Solução ótima encontrada</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-destructive" />
                      <span className="text-destructive">{result.message}</span>
                    </>
                  )}
                </div>
              ) : (
                "Configure as restrições e execute a otimização"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result && result.status === "Optimal" ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Custo Total</p>
                    <p className="text-2xl font-bold text-primary">
                      R$ {result.total_cost?.toFixed(2)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Número de Bolsas</p>
                    <p className="text-2xl font-bold">{result.num_bags}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Calorias</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {result.total_kcal.toFixed(0)} kcal
                      </span>
                      {result.constraints_met.kcal_min && result.constraints_met.kcal_max ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-warning" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Proteína</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {result.total_protein.toFixed(1)} g
                      </span>
                      {result.constraints_met.protein_min && result.constraints_met.protein_max ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-warning" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Gordura</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {result.total_fat.toFixed(1)} g
                      </span>
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Volume</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {result.total_volume.toFixed(0)} mL
                      </span>
                      {result.constraints_met.volume_max ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-warning" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Fórmulas Selecionadas</p>
                  <div className="space-y-2">
                    {result.selected_bags.map((bag) => (
                      <div
                        key={bag.formula_id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{bag.name}</p>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-xs">
                              {bag.quantity}x
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {bag.via}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm font-bold">R$ {bag.total_cost.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <CalcIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Ainda sem resultados. Configure as restrições e clique em otimizar.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {result && result.status === "Optimal" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Custos</CardTitle>
              <CardDescription>Distribuição de custos por fórmula</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={costData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="cost" fill="hsl(var(--primary))" name="Custo (R$)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Composição Nutricional</CardTitle>
              <CardDescription>Valores alcançados vs valores alvo</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={nutritionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="value" fill="hsl(var(--accent))" name="Alcançado" />
                  <Bar dataKey="target" fill="hsl(var(--muted))" name="Alvo" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Optimization History */}
      <OptimizationHistory />
    </div>
  );
}
