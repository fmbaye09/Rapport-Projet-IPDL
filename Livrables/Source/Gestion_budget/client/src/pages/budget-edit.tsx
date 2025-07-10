import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Save, X, ArrowLeft } from "lucide-react";

const budgetEditSchema = z.object({
  categoryId: z.number().min(1, "Sélectionnez une catégorie"),
  proposedAmount: z.string().min(1, "Montant requis"),
  realizedAmount: z.string().optional(),
  year: z.number().min(2020).max(2030),
  description: z.string().optional(),
});

type BudgetEditForm = z.infer<typeof budgetEditSchema>;

export default function BudgetEdit() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/budget-edit/:id");
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const budgetLineId = params?.id ? parseInt(params.id) : null;

  const { data: categories } = useQuery({
    queryKey: ["/api/budget-categories"],
  });

  const { data: budgetLine } = useQuery({
    queryKey: ["/api/budget-lines", budgetLineId],
    queryFn: () => fetch(`/api/budget-lines/${budgetLineId}`).then(res => res.json()),
    enabled: !!budgetLineId,
  });

  const form = useForm<BudgetEditForm>({
    resolver: zodResolver(budgetEditSchema),
    defaultValues: {
      year: new Date().getFullYear(),
      proposedAmount: "",
      realizedAmount: "",
      description: "",
    },
  });

  useEffect(() => {
    if (budgetLine) {
      form.setValue("categoryId", budgetLine.categoryId);
      form.setValue("proposedAmount", budgetLine.proposedAmount.toString());
      form.setValue("realizedAmount", budgetLine.realizedAmount?.toString() || "");
      form.setValue("year", budgetLine.year);
      form.setValue("description", budgetLine.description || "");
      
      const category = categories?.find((cat: any) => cat.id === budgetLine.categoryId);
      setSelectedCategory(category);
    }
  }, [budgetLine, categories, form]);

  const updateBudgetLineMutation = useMutation({
    mutationFn: async (data: BudgetEditForm) => {
      const response = await fetch(`/api/budget-lines/${budgetLineId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de la mise à jour");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Ligne budgétaire mise à jour",
        description: "La ligne budgétaire a été mise à jour avec succès",
      });
      navigate("/dashboard");
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

  const onSubmit = (data: BudgetEditForm) => {
    updateBudgetLineMutation.mutate(data);
  };

  const handleCategoryChange = (categoryId: string) => {
    const category = categories?.find((cat: any) => cat.id === parseInt(categoryId));
    setSelectedCategory(category);
    form.setValue("categoryId", parseInt(categoryId));
  };

  const handleCancel = () => {
    navigate("/dashboard");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-SN", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (!budgetLineId) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ligne budgétaire non trouvée</h2>
          <Button onClick={() => navigate("/dashboard")}>
            Retour au tableau de bord
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <h2 className="text-3xl font-bold text-gray-900">Modifier la Ligne Budgétaire</h2>
        <p className="text-gray-600 mt-2">Modifiez les détails de votre ligne budgétaire</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Informations de la Ligne Budgétaire</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="year">Année Budgétaire</Label>
                  <Input
                    id="year"
                    type="number"
                    {...form.register("year", { valueAsNumber: true })}
                    min={2020}
                    max={2030}
                  />
                  {form.formState.errors.year && (
                    <p className="text-sm text-red-600 mt-1">{form.formState.errors.year.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="category">Catégorie Budgétaire</Label>
                  <Select onValueChange={handleCategoryChange} value={selectedCategory?.id?.toString()}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((category: any) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.code} - {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.categoryId && (
                    <p className="text-sm text-red-600 mt-1">{form.formState.errors.categoryId.message}</p>
                  )}
                </div>
              </div>

              {selectedCategory && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Détails de la Catégorie</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Code:</span>
                      <span className="ml-2 font-mono">{selectedCategory.code}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Type:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                        selectedCategory.type === "recette" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {selectedCategory.type === "recette" ? "Recette" : "Dépense"}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 mt-2">{selectedCategory.label}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="proposedAmount">Montant Proposé (XOF)</Label>
                  <Input
                    id="proposedAmount"
                    type="number"
                    {...form.register("proposedAmount")}
                    placeholder="Ex: 100000"
                  />
                  {form.formState.errors.proposedAmount && (
                    <p className="text-sm text-red-600 mt-1">{form.formState.errors.proposedAmount.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="realizedAmount">Montant Réalisé (XOF)</Label>
                  <Input
                    id="realizedAmount"
                    type="number"
                    {...form.register("realizedAmount")}
                    placeholder="Ex: 95000"
                  />
                  {form.formState.errors.realizedAmount && (
                    <p className="text-sm text-red-600 mt-1">{form.formState.errors.realizedAmount.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description (optionnel)</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  placeholder="Ajoutez des détails ou des commentaires..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={updateBudgetLineMutation.isPending}
                >
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={updateBudgetLineMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateBudgetLineMutation.isPending ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}