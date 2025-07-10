import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Edit, Eye, Clock, Calculator } from "lucide-react";

export default function Consolidation() {
  const [selectedLines, setSelectedLines] = useState<number[]>([]);
  const [validationDialog, setValidationDialog] = useState<{
    open: boolean;
    lineId: number | null;
    line: any;
  }>({ open: false, lineId: null, line: null });
  const [rejectionReason, setRejectionReason] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pendingLines } = useQuery({
    queryKey: ["/api/consolidation/pending"],
    queryFn: () => fetch("/api/consolidation/pending").then(res => res.json()),
  });

  const { data: budgetLines } = useQuery({
    queryKey: ["/api/budget-lines"],
    queryFn: () => fetch("/api/budget-lines").then(res => res.json()),
  });

  const validateLineMutation = useMutation({
    mutationFn: async ({ lineId, approved, rejectionReason }: {
      lineId: number;
      approved: boolean;
      rejectionReason?: string;
    }) => {
      const response = await fetch(`/api/consolidation/validate/${lineId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved, rejectionReason }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de la validation");
      }
      
      return response.json();
    },
    onSuccess: (_, { approved }) => {
      toast({
        title: approved ? "Ligne validée" : "Ligne rejetée",
        description: approved ? 
          "La ligne budgétaire a été validée avec succès" : 
          "La ligne budgétaire a été rejetée",
      });
      setValidationDialog({ open: false, lineId: null, line: null });
      setRejectionReason("");
      queryClient.invalidateQueries({ queryKey: ["/api/consolidation/pending"] });
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

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("fr-SN", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
    }).format(numAmount);
  };

  const handleLineSelect = (lineId: number, checked: boolean) => {
    if (checked) {
      setSelectedLines([...selectedLines, lineId]);
    } else {
      setSelectedLines(selectedLines.filter(id => id !== lineId));
    }
  };

  const handleValidate = (line: any, approved: boolean) => {
    if (approved) {
      // Auto-validate if approved
      validateLineMutation.mutate({ lineId: line.id, approved: true });
    } else {
      // Open dialog for rejection
      setValidationDialog({ open: true, lineId: line.id, line });
    }
  };

  const handleBulkValidate = () => {
    if (selectedLines.length > 0) {
      selectedLines.forEach(lineId => {
        validateLineMutation.mutate({ lineId, approved: true });
      });
      setSelectedLines([]);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLines(pendingLines?.map((line: any) => line.id) || []);
    } else {
      setSelectedLines([]);
    }
  };

  const handleReject = () => {
    if (validationDialog.lineId && rejectionReason.trim()) {
      validateLineMutation.mutate({
        lineId: validationDialog.lineId,
        approved: false,
        rejectionReason: rejectionReason.trim(),
      });
    }
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
    if (!realized) return "N/A";
    const variance = ((realized - proposed) / proposed) * 100;
    const color = variance > 0 ? "text-green-600" : variance < 0 ? "text-red-600" : "text-gray-600";
    return <span className={`text-sm ${color}`}>{variance > 0 ? "+" : ""}{variance.toFixed(1)}%</span>;
  };

  // Calculate summary statistics
  const pendingCount = pendingLines?.length || 0;
  const validatedCount = budgetLines?.filter((line: any) => line.status === "validated").length || 0;
  const totalConsolidated = budgetLines?.reduce((sum: number, line: any) => 
    sum + (line.status === "validated" ? parseFloat(line.proposedAmount) : 0), 0) || 0;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Consolidation Départementale</h2>
        <p className="text-gray-600 mt-2">Validation et consolidation des lignes budgétaires</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lignes en Attente de Validation</CardTitle>
            <div className="flex space-x-3">
              <Button
                className="bg-green-600 hover:bg-green-700"
                disabled={selectedLines.length === 0}
                onClick={handleBulkValidate}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Tout Valider ({selectedLines.length})
              </Button>
              <Button variant="outline" onClick={() => toast({
                title: "Prévisualisation",
                description: "Fonctionnalité de prévisualisation en développement",
              })}>
                <Eye className="w-4 h-4 mr-2" />
                Prévisualiser
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">
                    <Checkbox 
                      checked={selectedLines.length === pendingLines?.length && pendingLines?.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-gray-900">Code</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-900">Libellé</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-900">Utilisateur</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-900">Montant</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-900">Écart 2023</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingLines?.map((line: any) => (
                  <tr key={line.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <Checkbox
                        checked={selectedLines.includes(line.id)}
                        onCheckedChange={(checked) => handleLineSelect(line.id, checked as boolean)}
                      />
                    </td>
                    <td className="p-4 text-sm font-mono text-gray-900">{line.category?.code}</td>
                    <td className="p-4 text-sm text-gray-900">{line.category?.label}</td>
                    <td className="p-4 text-sm text-gray-600">{line.user?.name}</td>
                    <td className="p-4 text-sm font-mono text-gray-900">
                      {formatCurrency(line.proposedAmount)}
                    </td>
                    <td className="p-4">
                      {getVarianceDisplay(parseFloat(line.proposedAmount), parseFloat(line.realizedAmount || "0"))}
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-green-600 hover:text-green-700"
                          onClick={() => handleValidate(line, true)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-blue-600 hover:text-blue-700"
                          onClick={() => toast({
                            title: "Édition",
                            description: "Fonctionnalité d'édition en développement",
                          })}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleValidate(line, false)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Lignes en Attente</p>
                <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Clock className="text-yellow-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Lignes Validées</p>
                <p className="text-2xl font-bold text-gray-900">{validatedCount}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="text-green-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Consolidé</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalConsolidated)}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Calculator className="text-blue-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rejection Dialog */}
      <Dialog 
        open={validationDialog.open && !validateLineMutation.isPending} 
        onOpenChange={(open) => !open && setValidationDialog({ open: false, lineId: null, line: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter la ligne budgétaire</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Ligne budgétaire</Label>
              <p className="text-sm text-gray-600">
                {validationDialog.line?.category?.code} - {validationDialog.line?.category?.label}
              </p>
            </div>
            <div>
              <Label htmlFor="rejectionReason">Motif de rejet *</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Expliquez pourquoi cette ligne est rejetée..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setValidationDialog({ open: false, lineId: null, line: null })}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
            >
              Rejeter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
