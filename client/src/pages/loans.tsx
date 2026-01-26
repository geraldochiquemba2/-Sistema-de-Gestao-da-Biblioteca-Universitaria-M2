import { useState } from "react";
import { LoanTable, type Loan } from "@/components/loan-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Scan } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Loans() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: loans, isLoading } = useQuery<Loan[]>({
    queryKey: ["/api/loans"],
  });

  const activeLoans = loans?.filter(l => l.status === "active") || [];
  const overdueLoans = loans?.filter(l => l.status === "active" && new Date(l.dueDate) < new Date()) || [];
  const returnedLoans = loans?.filter(l => l.status === "returned") || [];

  const handleReturn = async (id: string) => {
    try {
      await apiRequest("POST", `/api/loans/${id}/return`);
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      toast({ title: "Livro devolvido com sucesso" });
    } catch (error) {
      toast({ title: "Erro ao devolver", variant: "destructive" });
    }
  };

  const handleRenew = async (id: string) => {
    try {
      await apiRequest("POST", `/api/loans/${id}/renew`);
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      toast({ title: "Empréstimo renovado com sucesso" });
    } catch (error) {
      toast({ title: "Erro ao renovar", variant: "destructive" });
    }
  };

  const filterLoans = (loansToFilter: Loan[]) =>
    loansToFilter.filter(
      (loan) =>
        loan.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loan.bookTitle.toLowerCase().includes(searchQuery.toLowerCase())
    );

  if (isLoading) {
    return <div className="p-6">Carregando empréstimos...</div>;
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Empréstimos</h1>
          <p className="text-muted-foreground">
            Acompanhe e gerencie os empréstimos e devoluções de livros
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" data-testid="button-scan-barcode">
            <Scan className="h-4 w-4 mr-2" />
            Digitalizar Código
          </Button>
          <Button data-testid="button-new-loan">
            <Plus className="h-4 w-4 mr-2" />
            Novo Empréstimo
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar por utilizador ou título do livro..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="input-search-loans"
        />
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active" data-testid="tab-active-loans">
            Empréstimos Ativos ({activeLoans.length})
          </TabsTrigger>
          <TabsTrigger value="overdue" data-testid="tab-overdue-loans">
            Atrasados ({overdueLoans.length})
          </TabsTrigger>
          <TabsTrigger value="returned" data-testid="tab-returned-loans">
            Devolvidos ({returnedLoans.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <LoanTable
            loans={filterLoans(activeLoans)}
            onReturn={handleReturn}
            onRenew={handleRenew}
            onViewUser={(id) => console.log("Ver utilizador:", id)}
          />
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          <LoanTable
            loans={filterLoans(overdueLoans)}
            onReturn={handleReturn}
            onRenew={handleRenew}
            onViewUser={(id) => console.log("Ver utilizador:", id)}
          />
        </TabsContent>

        <TabsContent value="returned" className="space-y-4">
          <LoanTable
            loans={filterLoans(returnedLoans)}
            onViewUser={(id) => console.log("Ver utilizador:", id)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
