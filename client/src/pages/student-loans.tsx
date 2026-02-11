import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Calendar, ArrowLeft, RefreshCw, AlertCircle, LogOut, Clock, X, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { format, isPast, differenceInDays } from "date-fns";
import { pt } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";

interface Loan {
  id: string;
  bookId: string;
  loanDate: string;
  dueDate: string;
  status: string;
  renewalCount: number;
  fine?: number;
}

interface Book {
  id: string;
  title: string;
  author: string;
  tag: "red" | "yellow" | "white";
}

export default function StudentLoans() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: loans, isLoading: loansLoading } = useQuery<Loan[]>({
    queryKey: ["/api/loans/user", user?.id],
    enabled: !!user?.id,
  });

  const { data: books } = useQuery<Book[]>({
    queryKey: ["/api/books"],
  });

  const { data: loanRequests } = useQuery({
    queryKey: ["/api/loan-requests", { userId: user?.id, status: "pending" }],
    enabled: !!user?.id,
  });

  const { data: renewalRequests } = useQuery({
    queryKey: ["/api/renewal-requests", { userId: user?.id, status: "pending" }],
    enabled: !!user?.id,
  });

  const requestRenewalMutation = useMutation({
    mutationFn: async (loanId: string) => {
      const response = await apiRequest("POST", "/api/renewal-requests", {
        loanId,
        userId: user?.id,
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Solicitação enviada!",
        description: "O pedido de renovação foi enviado para análise do administrador.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/renewal-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/loans/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao solicitar renovação",
        description: error.message || "Não foi possível enviar a solicitação.",
        variant: "destructive",
      });
    },
  });

  const cancelRenewalMutation = useMutation({
    mutationFn: async (requestId: string) => {
      await apiRequest("DELETE", `/api/renewal-requests/${requestId}`);
    },
    onSuccess: () => {
      toast({
        title: "Solicitação cancelada",
        description: "O pedido de renovação foi removido.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/renewal-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/loans/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cancelar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const cancelRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      await apiRequest("DELETE", `/api/loan-requests/${requestId}`);
    },
    onSuccess: () => {
      toast({
        title: "Solicitação cancelada",
        description: "O pedido de empréstimo foi removido.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/loan-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/loans/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cancelar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!user) {
    return null;
  }

  const activeLoans = (loans || []).filter((l) => l.status === "active" || l.status === "overdue");
  const pendingRequests = Array.isArray(loanRequests) ? loanRequests : [];
  const pendingRenewals = Array.isArray(renewalRequests) ? renewalRequests : [];

  const getLoanBook = (bookId: string) => {
    return books?.find((b) => b.id === bookId);
  };

  const tagInfo = {
    red: { label: "Etiqueta Vermelha (Uso Local)", color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" },
    yellow: { label: "Etiqueta Amarela (1 Dia)", color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300" },
    white: { label: "Etiqueta Branca (5 Dias)", color: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300" },
  };

  const getDaysUntilDue = (dueDate: string) => {
    return differenceInDays(new Date(dueDate), new Date());
  };

  const isOverdue = (dueDate: string) => {
    const endOfDueDay = new Date(dueDate);
    endOfDueDay.setHours(23, 59, 59, 999);
    return isPast(endOfDueDay);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/student/dashboard")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-page-title">Meus Empréstimos</h1>
              <p className="text-sm text-muted-foreground">Gerencie seus livros emprestados</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loansLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        ) : activeLoans.length === 0 && pendingRequests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2" data-testid="text-no-loans">Nenhum empréstimo ou solicitação</h3>
              <p className="text-muted-foreground text-center mb-6">
                Você não tem nenhum livro emprestado ou solicitado no momento.
              </p>
              <Button onClick={() => setLocation("/student/books")} data-testid="button-search-books">
                Buscar Livros
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">
                  Empréstimos Ativos ({activeLoans.length}/2)
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Você tem {activeLoans.length} {activeLoans.length === 1 ? "livro emprestado" : "livros emprestados"}.
                Máximo de 2 livros por estudante.
              </p>
            </div>

            <div className="space-y-4">
              {activeLoans.map((loan) => {
                const book = getLoanBook(loan.bookId);
                const daysUntilDue = getDaysUntilDue(loan.dueDate);
                const overdue = isOverdue(loan.dueDate);
                const hasPendingRenewal = pendingRenewals.some((r: any) => r.loanId === loan.id && r.status === 'pending');

                if (!book) return null;

                return (
                  <Card
                    key={loan.id}
                    data-testid={`card-loan-${loan.id}`}
                    className={`border-2 ${book.tag === 'red' ? 'border-red-500 shadow-red-100/50' :
                      book.tag === 'yellow' ? 'border-yellow-500 shadow-yellow-100/50' :
                        'border-gray-200'
                      } transition-all hover:shadow-sm overflow-hidden`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="flex items-start gap-2 flex-wrap">
                            <span data-testid={`text-book-title-${loan.id}`}>{book.title}</span>
                            <Badge className={tagInfo[book.tag].color}>
                              {tagInfo[book.tag].label}
                            </Badge>
                          </CardTitle>
                          <CardDescription className="mt-1" data-testid={`text-book-author-${loan.id}`}>
                            {book.author}
                          </CardDescription>
                        </div>
                        {overdue && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Atrasado
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Data de Empréstimo</p>
                            <p className="text-sm font-medium" data-testid={`text-loan-date-${loan.id}`}>
                              {format(new Date(loan.loanDate), "dd 'de' MMMM 'de' yyyy", { locale: pt })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Data de Devolução</p>
                            <p
                              className={`text-sm font-medium ${overdue ? "text-destructive" : ""}`}
                              data-testid={`text-due-date-${loan.id}`}
                            >
                              {format(new Date(loan.dueDate), "dd 'de' MMMM 'de' yyyy", { locale: pt })}
                            </p>
                            {!overdue && daysUntilDue <= 2 && daysUntilDue >= 0 && (
                              <p className="text-xs text-yellow-600 dark:text-yellow-500">
                                Faltam {daysUntilDue} {daysUntilDue === 1 ? "dia" : "dias"}
                              </p>
                            )}
                            {overdue && (
                              <div className="flex flex-col gap-1">
                                <p className="text-xs text-destructive">
                                  {Math.abs(daysUntilDue)} {Math.abs(daysUntilDue) === 1 ? "dia" : "dias"} de atraso
                                </p>
                                {loan.fine !== undefined && loan.fine > 0 && (
                                  <Badge variant="outline" className="text-destructive border-destructive/20 bg-destructive/5 font-bold w-fit mt-1">
                                    Multa: {Math.round(loan.fine)} Kz
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                          <span>Renovações: {loan.renewalCount}/2</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {hasPendingRenewal ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 py-1.5 px-3">
                                <Clock className="h-3.5 w-3.5 mr-2 animate-pulse" />
                                Solicitação Pendente
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2 flex items-center gap-1 border border-destructive/20"
                                onClick={() => {
                                  const request = pendingRenewals.find((r: any) => r.loanId === loan.id && r.status === 'pending');
                                  if (request) cancelRenewalMutation.mutate(request.id);
                                }}
                                disabled={cancelRenewalMutation.isPending}
                                title="Cancelar solicitação de renovação"
                              >
                                {cancelRenewalMutation.isPending && cancelRenewalMutation.variables === pendingRenewals.find((r: any) => r.loanId === loan.id && r.status === 'pending')?.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <X className="h-4 w-4" />
                                )}
                                <span className="text-xs">Cancelar</span>
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => requestRenewalMutation.mutate(loan.id)}
                              disabled={requestRenewalMutation.isPending || loan.renewalCount >= 2}
                              data-testid={`button-renew-${loan.id}`}
                            >
                              {requestRenewalMutation.isPending ? (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                  Solicitando...
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Solicitar Renovação
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Informações Importantes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <p>
                    <strong>Renovações:</strong> Você pode renovar cada empréstimo até 2 vezes, desde que não haja reservas pendentes.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <p>
                    <strong>Multas:</strong> Livros devolvidos em atraso geram multa de 500 Kz por dia.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <p>
                    <strong>Bloqueio:</strong> Multas acima de 2000 Kz impedem novos empréstimos e renovações.
                  </p>
                </div>
              </CardContent>
            </Card>

            {pendingRequests.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">Solicitações Pendentes</h2>
                </div>
                <div className="space-y-4">
                  {pendingRequests.map((req: any) => {
                    const book = getLoanBook(req.bookId);
                    if (!book) return null;
                    return (
                      <Card key={req.id}>
                        <CardContent className="flex items-center justify-between py-4">
                          <div>
                            <p className="font-medium">{book.title}</p>
                            <p className="text-sm text-muted-foreground">Solicitado em {format(new Date(req.requestDate), "dd/MM/yyyy", { locale: pt })}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                              Aguardando Aprovação
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                              onClick={() => cancelRequestMutation.mutate(req.id)}
                              disabled={cancelRequestMutation.isPending}
                              title="Cancelar solicitação"
                            >
                              {cancelRequestMutation.isPending && cancelRequestMutation.variables === req.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div >
  );
}
