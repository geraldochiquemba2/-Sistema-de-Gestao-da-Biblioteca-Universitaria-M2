import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Calendar, ArrowLeft, RefreshCw, AlertCircle, LogOut, Clock } from "lucide-react";
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

  const renewLoanMutation = useMutation({
    mutationFn: async (loanId: string) => {
      const response = await apiRequest("POST", `/api/loans/${loanId}/renew`, {});
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Empréstimo renovado!",
        description: "O prazo de devolução foi estendido com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/loans/user", user?.id] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao renovar",
        description: error.message || "Não foi possível renovar o empréstimo.",
        variant: "destructive",
      });
    },
  });

  if (!user) {
    return null;
  }

  const activeLoans = (loans || []).filter((l) => l.status === "active");
  const pendingRequests = Array.isArray(loanRequests) ? loanRequests : [];

  const getLoanBook = (bookId: string) => {
    return books?.find((b) => b.id === bookId);
  };

  const tagInfo = {
    red: { label: "Uso na Biblioteca", color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" },
    yellow: { label: "1 Dia", color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300" },
    white: { label: "5 Dias", color: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300" },
  };

  const getDaysUntilDue = (dueDate: string) => {
    return differenceInDays(new Date(dueDate), new Date());
  };

  const isOverdue = (dueDate: string) => {
    return isPast(new Date(dueDate)) && !isPast(new Date(dueDate).setHours(23, 59, 59));
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
          <Button variant="outline" onClick={logout} data-testid="button-logout">
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loansLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        ) : activeLoans.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2" data-testid="text-no-loans">Nenhum empréstimo ativo</h3>
              <p className="text-muted-foreground text-center mb-6">
                Você não tem nenhum livro emprestado no momento.
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

                if (!book) return null;

                return (
                  <Card key={loan.id} data-testid={`card-loan-${loan.id}`}>
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
                              <p className="text-xs text-destructive">
                                {Math.abs(daysUntilDue)} {Math.abs(daysUntilDue) === 1 ? "dia" : "dias"} de atraso
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                          <span>Renovações: {loan.renewalCount}/2</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => renewLoanMutation.mutate(loan.id)}
                          disabled={renewLoanMutation.isPending || loan.renewalCount >= 2}
                          data-testid={`button-renew-${loan.id}`}
                        >
                          {renewLoanMutation.isPending ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Renovando...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Renovar Empréstimo
                            </>
                          )}
                        </Button>
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
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            Aguardando Aprovação
                          </Badge>
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
    </div>
  );
}
