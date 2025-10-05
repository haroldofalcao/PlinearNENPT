import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Formula } from "@/types/formula";

const formulaSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  manufacturer: z.string().min(1, "Fabricante é obrigatório"),
  volume_ml: z.coerce.number().positive("Volume deve ser positivo"),
  kcal: z.coerce.number().positive("Kcal deve ser positivo"),
  protein_g_l: z.coerce.number().min(0, "Proteína deve ser maior ou igual a 0"),
  nitrogen_g_l: z.coerce.number().min(0, "Nitrogênio deve ser maior ou igual a 0"),
  glucose_g_l: z.coerce.number().min(0, "Glicose deve ser maior ou igual a 0"),
  fat_g_l: z.coerce.number().min(0, "Gordura deve ser maior ou igual a 0"),
  emulsion_type: z.enum(["Soja", "TCM/TCL", "SMOF", "Oliva/TCL", "Sem lipídio"]),
  via: z.enum(["Central", "Peripheral"]),
  base_cost: z.coerce.number().positive("Custo deve ser positivo"),
  osmolarity: z.coerce.number().min(0, "Osmolaridade deve ser maior ou igual a 0").optional(),
});

type FormulaFormValues = z.infer<typeof formulaSchema>;

interface FormulaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formula?: Formula | null;
  onSave: (data: Omit<Formula, "id"> & { id?: string }) => void;
}

export function FormulaDialog({
  open,
  onOpenChange,
  formula,
  onSave,
}: FormulaDialogProps) {
  const form = useForm<FormulaFormValues>({
    resolver: zodResolver(formulaSchema),
    defaultValues: {
      name: "",
      manufacturer: "",
      volume_ml: 0,
      kcal: 0,
      protein_g_l: 0,
      nitrogen_g_l: 0,
      glucose_g_l: 0,
      fat_g_l: 0,
      emulsion_type: "Soja",
      via: "Central",
      base_cost: 0,
      osmolarity: 0,
    },
  });

  useEffect(() => {
    if (formula) {
      form.reset({
        name: formula.name,
        manufacturer: formula.manufacturer,
        volume_ml: formula.volume_ml,
        kcal: formula.kcal,
        protein_g_l: formula.protein_g_l,
        nitrogen_g_l: formula.nitrogen_g_l,
        glucose_g_l: formula.glucose_g_l,
        fat_g_l: formula.fat_g_l,
        emulsion_type: formula.emulsion_type,
        via: formula.via,
        base_cost: formula.base_cost,
        osmolarity: formula.osmolarity || 0,
      });
    } else {
      form.reset({
        name: "",
        manufacturer: "",
        volume_ml: 0,
        kcal: 0,
        protein_g_l: 0,
        nitrogen_g_l: 0,
        glucose_g_l: 0,
        fat_g_l: 0,
        emulsion_type: "Soja",
        via: "Central",
        base_cost: 0,
        osmolarity: 0,
      });
    }
  }, [formula, form]);

  const onSubmit = (data: FormulaFormValues) => {
    if (formula) {
      onSave({ ...data, id: formula.id } as Formula);
    } else {
      onSave(data as Omit<Formula, "id">);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {formula ? "Editar Fórmula" : "Nova Fórmula"}
          </DialogTitle>
          <DialogDescription>
            {formula
              ? "Atualize as informações da fórmula"
              : "Preencha os dados da nova fórmula"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nome da fórmula" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="manufacturer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fabricante</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nome do fabricante" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="volume_ml"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Volume (mL)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="kcal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kcal</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="protein_g_l"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proteína (g/L)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.1" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nitrogen_g_l"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nitrogênio (g/L)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.1" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="glucose_g_l"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Glicose (g/L)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.1" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fat_g_l"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gordura (g/L)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.1" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emulsion_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Emulsão</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Soja">Soja</SelectItem>
                        <SelectItem value="TCM/TCL">TCM/TCL</SelectItem>
                        <SelectItem value="SMOF">SMOF</SelectItem>
                        <SelectItem value="Oliva/TCL">Oliva/TCL</SelectItem>
                        <SelectItem value="Sem lipídio">Sem lipídio</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="via"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Via</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Central">Central</SelectItem>
                        <SelectItem value="Peripheral">Periférica</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="base_cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custo Base (R$)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="osmolarity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Osmolaridade (mOsm/L)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="1" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {formula ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
