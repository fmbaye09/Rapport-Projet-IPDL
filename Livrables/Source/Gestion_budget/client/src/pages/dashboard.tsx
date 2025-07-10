import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import StatsCard from "@/components/dashboard/stats-card";
import { DollarSign, CheckCircle, ArrowUp, ArrowDown, Edit, Send } from "lucide-react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const currentYear = new Date().getFullYear();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const { data: budgetSummary } = useQuery({
    queryKey: ["/api/budget-analysis/summary", currentYear],
  });

  const { data: budgetLines } = useQuery({
    queryKey: ["/api/budget-lines"],
    queryFn: () => fetch("/api/budget-lines").then(res => res.json()),
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-SN", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { label: "Brouillon", className: "bg-gray-100 text-gray-800" },
      pending: { label: "En attente", className: "bg-yellow-100 text-yellow-800" },
      validated: { label: "Validé", className: "bg-green-100 text-green-800" },
      rejected: { label: "Rejeté", className: "bg-red-100 text-red-800" },
      consolidated: { label: "Consolidé", className: "bg-blue-100 text-blue-800" },
    };
    
    const config = statusMap[status as keyof typeof statusMap] || statusMap.draft;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    return type === "recette" ? (
      <Badge className="bg-green-100 text-green-800">Recette</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">Dépense</Badge>
    );
  };

  const submitLineMutation = useMutation({
    mutationFn: async (lineId: number) => {
      const response = await fetch(`/api/budget-lines/${lineId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de la soumission");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Ligne soumise",
        description: "La ligne budgétaire a été soumise pour validation",
      });
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

  const handleSubmitLine = (lineId: number) => {
    submitLineMutation.mutate(lineId);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Tableau de Bord</h2>
        <p className="text-gray-600 mt-2">Vue d'ensemble du budget {currentYear}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Budget Proposé"
          value={formatCurrency(budgetSummary?.totalProposed || 0)}
          change="+8.5% vs 2023"
          changeType="positive"
          icon={DollarSign}
          iconColor="bg-blue-100 text-blue-600"
        />
        <StatsCard
          title="Budget Réalisé"
          value={formatCurrency(budgetSummary?.totalRealized || 0)}
          change={`${Math.round(budgetSummary?.realizationRate || 0)}% du proposé`}
          changeType="neutral"
          icon={CheckCircle}
          iconColor="bg-green-100 text-green-600"
        />
        <StatsCard
          title="Recettes Prévues"
          value={formatCurrency(budgetSummary?.totalRecettes || 0)}
          change="32% du total"
          changeType="neutral"
          icon={ArrowUp}
          iconColor="bg-green-100 text-green-600"
        />
        <StatsCard
          title="Dépenses Prévues"
          value={formatCurrency(budgetSummary?.totalDepenses || 0)}
          change="68% du total"
          changeType="neutral"
          icon={ArrowDown}
          iconColor="bg-red-100 text-red-600"
        />
      </div>

      {/* Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Progression du Budget</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Lignes saisies</span>
                <span className="text-sm font-medium text-gray-900">
                  {budgetLines?.length || 0}/30
                </span>
              </div>
              <Progress value={((budgetLines?.length || 0) / 30) * 100} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Validation département</span>
                <span className="text-sm font-medium text-gray-900">
                  {budgetLines?.filter((line: any) => line.status === "validated").length || 0}/
                  {budgetLines?.length || 0}
                </span>
              </div>
              <Progress 
                value={budgetLines?.length ? 
                  (budgetLines.filter((line: any) => line.status === "validated").length / budgetLines.length) * 100 : 0} 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Répartition par Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-900">Dépenses</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {budgetSummary?.totalDepenses && budgetSummary?.totalProposed ? 
                  Math.round((budgetSummary.totalDepenses / budgetSummary.totalProposed) * 100) : 0}%
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-900">Recettes</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {budgetSummary?.totalRecettes && budgetSummary?.totalProposed ? 
                  Math.round((budgetSummary.totalRecettes / budgetSummary.totalProposed) * 100) : 0}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Budget Lines */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lignes Budgétaires Récentes</CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate("/history")}>
              Voir tout
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 text-sm font-medium text-gray-900">Code</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-900">Libellé</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-900">Type</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-900">Montant</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-900">Statut</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {budgetLines?.slice(0, 5).map((line: any) => (
                  <tr key={line.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 text-sm font-mono text-gray-900">{line.category?.code}</td>
                    <td className="p-4 text-sm text-gray-900">{line.category?.label}</td>
                    <td className="p-4">{getTypeBadge(line.category?.type)}</td>
                    <td className="p-4 text-sm font-mono text-gray-900">
                      {formatCurrency(parseFloat(line.proposedAmount))}
                    </td>
                    <td className="p-4">{getStatusBadge(line.status)}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/budget-edit/${line.id}`)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        {line.status === "draft" && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleSubmitLine(line.id)}
                            disabled={submitLineMutation.isPending}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Soumettre
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
