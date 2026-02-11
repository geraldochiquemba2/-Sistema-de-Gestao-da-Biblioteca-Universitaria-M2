import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Calendar, AlertCircle, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function StaffDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: loans, isLoading: loansLoading } = useQuery({
    queryKey: ["/api/loans/user", user?.id],
    enabled: !!user?.id,
  });

  const { data: fines, isLoading: finesLoading } = useQuery({
    queryKey: ["/api/fines/user", user?.id],
    enabled: !!user?.id,
  });

  const { data: loanRequests } = useQuery({
    queryKey: ["/api/loan-requests", { userId: user?.id, status: "pending" }],
    enabled: !!user?.id,
  });

  if (!user) {
    return null;
  }

  const loansArray = Array.isArray(loans) ? loans : [];
  const finesArray = Array.isArray(fines) ? fines : [];
  const activeLoans = loansArray.filter((l: any) => l.status === "active");
  const pendingFines = finesArray.filter((f: any) => f.status === "pending");
  const totalFines = pendingFines.reduce((sum: number, f: any) => sum + parseFloat(f.amount), 0);

  const isLoading = loansLoading || finesLoading;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">Área do Funcionário</h1>
            <p className="text-sm text-muted-foreground">Bem-vindo, {user?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setLocation("/staff/books")} data-testid="button-search-books">
              <Search className="h-4 w-4 mr-2" />
              Buscar Livros
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-4 mb-8">
              <Card
                className="cursor-pointer hover-elevate active-elevate-2"
                onClick={() => setLocation("/staff/loans")}
                data-testid="card-active-loans"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Empréstimos e Solicitações</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-active-loans">
                    {activeLoans.length + (Array.isArray(loanRequests) ? loanRequests.length : 0)}/2
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {activeLoans.length} ativos, {Array.isArray(loanRequests) ? loanRequests.length : 0} pendentes
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Prazo de Empréstimo</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">5 dias</div>
                  <p className="text-xs text-muted-foreground">
                    Livros com etiqueta cor branca
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Prazo de Empréstimo</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1 dia</div>
                  <p className="text-xs text-muted-foreground">
                    Livros com etiqueta cor amarela
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Multas Pendentes</CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-fines">{totalFines} Kz</div>
                  <p className="text-xs text-muted-foreground">
                    {pendingFines.length} multa(s) pendente(s)
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-1 mb-8">

              <Card>
                <CardHeader>
                  <CardTitle>Regras de Empréstimo para Funcionários</CardTitle>
                  <CardDescription>Informações importantes sobre seus empréstimos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Limites:</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Máximo de 2 livros simultâneos</li>
                      <li>Prazo de 5 dias para livros com etiqueta cor branca</li>
                      <li>Livros com etiqueta cor amarela: apenas 1 dia</li>
                      <li>Livros com etiqueta cor vermelha: uso exclusivo na biblioteca</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Restrições:</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Não é permitido ter títulos repetidos</li>
                      <li>Multas acima de 2000 Kz bloqueiam novos empréstimos</li>
                      <li>Multa de 500 Kz por dia de atraso</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
