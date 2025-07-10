import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Calendar, TrendingUp, TrendingDown, Eye, Edit } from "lucide-react";

export default function History() {
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: budgetLines } = useQuery({
    queryKey: ["/api/budget-lines"],
    queryFn: () => fetch("/api/budget-lines").then(res => res.json()),
  });

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("fr-SN", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
    }).format(numAmount);
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

  const getVarianceDisplay = (proposed: number, realized: number) => {
    if (!realized || !proposed) return "N/A";
    
    const variance = realized - proposed;
    const variancePercent = (variance / proposed) * 100;
    const isPositive = variance > 0;
    
    return (
      <div className="flex items-center space-x-2">
        <span className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {formatCurrency(variance)}
        </span>
        <div className="flex items-center">
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
          <span className={`text-xs ml-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {variancePercent.toFixed(1)}%
          </span>
        </div>
      </div>
    );
  };

  // Filter data based on selections
  const filteredData = budgetLines?.filter((line: any) => {
    if (selectedYear !== "all" && line.year.toString() !== selectedYear) return false;
    if (selectedType !== "all") {
      const isRecette = line.category?.type === "recette";
      if (selectedType === "recettes" && !isRecette) return false;
      if (selectedType === "depenses" && isRecette) return false;
    }
    if (searchTerm && !line.category?.label.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !line.category?.code.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    
    return true;
  }) || [];

  // Group data by year for statistics
  const yearlyStats = filteredData.reduce((acc: any, line: any) => {
    const year = line.year;
    if (!acc[year]) {
      acc[year] = {
        totalProposed: 0,
        totalRealized: 0,
        count: 0,
        recettes: 0,
        depenses: 0,
      };
    }
    
    acc[year].totalProposed += parseFloat(line.proposedAmount);
    acc[year].totalRealized += parseFloat(line.realizedAmount || "0");
    acc[year].count += 1;
    
    if (line.category?.type === "recette") {
      acc[year].recettes += parseFloat(line.proposedAmount);
    } else {
      acc[year].depenses += parseFloat(line.proposedAmount);
    }
    
    return acc;
  }, {});

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Historique des Budgets</h2>
        <p className="text-gray-600 mt-2">Consulter les budgets des années précédentes</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Filtrer par année</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les années</SelectItem>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
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
            
            <div className="flex-1 min-w-48">
              <Label className="text-sm font-medium text-gray-700">Rechercher</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par code ou libellé..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Yearly Statistics */}
      {Object.keys(yearlyStats).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Object.entries(yearlyStats).map(([year, stats]: [string, any]) => (
            <Card key={year}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                  Année {year}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Proposé:</span>
                    <span className="font-medium">{formatCurrency(stats.totalProposed)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Réalisé:</span>
                    <span className="font-medium">{formatCurrency(stats.totalRealized)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Lignes:</span>
                    <span className="font-medium">{stats.count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Taux:</span>
                    <span className="font-medium">
                      {stats.totalProposed > 0 ? 
                        Math.round((stats.totalRealized / stats.totalProposed) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Historical Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Données Historiques</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 text-sm font-medium text-gray-900">Année</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-900">Code</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-900">Libellé</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-900">Type</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-900">Proposé</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-900">Réalisé</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-900">Écart</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-900">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500">
                      Aucune donnée trouvée pour les critères sélectionnés
                    </td>
                  </tr>
                ) : (
                  filteredData.map((line: any) => (
                    <tr key={line.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 text-sm font-medium text-gray-900">{line.year}</td>
                      <td className="p-4 text-sm font-mono text-gray-900">{line.category?.code}</td>
                      <td className="p-4 text-sm text-gray-900">{line.category?.label}</td>
                      <td className="p-4">
                        <Badge className={
                          line.category?.type === "recette" ? 
                          "bg-green-100 text-green-800" : 
                          "bg-red-100 text-red-800"
                        }>
                          {line.category?.type === "recette" ? "Recette" : "Dépense"}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm font-mono text-gray-900">
                        {formatCurrency(line.proposedAmount)}
                      </td>
                      <td className="p-4 text-sm font-mono text-gray-900">
                        {line.realizedAmount ? formatCurrency(line.realizedAmount) : "N/A"}
                      </td>
                      <td className="p-4">
                        {getVarianceDisplay(
                          parseFloat(line.proposedAmount),
                          parseFloat(line.realizedAmount || "0")
                        )}
                      </td>
                      <td className="p-4">
                        {getStatusBadge(line.status)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
