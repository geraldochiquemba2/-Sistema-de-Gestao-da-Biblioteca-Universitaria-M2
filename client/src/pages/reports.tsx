import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, Users, BookOpen, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { useQuery } from "@tanstack/react-query";

interface FinancialStats {
  totalFinesAmount: number;
  paidFinesAmount: number;
  pendingFines: number;
  blockedUsers: number;
}

interface Stats extends FinancialStats {
  totalBooks: number;
  availableBooks: number;
  totalCopies: number;
  totalAvailableCopies: number;
  activeLoans: number;
}

interface CategoryStat {
  name: string;
  loans: number;
  percentage: number;
}

interface UserActivity {
  id: string;
  name: string;
  loans: number;
  type: string;
}

export default function Reports() {
  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery<CategoryStat[]>({
    queryKey: ["/api/reports/categories"],
  });

  // We can reuse /api/users to get most active users if we sort them, or a new endpoint.
  // For now, let's fetch all users, which now includes 'currentLoans', and sort client side.
  const { data: users, isLoading: usersLoading } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  const activeUsers = users
    ?.sort((a, b) => b.currentLoans - a.currentLoans)
    .slice(0, 5)
    .map(u => ({
      name: u.name,
      loans: u.currentLoans,
      type: u.userType
    })) || [];

  if (statsLoading || categoriesLoading || usersLoading) {
    return <div className="p-6">Carregando relatórios...</div>;
  }

  const utilizationRate = stats?.totalCopies ? Math.round((stats.activeLoans / stats.totalCopies) * 100) : 0;

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios e Análises</h1>
          <p className="text-muted-foreground">
            Métricas de desempenho e estatísticas da biblioteca
          </p>
        </div>
        <Button data-testid="button-export-report">
          <Download className="h-4 w-4 mr-2" />
          Exportar Relatório
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Utilização</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{utilizationRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.activeLoans} de {stats?.totalCopies.toLocaleString()} exemplares
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponíveis</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalAvailableCopies}</div>
            <p className="text-xs text-muted-foreground mt-1">Exemplares nas prateleiras</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Multas</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalFinesAmount.toLocaleString()} Kz</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.paidFinesAmount.toLocaleString()} Kz cobrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilizadores Bloqueados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.blockedUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">Por multas pendentes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Principais Categorias por Empréstimos</CardTitle>
            <CardDescription>Categorias de livros mais populares este mês</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categories?.map((category, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium truncate">{category.name}</p>
                      <span className="text-sm text-muted-foreground ml-2">
                        {category.loans} empréstimos
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                  </div>
                  <Badge variant="outline">{category.percentage}%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Utilizadores Mais Ativos</CardTitle>
            <CardDescription>Top 5 utilizadores por número de empréstimos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeUsers.map((user, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">{user.type}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-lg">{user.loans}</p>
                    <p className="text-xs text-muted-foreground">empréstimos</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumo Financeiro</CardTitle>
          <CardDescription>Cobrança de multas e valores pendentes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Total de Multas Emitidas</p>
              <p className="text-3xl font-bold">{stats?.totalFinesAmount.toLocaleString()} Kz</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Multas Pagas</p>
              <p className="text-3xl font-bold text-chart-2">{stats?.paidFinesAmount.toLocaleString()} Kz</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats && stats.totalFinesAmount > 0
                  ? ((stats.paidFinesAmount / stats.totalFinesAmount) * 100).toFixed(1)
                  : 0}% taxa de cobrança
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Multas Pendentes</p>
              <p className="text-3xl font-bold text-destructive">{((stats?.totalFinesAmount || 0) - (stats?.paidFinesAmount || 0)).toLocaleString()} Kz</p>
              <p className="text-xs text-muted-foreground mt-1">
                Value pending
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
