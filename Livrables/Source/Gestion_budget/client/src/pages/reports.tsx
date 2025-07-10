import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { FileSpreadsheet, FileText, BarChart3, Download, Trash2 } from "lucide-react";

export default function Reports() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedType, setSelectedType] = useState("budget");
  const [selectedFormat, setSelectedFormat] = useState("detailed");
  const [includeRecettes, setIncludeRecettes] = useState(true);
  const [includeDepenses, setIncludeDepenses] = useState(true);
  const [includeAnalysis, setIncludeAnalysis] = useState(true);
  const [includeDetails, setIncludeDetails] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reports } = useQuery({
    queryKey: ["/api/reports"],
    queryFn: () => fetch("/api/reports").then(res => res.json()),
  });

  const generateReportMutation = useMutation({
    mutationFn: async (data: {
      year: string;
      type: string;
      format: string;
      sections: string[];
    }) => {
      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de la génération");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Rapport généré",
        description: `Le rapport ${data.filename} a été généré avec succès`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: number) => {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de la suppression");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Rapport supprimé",
        description: "Le rapport a été supprimé avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGenerateExcel = () => {
    const sections = [];
    if (includeRecettes) sections.push("recettes");
    if (includeDepenses) sections.push("depenses");
    if (includeAnalysis) sections.push("analysis");
    if (includeDetails) sections.push("details");
    
    generateReportMutation.mutate({
      year: selectedYear,
      type: selectedType,
      format: "excel",
      sections
    });
  };

  const handleGeneratePDF = () => {
    const sections = [];
    if (includeRecettes) sections.push("recettes");
    if (includeDepenses) sections.push("depenses");
    if (includeAnalysis) sections.push("analysis");
    if (includeDetails) sections.push("details");
    
    generateReportMutation.mutate({
      year: selectedYear,
      type: selectedType,
      format: "pdf",
      sections
    });
  };

  const handleDeleteReport = (reportId: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce rapport ?")) {
      deleteReportMutation.mutate(reportId);
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Génération de Rapports</h2>
        <p className="text-gray-600 mt-2">Exporter les données budgétaires</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Options */}
        <Card>
          <CardHeader>
            <CardTitle>Options d'Export</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileSpreadsheet className="text-green-600 text-2xl mr-4" />
                  <div>
                    <h4 className="font-medium text-gray-900">Projet de Budget Excel</h4>
                    <p className="text-sm text-gray-600">Format compatible avec les outils financiers</p>
                  </div>
                </div>
                <Button
                  onClick={handleGenerateExcel}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={generateReportMutation.isPending}
                >
                  {generateReportMutation.isPending ? "Génération..." : "Exporter"}
                </Button>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="text-red-600 text-2xl mr-4" />
                  <div>
                    <h4 className="font-medium text-gray-900">Rapport PDF</h4>
                    <p className="text-sm text-gray-600">Document officiel pour présentation</p>
                  </div>
                </div>
                <Button
                  onClick={handleGeneratePDF}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={generateReportMutation.isPending}
                >
                  {generateReportMutation.isPending ? "Génération..." : "Exporter"}
                </Button>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <BarChart3 className="text-blue-600 text-2xl mr-4" />
                  <div>
                    <h4 className="font-medium text-gray-900">Rapport d'Analyse</h4>
                    <p className="text-sm text-gray-600">Analyse des écarts et recommandations</p>
                  </div>
                </div>
                <Button
                  onClick={() => generateReportMutation.mutate({
                    year: selectedYear,
                    type: "analysis",
                    format: "pdf",
                    sections: ["analysis"],
                  })}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={generateReportMutation.isPending}
                >
                  {generateReportMutation.isPending ? "Génération..." : "Exporter"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration du Rapport</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Période</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025">Budget 2025</SelectItem>
                  <SelectItem value="2024">Budget 2024</SelectItem>
                  <SelectItem value="2023">Budget 2023</SelectItem>
                  <SelectItem value="comparison">Comparaison 2024-2025</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">Sections à inclure</Label>
              <div className="space-y-2 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="recettes"
                    checked={includeRecettes}
                    onCheckedChange={setIncludeRecettes}
                  />
                  <Label htmlFor="recettes" className="text-sm text-gray-700">Recettes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="depenses"
                    checked={includeDepenses}
                    onCheckedChange={setIncludeDepenses}
                  />
                  <Label htmlFor="depenses" className="text-sm text-gray-700">Dépenses</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="analysis"
                    checked={includeAnalysis}
                    onCheckedChange={setIncludeAnalysis}
                  />
                  <Label htmlFor="analysis" className="text-sm text-gray-700">Analyse des écarts</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="details"
                    checked={includeDetails}
                    onCheckedChange={setIncludeDetails}
                  />
                  <Label htmlFor="details" className="text-sm text-gray-700">Détails par service</Label>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">Format de sortie</Label>
              <RadioGroup value={selectedFormat} onValueChange={setSelectedFormat} className="mt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="detailed" id="detailed" />
                  <Label htmlFor="detailed" className="text-sm text-gray-700">Détaillé</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="summary" id="summary" />
                  <Label htmlFor="summary" className="text-sm text-gray-700">Résumé</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Exports */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Exports Récents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 text-sm font-medium text-gray-900">Nom du fichier</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-900">Type</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-900">Date</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-900">Taille</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      Aucun rapport généré pour le moment
                    </td>
                  </tr>
                ) : (
                  reports?.map((report: any) => (
                    <tr key={report.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 text-sm text-gray-900">{report.filename}</td>
                      <td className="p-4">
                        <Badge className={
                          report.type.includes("excel") ? "bg-green-100 text-green-800" :
                          report.type.includes("pdf") ? "bg-red-100 text-red-800" :
                          "bg-blue-100 text-blue-800"
                        }>
                          {report.type.includes("excel") ? "Excel" :
                           report.type.includes("pdf") ? "PDF" : "Autre"}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {formatDate(report.createdAt)}
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {formatFileSize(report.fileSize)}
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700"
                            onClick={() => window.open(report.filePath, '_blank')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteReport(report.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
