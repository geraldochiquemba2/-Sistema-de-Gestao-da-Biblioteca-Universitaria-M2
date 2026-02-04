import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, BookOpen, LogOut, Calendar, MapPin, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function BookSearch() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const params = new URLSearchParams();
  if (searchTerm) params.append("search", searchTerm);
  if (selectedDepartment !== "all") params.append("department", selectedDepartment);
  if (selectedCategory !== "all") params.append("categoryId", selectedCategory);
  const queryString = params.toString();

  const { data: books, isLoading: booksLoading } = useQuery({
    queryKey: ["/api/books", queryString],
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  const { data: userReservations } = useQuery({
    queryKey: ["/api/reservations", { userId: user?.id }],
    enabled: !!user?.id,
  });

  const { data: userLoanRequests } = useQuery({
    queryKey: ["/api/loan-requests", { userId: user?.id }],
    enabled: !!user?.id,
  });

  const reserveMutation = useMutation({
    mutationFn: async (bookId: string) => {
      if (!user?.id) throw new Error("Usuário não autenticado");
      const response = await apiRequest("POST", "/api/reservations", { userId: user.id, bookId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      toast({ title: "Reserva realizada!", description: "Você será notificado quando o livro estiver disponível." });
    },
    onError: (error: any) => {
      toast({ title: "Erro na reserva", description: error.message, variant: "destructive" });
    },
  });

  const requestLoanMutation = useMutation({
    mutationFn: async (bookId: string) => {
      if (!user?.id) throw new Error("Usuário não autenticado");
      const response = await apiRequest("POST", "/api/loan-requests", { userId: user.id, bookId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loan-requests"] });
      toast({ title: "Solicitação enviada!", description: "Aguarde a aprovação do bibliotecário." });
    },
    onError: (error: any) => {
      toast({ title: "Erro na solicitação", description: error.message, variant: "destructive" });
    },
  });

  if (!user) return null;

  const cancelRequestMutation = useMutation({
    mutationFn: async (bookId: string) => {
      // Find the request ID for this book
      const request = userLoanRequests?.find((r: any) => r.bookId === bookId && r.status === "pending");
      if (!request) throw new Error("Solicitação não encontrada");

      await apiRequest("DELETE", `/api/loan-requests/${request.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loan-requests"] });
      toast({ title: "Solicitação cancelada", description: "O pedido foi removido." });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao cancelar", description: error.message, variant: "destructive" });
    },
  });

  const booksArray = Array.isArray(books) ? books : [];
  const categoriesArray = Array.isArray(categories) ? categories : [];
  const reservationsArray = Array.isArray(userReservations) ? userReservations : [];
  const requestsArray = Array.isArray(userLoanRequests) ? userLoanRequests : [];

  const hasActiveReservation = (bookId: string) => {
    return reservationsArray.some(
      (r: any) => r.bookId === bookId && (r.status === "pending" || r.status === "notified")
    );
  };

  const hasPendingRequest = (bookId: string) => {
    return requestsArray.some(
      (r: any) => r.bookId === bookId && r.status === "pending"
    );
  };

  const getDepartmentLabel = (dept: string) => {
    const labels: Record<string, string> = {
      "engenharia": "Engenharia",
      "ciencias-sociais": "Ciências Sociais",
      "outros": "Outros"
    };
    return labels[dept] || dept;
  };

  const getTagLabel = (tag: string) => {
    const labels: Record<string, string> = {
      "white": "Branca",
      "yellow": "Amarela",
      "red": "Vermelha"
    };
    return labels[tag] || tag;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => window.history.back()}
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-page-title">Buscar Livros</h1>
              <p className="text-sm text-muted-foreground">Bem-vindo, {user?.name}</p>
            </div>
          </div>
          <Button variant="outline" onClick={logout} data-testid="button-logout">
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros de Busca</CardTitle>
            <CardDescription>Pesquise por título, autor ou ISBN</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Pesquisar livros..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search"
                  className="w-full"
                />
              </div>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-full md:w-[200px]" data-testid="select-department">
                  <SelectValue placeholder="Departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="engenharia">Engenharia</SelectItem>
                  <SelectItem value="ciencias-sociais">Ciências Sociais</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-[200px]" data-testid="select-category">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categoriesArray.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {booksLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando livros...</p>
          </div>
        ) : booksArray.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum livro encontrado</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {booksArray.map((book: any) => {
              const category = categoriesArray.find((c: any) => c.id === book.categoryId);
              const alreadyReserved = hasActiveReservation(book.id);

              return (
                <Card key={book.id} data-testid={`card-book-${book.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{book.title}</CardTitle>
                      <Badge variant="outline" className="flex-shrink-0">
                        Etiqueta {getTagLabel(book.tag)}
                      </Badge>
                    </div>
                    <CardDescription>{book.author}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{getDepartmentLabel(book.department)}</span>
                    </div>
                    {category && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <BookOpen className="h-4 w-4" />
                        <span>{category.name}</span>
                      </div>
                    )}
                    {book.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{book.description}</p>
                    )}
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm font-medium">
                        {book.availableCopies > 0 ? (
                          <span className="text-green-600">{book.availableCopies} de {book.totalCopies} disponível(is)</span>
                        ) : (
                          <span className="text-red-600">Indisponível (0 de {book.totalCopies})</span>
                        )}
                      </span>
                    </div>
                    {book.availableCopies === 0 ? (
                      <Button
                        className="w-full"
                        variant={alreadyReserved ? "outline" : "secondary"}
                        onClick={() => !alreadyReserved && reserveMutation.mutate(book.id)}
                        disabled={reserveMutation.isPending || alreadyReserved}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        {alreadyReserved ? "Na Lista de Espera" : "Entrar na Lista de Espera"}
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        variant={hasPendingRequest(book.id) ? "outline" : "default"}
                        onClick={() => {
                          if (hasPendingRequest(book.id)) {
                            cancelRequestMutation.mutate(book.id);
                          } else {
                            requestLoanMutation.mutate(book.id);
                          }
                        }}
                        disabled={requestLoanMutation.isPending || cancelRequestMutation.isPending}
                      >
                        {hasPendingRequest(book.id) ? (
                          <>
                            <LogOut className="h-4 w-4 mr-2 rotate-180" />
                            Cancelar Solicitação
                          </>
                        ) : (
                          <>
                            <BookOpen className="h-4 w-4 mr-2" />
                            Solicitar Empréstimo
                          </>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
