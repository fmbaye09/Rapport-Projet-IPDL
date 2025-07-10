import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Save, X } from "lucide-react";

const budgetEntrySchema = z.object({
  categoryId: z.number().min(1, "Sélectionnez une catégorie"),
  proposedAmount: z.string().min(1, "Montant requis"),
  year: z.number().min(2020).max(2030),
  description: z.string().optional(),
});

type BudgetEntryForm = z.infer<typeof budgetEntrySchema>;

export default function BudgetEntry() {
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories } = useQuery({
    queryKey: ["/api/budget-categories"],
  });

  const form = useForm<BudgetEntryForm>({
    resolver: zodResolver(budgetEntrySchema),
    defaultValues: {
      year: new Date().getFullYear(),
      proposedAmount: "",
      description: "",
    },
  });

  const createBudgetLineMutation = useMutation({
    mutationFn: async (data: BudgetEntryForm) => {
      const response = await fetch("/api/budget-lines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de la création");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Ligne budgétaire créée",
        description: "La ligne budgétaire a été enregistrée avec succès",
      });
      form.reset();
      setSelectedCategory(null);
      queryClient.invalidateQueries({ queryKey: ["/api/budget-lines"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BudgetEntryForm) => {
    createBudgetLineMutation.mutate(data);
  };

  const handleCategoryChange = (categoryId: string) => {
    const category = categories?.find((cat: any) => cat.id === parseInt(categoryId));
    setSelectedCategory(category);
    form.setValue("categoryId", parseInt(categoryId));
  };

  const handleReset = () => {
    form.reset();
    setSelectedCategory(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-SN", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Saisie des Besoins Budgétaires</h2>
        <p className="text-gray-600 mt-2">Ajouter une nouvelle ligne budgétaire</p>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Nouvelle Ligne Budgétaire</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category">Code Rubrique Budgétaire *</Label>
                <Select onValueChange={handleCategoryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une rubrique..." />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2">
                      <div className="font-semibold text-sm text-gray-700 mb-2">RECETTES</div>
                      {categories?.filter((cat: any) => cat.type === "recette").map((category: any) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.code} - {category.label}
                        </SelectItem>
                      ))}
                    </div>
                    <div className="p-2">
                      <div className="font-semibold text-sm text-gray-700 mb-2">DÉPENSES</div>
                      {categories?.filter((cat: any) => cat.type === "depense").map((category: any) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.code} - {category.label}
                        </SelectItem>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
                {form.formState.errors.categoryId && (
                  <p className="text-sm text-red-600">{form.formState.errors.categoryId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type de Ligne</Label>
                <Input
                  id="type"
                  value={selectedCategory ? 
                    (selectedCategory.type === "recette" ? "Recette" : "Dépense") : 
                    ""
                  }
                  placeholder="Sélectionner une rubrique"
                  disabled
                  className="bg-gray-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="proposedAmount">Montant Proposé (CFA) *</Label>
                <Input
                  id="proposedAmount"
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="Ex: 1500000"
                  {...form.register("proposedAmount")}
                />
                {form.formState.errors.proposedAmount && (
                  <p className="text-sm text-red-600">{form.formState.errors.proposedAmount.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Année Budgétaire</Label>
                <Input
                  id="year"
                  type="number"
                  min="2020"
                  max="2030"
                  {...form.register("year", { valueAsNumber: true })}
                />
                {form.formState.errors.year && (
                  <p className="text-sm text-red-600">{form.formState.errors.year.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description / Justification</Label>
              <Textarea
                id="description"
                rows={3}
                placeholder="Décrire brièvement la justification de ce besoin budgétaire..."
                {...form.register("description")}
              />
            </div>

            <Card className="bg-gray-50">
              <CardHeader>
                <CardTitle className="text-lg">Données de l'Année Précédente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Montant Proposé 2023</Label>
                    <Input
                      value="Données non disponibles"
                      disabled
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Montant Réalisé 2023</Label>
                    <Input
                      value="Données non disponibles"
                      disabled
                      className="bg-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-4 pt-6">
              <Button type="button" variant="outline" onClick={handleReset}>
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={createBudgetLineMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {createBudgetLineMutation.isPending ? "Enregistrement..." : "Enregistrer la Ligne"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
