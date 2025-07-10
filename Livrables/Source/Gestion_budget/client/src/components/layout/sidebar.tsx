import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { authApi } from "@/lib/auth";
import { 
  University, 
  BarChart3, 
  PlusCircle, 
  Layers, 
  TrendingUp, 
  FileText, 
  History,
  LogOut
} from "lucide-react";

const getNavigationForRole = (role: string) => {
  const baseNavigation = [
    { name: "Tableau de Bord", href: "/", icon: BarChart3, roles: ["user", "chef_dept", "direction", "comptable"] },
    { name: "Saisie des Besoins", href: "/budget-entry", icon: PlusCircle, roles: ["user", "chef_dept", "direction"] },
    { name: "Consolidation", href: "/consolidation", icon: Layers, roles: ["chef_dept", "direction"] },
    { name: "Analyse & Écarts", href: "/analysis", icon: TrendingUp, roles: ["chef_dept", "direction", "comptable"] },
    { name: "Rapports", href: "/reports", icon: FileText, roles: ["chef_dept", "direction", "comptable"] },
    { name: "Historique", href: "/history", icon: History, roles: ["chef_dept", "direction", "comptable"] },
  ];

  return baseNavigation.filter(item => item.roles.includes(role));
};

export default function Sidebar() {
  const [location] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: auth } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: () => authApi.getMe(),
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur lors de la déconnexion",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  const getRoleDisplay = (role: string) => {
    const roleMap = {
      user: "Utilisateur",
      chef_dept: "Chef de Département",
      direction: "Direction",
      comptable: "Comptable",
    };
    return roleMap[role as keyof typeof roleMap] || role;
  };

  return (
    <aside className="w-64 bg-white shadow-lg flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center">
          <div className="bg-blue-600 w-12 h-12 rounded-lg flex items-center justify-center">
            <University className="text-white text-xl" />
          </div>
          <div className="ml-3">
            <h1 className="text-lg font-bold text-gray-900">GEST-BUDGET</h1>
            <p className="text-sm text-gray-600">UCAD / ESP</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {getNavigationForRole(auth?.user?.role || "user").map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={`flex items-center p-3 rounded-lg text-gray-600 hover:bg-blue-600 hover:text-white transition-all duration-200 cursor-pointer ${
                  isActive ? "bg-blue-600 text-white" : ""
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center mb-4">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-blue-100 text-blue-600">
              {auth?.user ? getInitials(auth.user.name) : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <p className="font-medium text-gray-900">{auth?.user?.name}</p>
            <p className="text-sm text-gray-600">{auth?.user ? getRoleDisplay(auth.user.role) : ""}</p>
          </div>
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full text-red-600 border-red-600 hover:bg-red-50"
          disabled={logoutMutation.isPending}
        >
          <LogOut className="w-4 h-4 mr-2" />
          {logoutMutation.isPending ? "Déconnexion..." : "Déconnexion"}
        </Button>
      </div>
    </aside>
  );
}
