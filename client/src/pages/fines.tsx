import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Fine {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  loanId: string;
  amount: string;
  daysOverdue: number;
  status: "pending" | "paid";
  paymentDate: Date | null;
  createdAt: Date;
}

const statusConfig = {
  pending: { text: "Pendente", color: "bg-chart-3 text-white" },
  paid: { text: "Pago", color: "bg-chart-2 text-white" },
};

export default function Fines() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: fines, isLoading } = useQuery<Fine[]>({
    queryKey: ["/api/fines"],
  });

  const payFineMutation = useMutation({
    mutationFn: async (fineId: string) => {
      return apiRequest("POST", `/api/fines/${fineId}/pay`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fines"] });
      toast({ title: "Multa paga com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao pagar multa", variant: "destructive" });
    },
  });

  const normalize = (str: string) =>
    str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const filteredFines = (fines || []).filter((fine) => {
    if (searchQuery === "") return true;
    const searchNormalized = normalize(searchQuery);
    return (
      normalize(fine.userName || "").includes(searchNormalized) ||
      normalize(fine.userEmail || "").includes(searchNormalized)
    );
  });

  const totalPending = (fines || [])
    .filter((f) => f.status === "pending")
    .reduce((sum, f) => sum + parseFloat(f.amount), 0);

  const totalPaid = (fines || [])
    .filter((f) => f.status === "paid")
    .reduce((sum, f) => sum + parseFloat(f.amount), 0);

  const blockedUsers = (fines || [])
    .filter((f) => f.status === "pending" && parseFloat(f.amount) >= 2000)
    .length;

  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Multas</h1>
        <p className="text-muted-foreground">
          Acompanhe e gerencie as multas por atraso (500 Kz por dia)
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendente</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{totalPending.toLocaleString()} Kz</div>
            <p className="text-xs text-muted-foreground mt-1">
              De {(fines || []).filter((f) => f.status === "pending").length} utilizadores
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pago Este Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPaid.toLocaleString()} Kz</div>
            <p className="text-xs text-muted-foreground mt-1">Cobrado com sucesso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilizadores Bloqueados</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blockedUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">Multas &gt; 2.000 Kz</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar por utilizador ou livro..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="input-search-fines"
        />
      </div>

      <div className="rounded-md border">
        {/* Mobile View: Cards */}
        <div className="md:hidden space-y-4 p-4" data-testid="fine-cards-mobile">
          {isLoading ? (
            <div className="text-center text-muted-foreground py-8">
              Carregando multas...
            </div>
          ) : filteredFines.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Nenhuma multa encontrada
            </div>
          ) : (
            filteredFines.map((fine) => (
              <Card key={fine.id} className="p-4 space-y-3" data-testid={`card-fine-${fine.id}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-sm text-muted-foreground uppercase">Utilizador</div>
                    <div className="font-medium truncate max-w-[200px]">{fine.userName || fine.userId}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">{fine.userEmail}</div>
                  </div>
                  <Badge className={statusConfig[fine.status].color}>
                    {statusConfig[fine.status].text}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-muted-foreground">Empréstimo ID</div>
                    <div className="truncate">{fine.loanId}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Atraso</div>
                    <div className="text-destructive font-bold">{fine.daysOverdue} dias</div>
                  </div>
                </div>

                <div className="p-3 bg-muted rounded-md flex justify-between items-center">
                  <span className="text-sm font-medium">Valor Total:</span>
                  <span className="text-lg font-bold">{parseFloat(fine.amount).toLocaleString()} Kz</span>
                </div>

                {/* Action button removed per user request */}
              </Card>
            ))
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilizador</TableHead>
                <TableHead>Empréstimo ID</TableHead>
                <TableHead>Dias de Atraso</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Carregando multas...
                  </TableCell>
                </TableRow>
              ) : filteredFines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhuma multa encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredFines.map((fine) => (
                  <TableRow key={fine.id} data-testid={`row-fine-${fine.id}`}>
                    <TableCell>
                      <div className="font-medium" data-testid={`text-user-${fine.id}`}>{fine.userName || fine.userId}</div>
                      <div className="text-xs text-muted-foreground">{fine.userEmail}</div>
                    </TableCell>
                    <TableCell data-testid={`text-loan-${fine.id}`}>{fine.loanId}</TableCell>
                    <TableCell>
                      <span className="text-destructive font-medium">{fine.daysOverdue} dias</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold" data-testid={`text-amount-${fine.id}`}>
                        {parseFloat(fine.amount).toLocaleString()} Kz
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusConfig[fine.status].color} data-testid={`badge-status-${fine.id}`}>
                        {statusConfig[fine.status].text}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {/* Action cell content removed per user request */}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
