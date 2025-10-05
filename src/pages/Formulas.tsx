import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { formulasAtom } from "@/store/formulas";
import { trackPageView, trackFormulaExport, trackFormulaImport, trackFormulaCreated, trackFormulaEdited, trackFormulaDeleted } from "@/lib/analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, Upload, Download, Pencil, Trash2, FileSpreadsheet, FileJson } from "lucide-react";
import { Formula } from "@/types/formula";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { FormulaDialog } from "@/components/FormulaDialog";
import * as XLSX from "xlsx";

export default function Formulas() {
  const [formulas, setFormulas] = useAtom(formulasAtom);
  
  // Track page view on mount
  useEffect(() => {
    trackPageView('formulas', 'Gerenciamento de Fórmulas');
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [viaFilter, setViaFilter] = useState<string>("Todas");
  const [manufacturerFilter, setManufacturerFilter] = useState<string>("Todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFormula, setEditingFormula] = useState<Formula | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formulaToDelete, setFormulaToDelete] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [deleteManyDialogOpen, setDeleteManyDialogOpen] = useState(false);

  const manufacturers = ["Todos", ...Array.from(new Set(formulas.map((f) => f.manufacturer)))].sort();

  // Função para gerar IDs únicos
  const generateUniqueId = (existingIds: Set<string>): string => {
    let counter = 1;
    let newId = `PN${String(counter).padStart(3, "0")}`;
    
    // Encontra o maior número existente
    existingIds.forEach(id => {
      if (id.startsWith('PN')) {
        const num = parseInt(id.substring(2), 10);
        if (!isNaN(num) && num >= counter) {
          counter = num + 1;
        }
      }
    });
    
    // Garante que o ID é único
    while (existingIds.has(newId)) {
      counter++;
      newId = `PN${String(counter).padStart(3, "0")}`;
    }
    
    return newId;
  };

  const filteredFormulas = formulas.filter((formula) => {
    const matchesSearch =
      formula.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      formula.manufacturer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVia = viaFilter === "Todas" || formula.via === viaFilter;
    const matchesManufacturer = manufacturerFilter === "Todos" || formula.manufacturer === manufacturerFilter;
    return matchesSearch && matchesVia && matchesManufacturer;
  });

  const handleDeleteClick = (id: string) => {
    setFormulaToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!formulaToDelete) return;
    
    const deletedFormula = formulas.find((f) => f.id === formulaToDelete);
    const newFormulas = formulas.filter((f) => f.id !== formulaToDelete);
    setFormulas(newFormulas);
    setDeleteDialogOpen(false);
    setFormulaToDelete(null);
    
    // Track formula deletion
    if (deletedFormula) {
      trackFormulaDeleted(deletedFormula.id, deletedFormula.name);
    }

    toast.success("Fórmula excluída com sucesso", {
      action: deletedFormula ? {
        label: "Desfazer",
        onClick: () => {
          setFormulas([...newFormulas, deletedFormula]);
          toast.success("Exclusão desfeita");
        },
      } : undefined,
    });
  };

  const toggleSelectFormula = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredFormulas.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredFormulas.map(f => f.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    setDeleteManyDialogOpen(true);
  };

  const handleDeleteSelectedConfirm = () => {
    const deletedFormulas = formulas.filter((f) => selectedIds.has(f.id));
    const newFormulas = formulas.filter((f) => !selectedIds.has(f.id));
    setFormulas(newFormulas);
    setDeleteManyDialogOpen(false);
    setSelectedIds(new Set());

    toast.success(`${deletedFormulas.length} fórmula(s) excluída(s) com sucesso`, {
      action: {
        label: "Desfazer",
        onClick: () => {
          setFormulas([...newFormulas, ...deletedFormulas]);
          toast.success("Exclusão desfeita");
        },
      },
    });
  };

  const handleDeleteAll = () => {
    setDeleteAllDialogOpen(true);
  };

  const handleDeleteAllConfirm = () => {
    const deletedFormulas = [...formulas];
    setFormulas([]);
    setDeleteAllDialogOpen(false);
    setSelectedIds(new Set());

    toast.success("Todas as fórmulas foram excluídas", {
      action: {
        label: "Desfazer",
        onClick: () => {
          setFormulas(deletedFormulas);
          toast.success("Exclusão desfeita");
        },
      },
    });
  };

  const handleEdit = (formula: Formula) => {
    setEditingFormula(formula);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingFormula(null);
    setDialogOpen(true);
  };

  const handleSave = (data: Omit<Formula, "id"> & { id?: string }) => {
    if (data.id) {
      // Update existing
      setFormulas(formulas.map((f) => (f.id === data.id ? (data as Formula) : f)));
      trackFormulaEdited(data.id, data.name);
      toast.success("Fórmula atualizada com sucesso");
    } else {
      // Create new
      const existingIds = new Set(formulas.map(f => f.id));
      const newFormula: Formula = {
        ...data,
        id: generateUniqueId(existingIds),
      } as Formula;
      setFormulas([...formulas, newFormula]);
      trackFormulaCreated(newFormula.name, 'manual');
      toast.success("Fórmula criada com sucesso");
    }
  };

  const handleExport = () => {
    try {
      const exportData = formulas.map((f) => ({
        ID: f.id,
        Nome: f.name,
        Fabricante: f.manufacturer,
        "Volume (mL)": f.volume_ml,
        Kcal: f.kcal,
        "Proteína (g/L)": f.protein_g_l,
        "Nitrogênio (g/L)": f.nitrogen_g_l,
        "Glicose (g/L)": f.glucose_g_l,
        "Gordura (g/L)": f.fat_g_l,
        "Tipo de Emulsão": f.emulsion_type,
        Via: f.via,
        "Osmolaridade (mOsm/L)": f.osmolarity || "",
        "Custo Base (R$)": f.base_cost,
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Fórmulas");
      XLSX.writeFile(wb, `formulas_${new Date().toISOString().split("T")[0]}.xlsx`);
      trackFormulaExport('xlsx', formulas.length);
      toast.success("Excel exportado com sucesso");
    } catch (error) {
      toast.error("Erro ao exportar Excel");
    }
  };

  const handleImportExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        const existingIds = new Set(formulas.map(f => f.id));
        const importedFormulas: Formula[] = jsonData.map((row, index) => {
          let id = row.ID;
          // Se o ID não existe ou já está em uso, gera um novo
          if (!id || existingIds.has(id)) {
            id = generateUniqueId(existingIds);
          }
          existingIds.add(id); // Adiciona ao set para evitar duplicatas dentro do mesmo import
          
          return {
            id,
            name: row.Nome || row.name || "",
          manufacturer: row.Fabricante || row.manufacturer || "",
          volume_ml: Number(row["Volume (mL)"] || row.volume_ml || 0),
          kcal: Number(row.Kcal || row.kcal || 0),
          protein_g_l: Number(row["Proteína (g/L)"] || row.protein_g_l || 0),
          nitrogen_g_l: Number(row["Nitrogênio (g/L)"] || row.nitrogen_g_l || 0),
          glucose_g_l: Number(row["Glicose (g/L)"] || row.glucose_g_l || 0),
          fat_g_l: Number(row["Gordura (g/L)"] || row.fat_g_l || 0),
          emulsion_type: (row["Tipo de Emulsão"] || row.emulsion_type || "LCT") as Formula["emulsion_type"],
          via: (row.Via || row.via || "Central") as Formula["via"],
          osmolarity: Number(row["Osmolaridade (mOsm/L)"] || row.osmolarity || 0) || undefined,
          base_cost: Number(row["Custo Base (R$)"] || row.base_cost || 0),
          };
        });

        setFormulas([...formulas, ...importedFormulas]);
        trackFormulaImport('xlsx', importedFormulas.length, true);
        toast.success(`${importedFormulas.length} fórmulas importadas do Excel com sucesso`);
      } catch (error) {
        trackFormulaImport('xlsx', 0, false);
        toast.error("Erro ao importar Excel. Verifique o formato do arquivo.");
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = "";
  };

  const handleImportJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonContent = e.target?.result as string;
        const jsonData = JSON.parse(jsonContent);

        // Check if it's in the format { formulas: [...] } or just an array
        const formulasArray = Array.isArray(jsonData) ? jsonData : jsonData.formulas;

        if (!Array.isArray(formulasArray)) {
          toast.error("Formato JSON inválido. Esperado um array de fórmulas ou { formulas: [...] }");
          return;
        }

        const existingIds = new Set(formulas.map(f => f.id));
        const importedFormulas: Formula[] = formulasArray.map((item: any, index: number) => {
          let id = item.id;
          // Se o ID não existe ou já está em uso, gera um novo
          if (!id || existingIds.has(id)) {
            id = generateUniqueId(existingIds);
          }
          existingIds.add(id); // Adiciona ao set para evitar duplicatas dentro do mesmo import
          
          return {
            id,
            name: item.name || "",
          manufacturer: item.manufacturer || "",
          volume_ml: Number(item.volume_ml || 0),
          kcal: Number(item.kcal || 0),
          protein_g_l: Number(item.protein_g_l || 0),
          nitrogen_g_l: Number(item.nitrogen_g_l || 0),
          glucose_g_l: Number(item.glucose_g_l || 0),
          fat_g_l: Number(item.fat_g_l || 0),
          emulsion_type: (item.emulsion_type || "LCT") as Formula["emulsion_type"],
          via: (item.via || "Central") as Formula["via"],
          osmolarity: Number(item.osmolarity || 0) || undefined,
          base_cost: Number(item.base_cost || 0),
          };
        });

        setFormulas([...formulas, ...importedFormulas]);
        trackFormulaImport('json', importedFormulas.length, true);
        toast.success(`${importedFormulas.length} fórmulas importadas do JSON com sucesso`);
      } catch (error) {
        console.error("Erro ao importar JSON:", error);
        trackFormulaImport('json', 0, false);
        toast.error("Erro ao importar JSON. Verifique o formato do arquivo.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const handleExportJson = () => {
    try {
      const exportData = {
        formulas: formulas.map((f) => ({
          id: f.id,
          name: f.name,
          manufacturer: f.manufacturer,
          volume_ml: f.volume_ml,
          kcal: f.kcal,
          protein_g_l: f.protein_g_l,
          nitrogen_g_l: f.nitrogen_g_l,
          glucose_g_l: f.glucose_g_l,
          fat_g_l: f.fat_g_l,
          emulsion_type: f.emulsion_type,
          via: f.via,
          osmolarity: f.osmolarity,
          base_cost: f.base_cost,
        })),
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `formulas_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      trackFormulaExport('json', formulas.length);
      toast.success("JSON exportado com sucesso");
    } catch (error) {
      toast.error("Erro ao exportar JSON");
    }
  };

  const handleDownloadExampleExcel = () => {
    try {
      const exampleData = [
        {
          ID: "PN001",
          Nome: "NuTRIflex® peri 1000mL",
          Fabricante: "B. Braun",
          "Volume (mL)": 1000,
          Kcal: 600,
          "Proteína (g/L)": 15.0,
          "Nitrogênio (g/L)": 2.4,
          "Glicose (g/L)": 80,
          "Gordura (g/L)": 20,
          "Tipo de Emulsão": "Soja",
          Via: "Peripheral",
          "Osmolaridade (mOsm/L)": 850,
          "Custo Base (R$)": 45.50,
        },
        {
          ID: "PN002",
          Nome: "NuTRIflex® central 1000mL",
          Fabricante: "B. Braun",
          "Volume (mL)": 1000,
          Kcal: 1050,
          "Proteína (g/L)": 28.75,
          "Nitrogênio (g/L)": 4.6,
          "Glicose (g/L)": 140,
          "Gordura (g/L)": 40,
          "Tipo de Emulsão": "Soja",
          Via: "Central",
          "Osmolaridade (mOsm/L)": 1380,
          "Custo Base (R$)": 68.90,
        },
        {
          ID: "PN003",
          Nome: "SMOFlipid® Central 1000mL",
          Fabricante: "Fresenius Kabi",
          "Volume (mL)": 1000,
          Kcal: 1200,
          "Proteína (g/L)": 32.5,
          "Nitrogênio (g/L)": 5.2,
          "Glicose (g/L)": 160,
          "Gordura (g/L)": 40,
          "Tipo de Emulsão": "SMOF",
          Via: "Central",
          "Osmolaridade (mOsm/L)": 1450,
          "Custo Base (R$)": 89.30,
        },
        {
          ID: "PN004",
          Nome: "Olimel® N4E 1000mL",
          Fabricante: "Baxter",
          "Volume (mL)": 1000,
          Kcal: 1160,
          "Proteína (g/L)": 28.5,
          "Nitrogênio (g/L)": 4.56,
          "Glicose (g/L)": 160,
          "Gordura (g/L)": 40,
          "Tipo de Emulsão": "Oliva/TCL",
          Via: "Central",
          "Osmolaridade (mOsm/L)": 1400,
          "Custo Base (R$)": 78.60,
        },
        {
          ID: "PN005",
          Nome: "Structokabiven® 1155mL",
          Fabricante: "Fresenius Kabi",
          "Volume (mL)": 1155,
          Kcal: 1050,
          "Proteína (g/L)": 33.44,
          "Nitrogênio (g/L)": 5.35,
          "Glicose (g/L)": 126,
          "Gordura (g/L)": 42,
          "Tipo de Emulsão": "TCM/TCL",
          Via: "Central",
          "Osmolaridade (mOsm/L)": 1350,
          "Custo Base (R$)": 86.70,
        },
        {
          ID: "PN006",
          Nome: "Clinimix® E 5/20 1000mL",
          Fabricante: "Baxter",
          "Volume (mL)": 1000,
          Kcal: 800,
          "Proteína (g/L)": 31.25,
          "Nitrogênio (g/L)": 5.0,
          "Glicose (g/L)": 200,
          "Gordura (g/L)": 0,
          "Tipo de Emulsão": "Sem lipídio",
          Via: "Central",
          "Osmolaridade (mOsm/L)": 1200,
          "Custo Base (R$)": 42.50,
        },
      ];

      const ws = XLSX.utils.json_to_sheet(exampleData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Exemplo Fórmulas");
      XLSX.writeFile(wb, "exemplo_formulas_template.xlsx");
      toast.success("Planilha de exemplo baixada com sucesso");
    } catch (error) {
      toast.error("Erro ao baixar planilha de exemplo");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Fórmulas</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie sua base de dados de fórmulas de nutrição parenteral
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={handleDownloadExampleExcel}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Baixar Exemplo Excel
          </Button>
          <Button variant="outline" asChild>
            <label className="cursor-pointer">
              <Upload className="mr-2 h-4 w-4" />
              Importar Excel
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportExcel}
                className="hidden"
              />
            </label>
          </Button>
          <Button variant="outline" asChild>
            <label className="cursor-pointer">
              <FileJson className="mr-2 h-4 w-4" />
              Importar JSON
              <input
                type="file"
                accept=".json"
                onChange={handleImportJson}
                className="hidden"
              />
            </label>
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Excel
          </Button>
          <Button variant="outline" onClick={handleExportJson}>
            <FileJson className="mr-2 h-4 w-4" />
            Exportar JSON
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Fórmula
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Base de Fórmulas</CardTitle>
              <CardDescription>
                {filteredFormulas.length} {filteredFormulas.length === 1 ? "fórmula disponível" : "fórmulas disponíveis"}
              </CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              {selectedIds.size > 0 && (
                <>
                  <Badge variant="secondary" className="px-3 py-2">
                    {selectedIds.size} selecionada(s)
                  </Badge>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteSelected}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Deletar Selecionadas
                  </Button>
                </>
              )}
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar fórmulas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={manufacturerFilter} onValueChange={setManufacturerFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Fabricante" />
                </SelectTrigger>
                <SelectContent>
                  {manufacturers.map((mfr) => (
                    <SelectItem key={mfr} value={mfr}>
                      {mfr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant={viaFilter === "Todas" ? "default" : "outline"}
                size="sm"
                onClick={() => setViaFilter("Todas")}
              >
                Todas
              </Button>
              <Button
                variant={viaFilter === "Central" ? "default" : "outline"}
                size="sm"
                onClick={() => setViaFilter("Central")}
              >
                Central
              </Button>
              <Button
                variant={viaFilter === "Peripheral" ? "default" : "outline"}
                size="sm"
                onClick={() => setViaFilter("Peripheral")}
              >
                Periférica
              </Button>
              {formulas.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteAll}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Deletar Tudo
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredFormulas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileSpreadsheet className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma fórmula encontrada</h3>
              <p className="text-muted-foreground mb-4">
                {formulas.length === 0
                  ? "Comece adicionando uma nova fórmula ou importando de um Excel"
                  : "Tente ajustar os filtros ou buscar por outro termo"}
              </p>
              {formulas.length === 0 && (
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={handleAdd}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Fórmula
                  </Button>
                  <Button variant="outline" asChild>
                    <label className="cursor-pointer">
                      <Upload className="mr-2 h-4 w-4" />
                      Importar Excel
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleImportExcel}
                        className="hidden"
                      />
                    </label>
                  </Button>
                  <Button variant="outline" asChild>
                    <label className="cursor-pointer">
                      <FileJson className="mr-2 h-4 w-4" />
                      Importar JSON
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportJson}
                        className="hidden"
                      />
                    </label>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={filteredFormulas.length > 0 && selectedIds.size === filteredFormulas.length}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Selecionar todas"
                      />
                    </TableHead>
                    <TableHead>Nome da Fórmula</TableHead>
                    <TableHead>Fabricante</TableHead>
                    <TableHead>Via</TableHead>
                    <TableHead>Emulsão</TableHead>
                    <TableHead className="text-right">Volume (mL)</TableHead>
                    <TableHead className="text-right">kcal</TableHead>
                    <TableHead className="text-right">Proteína (g/L)</TableHead>
                    <TableHead className="text-right">Osmolaridade</TableHead>
                    <TableHead className="text-right">Custo (R$)</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFormulas.map((formula) => (
                    <TableRow key={formula.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(formula.id)}
                          onCheckedChange={() => toggleSelectFormula(formula.id)}
                          aria-label={`Selecionar ${formula.name}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{formula.name}</TableCell>
                      <TableCell>{formula.manufacturer}</TableCell>
                      <TableCell>
                        <Badge
                          variant={formula.via === "Central" ? "default" : "secondary"}
                        >
                          {formula.via === "Central" ? "Central" : "Periférica"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{formula.emulsion_type}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{formula.volume_ml}</TableCell>
                      <TableCell className="text-right">{formula.kcal}</TableCell>
                      <TableCell className="text-right">
                        {formula.protein_g_l.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formula.osmolarity ? `${formula.osmolarity} mOsm/L` : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        R$ {formula.base_cost.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(formula)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteClick(formula.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <FormulaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        formula={editingFormula}
        onSave={handleSave}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta fórmula? Esta ação poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteManyDialogOpen} onOpenChange={setDeleteManyDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão em Massa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {selectedIds.size} fórmula(s) selecionada(s)? Esta ação poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSelectedConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir {selectedIds.size} Fórmula(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão de Todas as Fórmulas</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="text-destructive font-semibold">ATENÇÃO:</span> Tem certeza que deseja excluir TODAS as {formulas.length} fórmulas? Esta ação poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAllConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir Tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
