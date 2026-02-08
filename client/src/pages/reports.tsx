import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, TrendingUp, Users, BookOpen, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

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
  const { data: activeUsers, isLoading: usersLoading } = useQuery<any[]>({
    queryKey: ["/api/reports/active-users"],
  });

  const topUsers = activeUsers?.map(u => ({
    name: u.user.name,
    loans: u.loanCount,
    type: u.user.userType
  })) || [];

  if (statsLoading || categoriesLoading || usersLoading) {
    return <div className="p-6">Carregando relatórios...</div>;
  }

  const utilizationRate = stats?.totalCopies ? Math.round((stats.activeLoans / stats.totalCopies) * 100) : 0;

  const financeData = [
    { name: "Pago", value: stats?.paidFinesAmount || 0, color: "#10b981" },
    { name: "Pendente", value: (stats?.totalFinesAmount || 0) - (stats?.paidFinesAmount || 0), color: "#ef4444" },
  ];

  const handleExport = () => {
    if (!stats || !categories || !activeUsers) return;

    const csvRows = [];

    // Header - General Stats
    csvRows.push("RELATÓRIO DE DESEMPENHO - BIBLIOTECA DIGITAL ISPTEC");
    csvRows.push(`Data do Relatório: ${new Date().toLocaleDateString()}`);
    csvRows.push("");
    csvRows.push("MÉTRICAS GERAIS");
    csvRows.push(`Total de Livros (Títulos);${stats.totalBooks}`);
    csvRows.push(`Total de Exemplares;${stats.totalCopies}`);
    csvRows.push(`Exemplares Disponíveis;${stats.totalAvailableCopies}`);
    csvRows.push(`Empréstimos Ativos;${stats.activeLoans}`);
    csvRows.push(`Taxa de Utilização;${utilizationRate}%`);
    csvRows.push("");
    csvRows.push("FINANCEIRO");
    csvRows.push(`Total de Multas Emitidas;${stats.totalFinesAmount} Kz`);
    csvRows.push(`Total Recebido;${stats.paidFinesAmount} Kz`);
    csvRows.push(`Total Pendente;${stats.totalFinesAmount - stats.paidFinesAmount} Kz`);
    csvRows.push(`Utilizadores Bloqueados;${stats.blockedUsers}`);
    csvRows.push("");

    // Header - Categories
    csvRows.push("POPULARIDADE POR CATEGORIA");
    csvRows.push("Categoria;Quantidade de Empréstimos;Percentagem");
    categories.forEach(cat => {
      csvRows.push(`${cat.name};${cat.loans};${cat.percentage}%`);
    });
    csvRows.push("");

    // Header - Users
    csvRows.push("UTILIZADORES MAIS ATIVOS");
    csvRows.push("Nome;Tipo;Total de Empréstimos");
    activeUsers.slice(0, 5).forEach(u => {
      csvRows.push(`${u.user.name};${u.user.userType};${u.loanCount}`);
    });

    const csvContent = "\uFEFF" + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Relatorio_Biblioteca_ISPTEC_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios e Análises</h1>
          <p className="text-muted-foreground">
            Métricas de desempenho e estatísticas da biblioteca
          </p>
        </div>
        <Button onClick={handleExport} data-testid="button-export-report">
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
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Popularidade por Categoria</CardTitle>
            <CardDescription>Distribuição de empréstimos por área</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categories}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  cursor={{ fill: "rgba(0,0,0,0.05)" }}
                />
                <Bar dataKey="loans" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Utilizadores Mais Ativos</CardTitle>
            <CardDescription>Top 5 utilizadores por número de empréstimos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topUsers.map((user, index) => (
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
          <div className="grid gap-6 md:grid-cols-2 items-center">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={financeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {financeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Total Emitido</p>
                  <p className="text-2xl font-bold">{stats?.totalFinesAmount.toLocaleString()} Kz</p>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground opacity-20" />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
                <div>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">Total Recebido</p>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{stats?.paidFinesAmount.toLocaleString()} Kz</p>
                </div>
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg bg-red-50 dark:bg-red-950/20">
                <div>
                  <p className="text-sm text-red-600 dark:text-red-400">Pendente</p>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-300">{((stats?.totalFinesAmount || 0) - (stats?.paidFinesAmount || 0)).toLocaleString()} Kz</p>
                </div>
                <div className="h-2 w-2 rounded-full bg-red-500" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
