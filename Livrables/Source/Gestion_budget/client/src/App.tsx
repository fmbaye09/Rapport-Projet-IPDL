import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "./lib/auth";
import LoginPage from "./pages/login";
import MainLayout from "./components/layout/main-layout";
import Dashboard from "./pages/dashboard";
import BudgetEntry from "./pages/budget-entry";
import BudgetEdit from "./pages/budget-edit";
import Consolidation from "./pages/consolidation";
import Analysis from "./pages/analysis";
import Reports from "./pages/reports";
import History from "./pages/history";
import NotFound from "@/pages/not-found";

function AuthCheck({ children }: { children: React.ReactNode }) {
  const { data: auth, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: () => authApi.getMe(),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!auth?.user) {
    return <LoginPage />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <AuthCheck>
      <MainLayout>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/budget-entry" component={BudgetEntry} />
          <Route path="/budget-edit/:id" component={BudgetEdit} />
          <Route path="/consolidation" component={Consolidation} />
          <Route path="/analysis" component={Analysis} />
          <Route path="/reports" component={Reports} />
          <Route path="/history" component={History} />
          <Route component={NotFound} />
        </Switch>
      </MainLayout>
    </AuthCheck>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
