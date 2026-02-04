import { StatsCard } from "@/components/stats-card";
import { BookOpen, Users, AlertCircle, BookCopy } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  totalBooks: number;
  availableBooks: number;
  totalCopies: number;
  totalAvailableCopies: number;
  totalUsers: number;
  activeLoans: number;
  overdueLoans: number;
  pendingFines: number;
  totalFinesAmount: number;
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: popularBooks } = useQuery<any[]>({
    queryKey: ["/api/reports/popular-books"],
  });

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Painel Principal</h1>
        <p className="text-muted-foreground">
          Visão geral das operações e estatísticas da biblioteca
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total de Livros"
          value={stats?.totalBooks.toString() || "0"}
          icon={BookOpen}
          description="No acervo"
        />
        <StatsCard
          title="Empréstimos Ativos"
          value={stats?.activeLoans.toString() || "0"}
          icon={BookCopy}
          description="Atualmente emprestados"
        />
        <StatsCard
          title="Multas Pendentes"
          value={`${stats?.totalFinesAmount.toLocaleString('pt-AO')} Kz` || "0 Kz"}
          icon={AlertCircle}
          description={`De ${stats?.pendingFines || 0} empréstimos`}
        />
        <StatsCard
          title="Utilizadores Totais"
          value={stats?.totalUsers.toString() || "0"}
          icon={Users}
          description="Contas ativas"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Livros Mais Emprestados</CardTitle>
            <CardDescription>Top livros com mais empréstimos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {popularBooks && popularBooks.length > 0 ? (
                popularBooks.map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.book?.title || "Sem título"}</p>
                      <p className="text-sm text-muted-foreground">{item.book?.author || "Autor desconhecido"}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-lg">{item.loanCount}</p>
                      <p className="text-xs text-muted-foreground">empréstimos</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Estatísticas Rápidas</CardTitle>
            <CardDescription>Informações importantes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Títulos Disponíveis</span>
                <span className="text-2xl font-bold text-green-600">{stats?.availableBooks || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total de Exemplares</span>
                <span className="text-xl font-semibold">{stats?.totalCopies || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Exemplares Disponíveis</span>
                <span className="text-xl font-semibold text-primary">{stats?.totalAvailableCopies || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Empréstimos Atrasados</span>
                <span className="text-2xl font-bold text-red-600">{stats?.overdueLoans || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Taxa de Utilização</span>
                <span className="text-2xl font-bold text-primary">
                  {stats?.totalCopies ?
                    Math.round((stats.activeLoans / stats.totalCopies) * 100) : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {stats && stats.overdueLoans > 0 && (
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">Alerta: Empréstimos Atrasados</CardTitle>
            <CardDescription>Existem {stats.overdueLoans} empréstimos atrasados que precisam de atenção</CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
