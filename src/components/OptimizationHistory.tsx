import { useState } from "react";
import { useAtom } from "jotai";
import { optimizationHistoryAtom, deleteOptimizationEntryAtom, clearOptimizationHistoryAtom, OptimizationHistoryEntry } from "@/store/optimizationHistory";
import { trackOptimizationDetailsViewed } from "@/lib/analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Calendar, DollarSign, Activity, Droplet, Trash, Eye, Package, Beaker, Scale } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

export function OptimizationHistory() {
  const [history] = useAtom(optimizationHistoryAtom);
  const [, deleteEntry] = useAtom(deleteOptimizationEntryAtom);
  const [, clearHistory] = useAtom(clearOptimizationHistoryAtom);
  const [selectedEntry, setSelectedEntry] = useState<OptimizationHistoryEntry | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleDelete = (id: string) => {
    deleteEntry(id);
    toast.success("Entrada removida do histórico");
  };

  const handleClearAll = () => {
    clearHistory();
    toast.success("Histórico limpo");
  };

  const handleViewDetails = (entry: OptimizationHistoryEntry) => {
    setSelectedEntry(entry);
    setDetailsOpen(true);
    // Track details view
    trackOptimizationDetailsViewed(entry.id, true);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Otimizações</CardTitle>
          <CardDescription>
            As otimizações realizadas aparecerão aqui
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Activity className="mx-auto h-12 w-12 mb-2 opacity-50" />
              <p>Nenhuma otimização realizada ainda</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Histórico de Otimizações</CardTitle>
            <CardDescription>
              {history.length} otimização{history.length !== 1 ? "ões" : ""} realizada{history.length !== 1 ? "s" : ""}
            </CardDescription>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash className="mr-2 h-4 w-4" />
                Limpar Histórico
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar limpeza</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja limpar todo o histórico? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearAll}>
                  Limpar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">
                  <Calendar className="inline mr-2 h-4 w-4" />
                  Data/Hora
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">
                  <DollarSign className="inline mr-1 h-4 w-4" />
                  Custo Total
                </TableHead>
                <TableHead className="text-right">
                  <Activity className="inline mr-1 h-4 w-4" />
                  Calorias
                </TableHead>
                <TableHead className="text-right">
                  <Droplet className="inline mr-1 h-4 w-4" />
                  Proteína
                </TableHead>
                <TableHead className="text-center">
                  <Package className="inline mr-1 h-4 w-4" />
                  Bolsas
                </TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-mono text-xs">
                    {formatDate(entry.timestamp)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        entry.result.status === "Optimal"
                          ? "default"
                          : entry.result.status === "Infeasible"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {entry.result.status === "Optimal" && "Ótimo"}
                      {entry.result.status === "Infeasible" && "Inviável"}
                      {entry.result.status === "Error" && "Erro"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {entry.result.total_cost !== null
                      ? `R$ ${entry.result.total_cost.toFixed(2)}`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-sm">{entry.result.total_kcal.toFixed(0)}</span>
                    <span className="text-xs text-muted-foreground ml-1">kcal</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-sm">{entry.result.total_protein.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground ml-1">g</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{entry.result.num_bags}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewDetails(entry)}
                        title="Ver detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(entry.id)}
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Otimização</DialogTitle>
            <DialogDescription>
              {selectedEntry && formatDate(selectedEntry.timestamp)}
            </DialogDescription>
          </DialogHeader>

          {selectedEntry && (
            <div className="space-y-6">
              {/* Status and Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge
                      variant={
                        selectedEntry.result.status === "Optimal"
                          ? "default"
                          : selectedEntry.result.status === "Infeasible"
                          ? "secondary"
                          : "destructive"
                      }
                      className="text-sm"
                    >
                      {selectedEntry.result.status === "Optimal" && "Ótimo"}
                      {selectedEntry.result.status === "Infeasible" && "Inviável"}
                      {selectedEntry.result.status === "Error" && "Erro"}
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      Custo Total
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      {selectedEntry.result.total_cost !== null
                        ? `R$ ${selectedEntry.result.total_cost.toFixed(2)}`
                        : "-"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      Bolsas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{selectedEntry.result.num_bags}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription className="flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      Fórmulas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{selectedEntry.selectedFormulas.length}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Constraints */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  Restrições Aplicadas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Calorias (kcal)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Mínimo:</span>
                        <span className="font-medium">{selectedEntry.constraints.kcal_min} kcal</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Máximo:</span>
                        <span className="font-medium">{selectedEntry.constraints.kcal_max} kcal</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Alcançado:</span>
                        <span className="font-bold text-primary">{selectedEntry.result.total_kcal.toFixed(0)} kcal</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Proteína (g)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Mínimo:</span>
                        <span className="font-medium">{selectedEntry.constraints.protein_min} g</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Máximo:</span>
                        <span className="font-medium">{selectedEntry.constraints.protein_max} g</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Alcançado:</span>
                        <span className="font-bold text-primary">{selectedEntry.result.total_protein.toFixed(1)} g</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Volume (mL)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Máximo:</span>
                        <span className="font-medium">{selectedEntry.constraints.volume_max} mL</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Alcançado:</span>
                        <span className="font-bold text-primary">{selectedEntry.result.total_volume.toFixed(0)} mL</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Composição Adicional</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Nitrogênio:</span>
                        <span className="font-medium">{selectedEntry.result.total_nitrogen.toFixed(1)} g</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Glicose:</span>
                        <span className="font-medium">{selectedEntry.result.total_glucose.toFixed(1)} g</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Gordura:</span>
                        <span className="font-medium">{selectedEntry.result.total_fat.toFixed(1)} g</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Selected Bags */}
              {selectedEntry.result.selected_bags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Beaker className="h-5 w-5" />
                    Fórmulas Selecionadas
                  </h3>
                  <div className="space-y-3">
                    {selectedEntry.result.selected_bags.map((bag, index) => (
                      <Card key={index}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="space-y-1">
                              <h4 className="font-semibold">{bag.name}</h4>
                              <p className="text-sm text-muted-foreground">{bag.manufacturer}</p>
                              <div className="flex gap-2 mt-2">
                                <Badge variant="outline">{bag.quantity}x bolsas</Badge>
                                <Badge variant="secondary">{bag.via}</Badge>
                                <Badge variant="outline">{bag.emulsion_type}</Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-primary">
                                R$ {bag.total_cost.toFixed(2)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                R$ {bag.unit_cost.toFixed(2)} / unidade
                              </p>
                            </div>
                          </div>
                          
                          <Separator className="my-3" />
                          
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Calorias</p>
                              <p className="font-medium">{bag.kcal_contribution.toFixed(0)} kcal</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Proteína</p>
                              <p className="font-medium">{bag.protein_contribution.toFixed(1)} g</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Volume</p>
                              <p className="font-medium">{bag.volume_contribution.toFixed(0)} mL</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Constraints Met Indicators */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Status das Restrições</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className={`flex items-center gap-2 p-3 rounded-lg border ${
                    selectedEntry.result.constraints_met.kcal_min ? 'bg-success/10 border-success' : 'bg-destructive/10 border-destructive'
                  }`}>
                    <div className={`h-2 w-2 rounded-full ${
                      selectedEntry.result.constraints_met.kcal_min ? 'bg-success' : 'bg-destructive'
                    }`} />
                    <span className="text-sm">Calorias Mín</span>
                  </div>
                  <div className={`flex items-center gap-2 p-3 rounded-lg border ${
                    selectedEntry.result.constraints_met.kcal_max ? 'bg-success/10 border-success' : 'bg-destructive/10 border-destructive'
                  }`}>
                    <div className={`h-2 w-2 rounded-full ${
                      selectedEntry.result.constraints_met.kcal_max ? 'bg-success' : 'bg-destructive'
                    }`} />
                    <span className="text-sm">Calorias Máx</span>
                  </div>
                  <div className={`flex items-center gap-2 p-3 rounded-lg border ${
                    selectedEntry.result.constraints_met.protein_min ? 'bg-success/10 border-success' : 'bg-destructive/10 border-destructive'
                  }`}>
                    <div className={`h-2 w-2 rounded-full ${
                      selectedEntry.result.constraints_met.protein_min ? 'bg-success' : 'bg-destructive'
                    }`} />
                    <span className="text-sm">Proteína Mín</span>
                  </div>
                  <div className={`flex items-center gap-2 p-3 rounded-lg border ${
                    selectedEntry.result.constraints_met.protein_max ? 'bg-success/10 border-success' : 'bg-destructive/10 border-destructive'
                  }`}>
                    <div className={`h-2 w-2 rounded-full ${
                      selectedEntry.result.constraints_met.protein_max ? 'bg-success' : 'bg-destructive'
                    }`} />
                    <span className="text-sm">Proteína Máx</span>
                  </div>
                  <div className={`flex items-center gap-2 p-3 rounded-lg border ${
                    selectedEntry.result.constraints_met.volume_max ? 'bg-success/10 border-success' : 'bg-destructive/10 border-destructive'
                  }`}>
                    <div className={`h-2 w-2 rounded-full ${
                      selectedEntry.result.constraints_met.volume_max ? 'bg-success' : 'bg-destructive'
                    }`} />
                    <span className="text-sm">Volume Máx</span>
                  </div>
                </div>
              </div>

              {selectedEntry.result.message && (
                <Card className="bg-muted">
                  <CardContent className="pt-4">
                    <p className="text-sm">{selectedEntry.result.message}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
