import { useState } from "react";
import { LoanTable, type Loan } from "@/components/loan-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Check, X, BookOpen, Loader2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UserDetailsDialog } from "@/components/UserDetailsDialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const loanFormSchema = z.object({
  userId: z.string().min(1, "Utilizador é obrigatório"),
  bookId: z.string().min(1, "Livro é obrigatório"),
});

type LoanFormValues = z.infer<typeof loanFormSchema>;

export default function Loans() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoanDialogOpen, setIsLoanDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false);
  const { toast } = useToast();

  const { data: loans, isLoading: loansLoading } = useQuery<Loan[]>({
    queryKey: ["/api/loans"],
  });

  const { data: requests, isLoading: requestsLoading } = useQuery<any[]>({
    queryKey: ["/api/loan-requests"],
  });

  const { data: renewalRequests, isLoading: renewalRequestsLoading } = useQuery<any[]>({
    queryKey: ["/api/renewal-requests"],
  });

  const { data: reservations, isLoading: reservationsLoading } = useQuery<any[]>({
    queryKey: ["/api/reservations"],
  });

  const { data: users } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  const { data: books } = useQuery<any[]>({
    queryKey: ["/api/books"],
  });

  const form = useForm<LoanFormValues>({
    resolver: zodResolver(loanFormSchema),
    defaultValues: {
      userId: "",
      bookId: "",
    },
  });

  const { userId, bookId } = useWatch({ control: form.control });

  const { data: eligibility, isLoading: eligibilityLoading } = useQuery<{ canLoan: boolean; reason?: string }>({
    queryKey: ["/api/loans/check-eligibility", { userId, bookId }],
    enabled: !!userId && !!bookId,
  });

  const activeLoans = loans?.filter(l => l.status === "active") || [];
  const overdueLoans = loans?.filter(l => l.status === "active" && new Date(l.dueDate) < new Date()) || [];
  const returnedLoans = loans?.filter(l => l.status === "returned") || [];
  const pendingRequests = requests?.filter(r => r.status === "pending") || [];
  const pendingRenewals = renewalRequests?.filter(r => r.status === "pending") || [];

  const createLoanMutation = useMutation({
    mutationFn: async (data: LoanFormValues) => {
      return apiRequest("POST", "/api/loans", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      toast({ title: "Empréstimo realizado com sucesso!" });
      setIsLoanDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao realizar empréstimo",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });

  const handleReturn = async (id: string) => {
    try {
      await apiRequest("POST", `/api/loans/${id}/return`);
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
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

  const handleApproveRequest = async (id: string) => {
    try {
      await apiRequest("POST", `/api/loan-requests/${id}/approve`);
      queryClient.invalidateQueries({ queryKey: ["/api/loan-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/loans/user"] }); // Atualiza dashboard do user
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      toast({ title: "Solicitação aprovada e empréstimo criado!" });
    } catch (error: any) {
      toast({
        title: "Erro ao aprovar",
        description: error.message || "Tente novamente",
        variant: "destructive"
      });
    }
  };

  const handleRejectRequest = async (id: string) => {
    try {
      await apiRequest("POST", `/api/loan-requests/${id}/reject`);
      queryClient.invalidateQueries({ queryKey: ["/api/loan-requests"] });
      toast({ title: "Solicitação rejeitada" });
    } catch (error) {
      toast({ title: "Erro ao rejeitar", variant: "destructive" });
    }
  };

  const approveRenewalMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/renewal-requests/${id}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/renewal-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      toast({ title: "Renovação aprovada!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao aprovar renovação",
        description: error.message || "Tente novamente",
        variant: "destructive"
      });
    }
  });

  const rejectRenewalMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/renewal-requests/${id}/reject`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/renewal-requests"] });
      toast({ title: "Renovação rejeitada" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao rejeitar renovação",
        description: error.message || "Tente novamente",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: LoanFormValues) => {
    createLoanMutation.mutate(data);
  };

  const filterLoans = (loansToFilter: Loan[]) =>
    loansToFilter.filter(
      (loan) =>
        loan.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loan.bookTitle.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const isLoading = loansLoading || requestsLoading || reservationsLoading;

  if (isLoading) {
    return <div className="p-6">Carregando empréstimos...</div>;
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Empréstimos</h1>
          <p className="text-muted-foreground">
            Acompanhe e gerencie os empréstimos e devoluções de livros
          </p>
        </div>
        <div className="w-full sm:w-auto">
          <Dialog open={isLoanDialogOpen} onOpenChange={setIsLoanDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="w-full bg-amber-100 text-amber-900 border-2 border-amber-200 hover:bg-amber-200 transition-colors h-11"
                data-testid="button-new-loan"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Empréstimo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Novo Empréstimo</DialogTitle>
                <DialogDescription>
                  Selecione o utilizador e o livro para registrar um novo empréstimo.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                  <FormField
                    control={form.control}
                    name="userId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Utilizador</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-user">
                              <SelectValue placeholder="Selecione um utilizador" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {users?.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name} ({user.userType})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bookId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Livro</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-book">
                              <SelectValue placeholder="Selecione um livro" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {books?.filter(b => b.availableCopies > 0 && b.tag !== "red").map((book) => (
                              <SelectItem key={book.id} value={book.id}>
                                {book.title} ({book.availableCopies} disponíveis)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {userId && bookId && eligibility && !eligibility.canLoan && (
                    <Alert variant="destructive" className="bg-destructive/5 border-destructive/20 text-destructive py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        {eligibility.reason}
                      </AlertDescription>
                    </Alert>
                  )}

                  {userId && bookId && eligibility?.canLoan && (
                    <Alert className="bg-chart-2/5 border-chart-2/20 text-chart-2 py-2">
                      <Check className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Utilizador elegível para este empréstimo.
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createLoanMutation.isPending || (!!userId && !!bookId && eligibility?.canLoan === false)}
                    data-testid="button-submit-loan"
                  >
                    {createLoanMutation.isPending ? "Processando..." : "Confirmar Empréstimo"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar por utilizador ou título do livro..."
          className="pl-9 h-11"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="input-search-loans"
        />
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <div className="w-full overflow-x-auto pb-1">
          <TabsList className="w-full sm:w-auto inline-flex h-auto p-1 bg-muted/50">
            <TabsTrigger
              value="active"
              data-testid="tab-active-loans"
              className="px-4 py-2 text-sm whitespace-nowrap"
            >
              Ativos ({activeLoans.length})
            </TabsTrigger>
            <TabsTrigger
              value="waiting-list"
              data-testid="tab-waiting-list"
              className="relative px-4 py-2 text-sm whitespace-nowrap"
            >
              Lista de Espera ({reservations?.length || 0})
              {reservations && reservations.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] text-white">
                  {reservations.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="requests"
              data-testid="tab-pending-requests"
              className="relative px-4 py-2 text-sm whitespace-nowrap"
            >
              Solicitações ({pendingRequests.length + pendingRenewals.length})
              {(pendingRequests.length + pendingRenewals.length) > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {pendingRequests.length + pendingRenewals.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="overdue"
              data-testid="tab-overdue-loans"
              className="px-4 py-2 text-sm whitespace-nowrap"
            >
              Atrasados ({overdueLoans.length})
            </TabsTrigger>
            <TabsTrigger
              value="returned"
              data-testid="tab-returned-loans"
              className="px-4 py-2 text-sm whitespace-nowrap"
            >
              Devolvidos ({returnedLoans.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="active" className="space-y-4">
          <LoanTable
            loans={filterLoans(activeLoans)}
            onReturn={handleReturn}
            onRenew={handleRenew}
            onViewUser={(loanId) => {
              const loan = loans?.find(l => l.id === loanId);
              if (loan) {
                setSelectedUserId(loan.userId);
                setIsUserDetailsOpen(true);
              }
            }}
          />
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Novos Empréstimos</h3>
            <div className="rounded-md border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left font-medium">Utilizador</th>
                      <th className="p-3 text-left font-medium">Livro Solicitado</th>
                      <th className="p-3 text-left font-medium">Data do Pedido</th>
                      <th className="p-3 text-right font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pendingRequests.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-muted-foreground">
                          Nenhuma solicitação de empréstimo pendente
                        </td>
                      </tr>
                    ) : (
                      pendingRequests.map((req) => {
                        const user = users?.find(u => u.id === req.userId);
                        const book = books?.find(b => b.id === req.bookId);
                        return (
                          <tr key={req.id} className="hover:bg-muted/30 transition-colors">
                            <td className="p-3">
                              <span className="font-semibold text-foreground">{user?.name || "..."}</span>
                              <div className="text-xs text-muted-foreground capitalize">{user?.userType}</div>
                            </td>
                            <td className="p-3">
                              <span className="font-medium">{book?.title || "..."}</span>
                              <div className="text-xs text-muted-foreground">ISBN: {book?.isbn || "N/A"}</div>
                            </td>
                            <td className="p-3 text-muted-foreground">
                              {format(new Date(req.requestDate), "dd/MM/yyyy HH:mm")}
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-destructive hover:bg-destructive/10"
                                  onClick={() => handleRejectRequest(req.id)}
                                >
                                  <X className="h-4 w-4 mr-1" /> Rejeitar
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-chart-2 hover:bg-chart-2/90"
                                  onClick={() => handleApproveRequest(req.id)}
                                >
                                  <Check className="h-4 w-4 mr-1" /> Aprovar
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Solicitações de Renovação</h3>
            <div className="rounded-md border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left font-medium">Utilizador</th>
                      <th className="p-3 text-left font-medium">Livro / Empréstimo</th>
                      <th className="p-3 text-left font-medium">Data do Pedido</th>
                      <th className="p-3 text-right font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pendingRenewals.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-muted-foreground">
                          Nenhuma solicitação de renovação pendente
                        </td>
                      </tr>
                    ) : (
                      pendingRenewals.map((req: any) => {
                        const user = users?.find(u => u.id === req.userId);
                        const loan = loans?.find(l => l.id === req.loanId);
                        const book = books?.find(b => b.id === loan?.bookId);

                        return (
                          <tr key={req.id} className="hover:bg-muted/30 transition-colors">
                            <td className="p-3">
                              <span className="font-semibold text-foreground">{user?.name || "..."}</span>
                              <div className="text-xs text-muted-foreground capitalize">{user?.userType}</div>
                            </td>
                            <td className="p-3">
                              <span className="font-medium">{book?.title || "..."}</span>
                              <div className="text-xs text-muted-foreground">
                                Vencimento: {loan?.dueDate ? format(new Date(loan.dueDate), "dd/MM/yyyy") : "N/A"}
                              </div>
                            </td>
                            <td className="p-3 text-muted-foreground">
                              {req.requestDate ? format(new Date(req.requestDate), "dd/MM/yyyy HH:mm") : "-"}
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-destructive hover:bg-destructive/10"
                                  onClick={() => rejectRenewalMutation.mutate(req.id)}
                                  disabled={rejectRenewalMutation.isPending || approveRenewalMutation.isPending}
                                >
                                  {rejectRenewalMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  ) : (
                                    <X className="h-4 w-4 mr-1" />
                                  )}
                                  Rejeitar
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-chart-2 hover:bg-chart-2/90"
                                  onClick={() => approveRenewalMutation.mutate(req.id)}
                                  disabled={approveRenewalMutation.isPending || rejectRenewalMutation.isPending}
                                >
                                  {approveRenewalMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  ) : (
                                    <Check className="h-4 w-4 mr-1" />
                                  )}
                                  Aprovar
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          <LoanTable
            loans={filterLoans(overdueLoans)}
            onReturn={handleReturn}
            onRenew={handleRenew}
            onViewUser={(loanId) => {
              const loan = loans?.find(l => l.id === loanId);
              if (loan) {
                setSelectedUserId(loan.userId);
                setIsUserDetailsOpen(true);
              }
            }}
          />
        </TabsContent>

        <TabsContent value="returned" className="space-y-4">
          <LoanTable
            loans={filterLoans(returnedLoans)}
            onViewUser={(loanId) => {
              const loan = loans?.find(l => l.id === loanId);
              if (loan) {
                setSelectedUserId(loan.userId);
                setIsUserDetailsOpen(true);
              }
            }}
          />
        </TabsContent>

        <TabsContent value="waiting-list" className="space-y-4">
          <div className="rounded-md border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left font-medium">Utilizador</th>
                    <th className="p-3 text-left font-medium">Livro</th>
                    <th className="p-3 text-left font-medium">Data da Reserva</th>
                    <th className="p-3 text-left font-medium">Status</th>
                    <th className="p-3 text-right font-medium">Prioridade</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {reservations?.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        Ninguém na lista de espera atualmente
                      </td>
                    </tr>
                  ) : (
                    reservations?.map((res: any) => (
                      <tr key={res.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <span className="font-semibold text-foreground">{res.userName}</span>
                          <div className="text-xs text-muted-foreground capitalize">{res.userType}</div>
                        </td>
                        <td className="p-3">
                          <span className="font-medium">{res.bookTitle}</span>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {format(new Date(res.reservationDate), "dd/MM/yyyy HH:mm")}
                        </td>
                        <td className="p-3">
                          {res.status === "notified" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Notificado (Retirada)
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                              Em espera
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {res.userType === "teacher" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                              ⭐ Prioridade
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <UserDetailsDialog
        userId={selectedUserId}
        open={isUserDetailsOpen}
        onOpenChange={setIsUserDetailsOpen}
      />
    </div>
  );
}
