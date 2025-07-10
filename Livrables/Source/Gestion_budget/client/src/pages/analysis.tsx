import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Percent, TrendingUp, AlertTriangle, PiggyBank, Search } from "lucide-react";

export default function Analysis() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedType, setSelectedType] = useState("all");
  const [selectedThreshold, setSelectedThreshold] = useState("all");

  const { data: budgetSummary } = useQuery({
    queryKey: ["/api/budget-analysis/summary", parseInt(selectedYear)],
  });

  const { data: budgetVariances } = useQuery({
    queryKey: ["/api/budget-analysis/variances", parseInt(selectedYear)],
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-SN", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (variancePercent: number) => {
    const absVariance = Math.abs(variancePercent);
    
    if (absVariance <= 10) {
      return <Badge className="bg-green-100 text-green-800">Conforme</Badge>;
    } else if (absVariance <= 25) {
      return <Badge className="bg-orange-100 text-orange-800">Attention</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">Critique</Badge>;
    }
  };

  const getVarianceColor = (variance: number) => {
    return variance > 0 ? "text-green-600" : variance < 0 ? "text-red-600" : "text-gray-600";
  };

  // Filter variances based on selected filters
  const filteredVariances = budgetVariances?.filter((variance: any) => {
    if (selectedType !== "all") {
      const isRecette = variance.categoryCode?.startsWith("7");
      if (selectedType === "recettes" && !isRecette) return false;
      if (selectedType === "depenses" && isRecette) return false;
    }
    
    if (selectedThreshold !== "all") {
      const threshold = parseInt(selectedThreshold);
      const absVariance = Math.abs(variance.variancePercent);
      if (absVariance <= threshold) return false;
    }
    
    return true;
  }) || [];

  // Calculate analysis statistics
  const realizationRate = budgetSummary?.realizationRate || 0;
  const averageGap = budgetVariances?.reduce((sum: number, v: any) => sum + v.variancePercent, 0) / (budgetVariances?.length || 1) || 0;
  const criticalGaps = budgetVariances?.filter((v: any) => Math.abs(v.variancePercent) > 25).length || 0;
  const savings = budgetVariances?.reduce((sum: number, v: any) => sum + (v.variance < 0 ? Math.abs(v.variance) : 0), 0) || 0;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Analyse des Écarts Budgétaires</h2>
        <p className="text-gray-600 mt-2">Comparaison entre budget proposé et réalisé</p>
      </div>

      {/* Filter Bar */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Année</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                  <SelectItem value="2021">2021</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="recettes">Recettes</SelectItem>
                  <SelectItem value="depenses">Dépenses</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Seuil d'écart</Label>
              <Select value={selectedThreshold} onValueChange={setSelectedThreshold}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="10">&gt; 10%</SelectItem>
                  <SelectItem value="20">&gt; 20%</SelectItem>
                  <SelectItem value="50">&gt; 50%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1"></div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Search className="w-4 h-4 mr-2" />
              Filtrer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taux de Réalisation</p>
                <p className="text-2xl font-bold text-gray-900">{realizationRate.toFixed(1)}%</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Percent className="text-green-600 text-xl" />
              </div>
            </div>
            <div className="mt-4">
              <Progress value={realizationRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Écart Moyen</p>
                <p className={`text-2xl font-bold ${getVarianceColor(averageGap)}`}>
                  {averageGap > 0 ? "+" : ""}{averageGap.toFixed(1)}%
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <TrendingUp className="text-orange-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Écarts Critiques</p>
                <p className="text-2xl font-bold text-gray-900">{criticalGaps}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <AlertTriangle className="text-red-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Économies</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(savings)}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <PiggyBank className="text-blue-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis Table */}
      <Card>
        <CardHeader>
          <CardTitle>Analyse Détaillée des Écarts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 text-sm font-medium text-gray-900">Code</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-900">Libellé</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-900">Proposé {selectedYear}</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-900">Réalisé {selectedYear}</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-900">Écart</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-900">Écart %</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-900">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filteredVariances.map((variance: any, index: number) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-4 text-sm font-mono text-gray-900">{variance.categoryCode}</td>
                    <td className="p-4 text-sm text-gray-900">{variance.categoryLabel}</td>
                    <td className="p-4 text-sm font-mono text-gray-900">
                      {formatCurrency(variance.proposed)}
                    </td>
                    <td className="p-4 text-sm font-mono text-gray-900">
                      {formatCurrency(variance.realized)}
                    </td>
                    <td className={`p-4 text-sm font-mono ${getVarianceColor(variance.variance)}`}>
                      {variance.variance > 0 ? "+" : ""}{formatCurrency(variance.variance)}
                    </td>
                    <td className={`p-4 text-sm ${getVarianceColor(variance.variancePercent)}`}>
                      {variance.variancePercent > 0 ? "+" : ""}{variance.variancePercent.toFixed(1)}%
                    </td>
                    <td className="p-4">
                      {getStatusBadge(variance.variancePercent)}
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
