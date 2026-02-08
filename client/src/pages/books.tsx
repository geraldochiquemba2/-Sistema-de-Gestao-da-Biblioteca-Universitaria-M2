import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, BookOpen, Tag, Camera, Loader2, Edit, Trash2, Star, History, DollarSign, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";

const bookFormSchema = z.object({
  title: z.string().optional(),
  author: z.string().optional(),
  isbn: z.string().optional(),
  publisher: z.string().optional(),
  yearPublished: z.number().optional(),
  categoryId: z.string().optional(),
  tag: z.enum(["red", "yellow", "white"]),
  totalCopies: z.number().min(1),
  availableCopies: z.number().min(0),
  description: z.string().optional(),
});

type BookFormValues = z.infer<typeof bookFormSchema>;

const tagColors = {
  red: { bg: "bg-red-50 dark:bg-red-900/10", border: "border-red-500", text: "text-red-700 dark:text-red-400", label: "Uso na Biblioteca" },
  yellow: { bg: "bg-yellow-50 dark:bg-yellow-900/10", border: "border-yellow-500", text: "text-yellow-700 dark:text-yellow-400", label: "1 Dia" },
  white: { bg: "bg-gray-50 dark:bg-gray-800/10", border: "border-gray-400", text: "text-gray-700 dark:text-gray-300", label: "5 Dias" },
};

export default function Books() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<any | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSearchingWeb, setIsSearchingWeb] = useState(false);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  const { toast } = useToast();

  const handleWebSearch = async () => {
    const title = form.getValues("title");
    if (!title) {
      toast({
        title: "Título necessário",
        description: "Digite o título do livro para pesquisar na internet.",
        variant: "destructive",
      });
      return;
    }

    setIsSearchingWeb(true);
    setSearchResults(null);
    try {
      const res = await apiRequest("POST", "/api/books/web-search", { title });
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        setSearchResults(data);
        toast({
          title: "Resultados encontrados",
          description: `Encontramos ${data.length} resultados. Selecione um abaixo.`,
        });
      } else {
        toast({
          title: "Nenhum resultado",
          description: "Não foram encontrados livros com este título.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro na pesquisa",
        description: error.message || "Não foi possível encontrar informações para este livro.",
        variant: "destructive",
      });
    } finally {
      setIsSearchingWeb(false);
    }
  };

  const selectSearchResult = (book: any) => {
    form.setValue("title", book.title || "Não Identificado");
    form.setValue("author", book.author || "Não Identificado");
    form.setValue("isbn", book.isbn || ""); // Mantemos vazio para evitar erro de duplicado no DB
    form.setValue("publisher", book.publisher || "Não Identificado");
    if (book.yearPublished) {
      form.setValue("yearPublished", parseInt(book.yearPublished.toString()));
    }
    form.setValue("description", book.description || "Não Identificado");

    // Tentar mapear categoria
    if (book.categories && categories) {
      const apiCats = book.categories.toLowerCase().split(",").map((c: any) => c.trim());
      const matchedCat = categories.find((c: any) =>
        apiCats.some((ac: any) => ac.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(ac))
      );
      if (matchedCat) {
        form.setValue("categoryId", matchedCat.id);
      }
    }

    setSearchResults(null);
    toast({
      title: "Dados preenchidos!",
      description: "As informações do livro selecionado foram inseridas.",
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(",")[1];
      try {
        const res = await apiRequest("POST", "/api/books/ocr", { image: base64 });
        const data = await res.json();

        form.setValue("title", data.title || "");
        form.setValue("author", data.author || "");
        form.setValue("isbn", data.isbn || "");
        form.setValue("publisher", data.publisher || "");
        if (data.yearPublished) {
          form.setValue("yearPublished", parseInt(data.yearPublished.toString()));
        }
        if (data.description) {
          form.setValue("description", data.description);
        }

        // Se encontrou um título, faz a busca na web para complementar dados
        if (data.title) {
          toast({
            title: "Capa reconhecida!",
            description: "Buscando informações complementares na internet...",
          });

          try {
            const webRes = await apiRequest("POST", "/api/books/web-search", { title: data.title });
            const webDataArray = await webRes.json();
            const webData = Array.isArray(webDataArray) ? webDataArray[0] : null;

            if (webData) {
              if (!form.getValues("author") || form.getValues("author") === "Não Identificado")
                form.setValue("author", webData.author || "Não Identificado");
              if (!form.getValues("isbn")) form.setValue("isbn", webData.isbn || "");
              if (!form.getValues("publisher") || form.getValues("publisher") === "Não Identificado")
                form.setValue("publisher", webData.publisher || "Não Identificado");
              if (!form.getValues("yearPublished") && webData.yearPublished) {
                form.setValue("yearPublished", parseInt(webData.yearPublished.toString()));
              }
              if (!form.getValues("description") || form.getValues("description") === "Não Identificado")
                form.setValue("description", webData.description || "Não Identificado");

              // Mapear categoria se encontrada
              if (webData.categories && categories && !form.getValues("categoryId")) {
                const apiCats = webData.categories.toLowerCase().split(",").map((c: any) => c.trim());
                const matchedCat = categories.find((c: any) =>
                  apiCats.some((ac: any) => ac.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(ac))
                );
                if (matchedCat) form.setValue("categoryId", matchedCat.id);
              }
            }
          } catch (webErr) {
            console.error("Erro na busca complementar:", webErr);
          }
        }

        toast({
          title: "Dados processados!",
          description: "As informações foram extraídas e complementadas via internet.",
        });
      } catch (error: any) {
        toast({
          title: "Erro no OCR",
          description: error.message || "Não foi possível extrair os dados da imagem.",
          variant: "destructive",
        });
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const { data: books, isLoading } = useQuery<any[]>({
    queryKey: selectedCategoryFilter !== "all"
      ? ["/api/books", { search: searchQuery, categoryId: selectedCategoryFilter }]
      : searchQuery
        ? ["/api/books", { search: searchQuery }]
        : ["/api/books"],
  });

  const { data: categories } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookFormSchema),
    defaultValues: {
      title: "",
      author: "",
      isbn: "",
      publisher: "",
      tag: "white",
      totalCopies: 1,
      availableCopies: 1,
      description: "",
    },
  });

  const openAddDialog = () => {
    setEditingBook(null);
    form.reset({
      title: "",
      author: "",
      isbn: "",
      publisher: "",
      tag: "white",
      totalCopies: 1,
      availableCopies: 1,
      description: "",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (book: any) => {
    setEditingBook(book);
    form.reset({
      title: book.title,
      author: book.author,
      isbn: book.isbn || "",
      publisher: book.publisher || "",
      yearPublished: book.yearPublished || undefined,
      categoryId: book.categoryId || undefined,
      tag: book.tag,
      totalCopies: book.totalCopies,
      availableCopies: book.availableCopies,
      description: book.description || "",
    });
    setIsDialogOpen(true);
  };

  const createBookMutation = useMutation({
    mutationFn: async (data: BookFormValues) => {
      if (editingBook) {
        return apiRequest("PATCH", `/api/books/${editingBook.id}`, data);
      }
      return apiRequest("POST", "/api/books", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      toast({
        title: editingBook ? "Livro atualizado!" : "Livro cadastrado!",
        description: editingBook ? "As alterações foram salvas." : "O livro foi adicionado ao acervo com sucesso.",
      });
      setIsDialogOpen(false);
      setEditingBook(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar livro",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });

  const deleteBookMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/books/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      toast({
        title: "Livro excluído",
        description: "O livro foi removido do acervo.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir livro",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BookFormValues) => {
    createBookMutation.mutate(data);
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Livros</h1>
          <p className="text-muted-foreground">
            Gerir o acervo bibliográfico da instituição
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingBook(null);
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-book" onClick={openAddDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Livro
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBook ? "Editar Livro" : "Cadastrar Novo Livro"}</DialogTitle>
              <DialogDescription>
                {editingBook ? "Atualize as informações do livro no acervo." : "Preencha os dados do livro ou tire uma foto da capa para preenchimento automático."}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg mb-4 bg-muted/50">
              {isScanning ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm font-medium">Analisando capa do livro...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center w-full gap-4">
                  <div className="flex flex-col items-center">
                    <Camera className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2 text-center">Capture ou envie uma foto da capa para extrair os dados</p>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="max-w-xs"
                      data-testid="input-ocr-camera"
                    />
                  </div>
                  <div className="w-full flex items-center gap-2">
                    <div className="h-[1px] flex-1 bg-border" />
                    <span className="text-xs text-muted-foreground uppercase">Ou</span>
                    <div className="h-[1px] flex-1 bg-border" />
                  </div>
                  <div className="w-full flex flex-col gap-2">
                    <Label htmlFor="web-title-search" className="text-xs">Ou digite o título para buscar na internet</Label>
                    <div className="flex gap-2">
                      <Input
                        id="web-title-search"
                        placeholder="Ex: Dom Casmurro"
                        value={form.watch("title")}
                        onChange={(e) => form.setValue("title", e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleWebSearch}
                        disabled={isSearchingWeb}
                        data-testid="button-web-search"
                      >
                        {isSearchingWeb ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {searchResults && searchResults.length > 0 && (
              <div className="mb-6 border rounded-lg overflow-hidden">
                <div className="bg-muted p-2 text-xs font-bold uppercase flex justify-between items-center">
                  <span>Selecione a versão correta:</span>
                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setSearchResults(null)}>Cancelar</Button>
                </div>
                <div className="max-h-60 overflow-y-auto divide-y">
                  {searchResults.map((book, idx) => (
                    <div
                      key={idx}
                      className="p-3 hover:bg-muted/50 cursor-pointer flex gap-3 items-start transition-colors"
                      onClick={() => selectSearchResult(book)}
                    >
                      {book.thumbnail ? (
                        <img src={book.thumbnail} alt={book.title} className="w-12 h-16 object-cover rounded shadow-sm flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-16 bg-muted flex items-center justify-center rounded flex-shrink-0 text-muted-foreground">
                          <BookOpen className="h-6 w-6" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{book.title}</p>
                        <p className="text-xs text-muted-foreground">{book.author}</p>
                        {book.publisher && <p className="text-[10px] text-muted-foreground italic">{book.publisher} {book.yearPublished ? `(${book.yearPublished})` : ""}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="author"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Autor</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-author" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="isbn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ISBN</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-isbn" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="publisher"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Editora</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-publisher" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="yearPublished"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ano de Publicação</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            data-testid="input-year"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-category">
                              <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories?.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="tag"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Etiqueta de Empréstimo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-tag">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="red">Vermelha (Uso na Biblioteca)</SelectItem>
                          <SelectItem value="yellow">Amarela (1 Dia)</SelectItem>
                          <SelectItem value="white">Branca (5 Dias)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="totalCopies"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total de Exemplares</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-total-copies"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="availableCopies"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exemplares Disponíveis</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-available-copies"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={createBookMutation.isPending} data-testid="button-submit-book">
                  {createBookMutation.isPending ? "Salvando..." : editingBook ? "Atualizar Livro" : "Cadastrar Livro"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, autor ou ISBN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>
        <Select
          value={selectedCategoryFilter}
          onValueChange={(val) => {
            setSelectedCategoryFilter(val);
          }}
        >
          <SelectTrigger className="w-full md:w-[200px]" data-testid="select-category-filter">
            <SelectValue placeholder="Filtrar por Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Categorias</SelectItem>
            {categories?.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {books?.map((book) => (
            <Card key={book.id} data-testid={`card-book-${book.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg line-clamp-2">{book.title}</CardTitle>
                  <Badge variant="outline" className={`${tagColors[book.tag as keyof typeof tagColors].bg} ${tagColors[book.tag as keyof typeof tagColors].text} ${tagColors[book.tag as keyof typeof tagColors].border} border-2 font-bold px-3 py-1 flex-shrink-0 animate-pulse-slow`}>
                    <Tag className="h-3 w-3 mr-1.5" />
                    {tagColors[book.tag as keyof typeof tagColors].label}
                  </Badge>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm text-muted-foreground">{book.author}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`h-3 w-3 ${s <= Math.round(book.averageRating || 0) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{book.averageRating || "0.0"} ({book.reviewCount || 0} avaliações)</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {book.isbn && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">ISBN:</span>
                    <span className="font-mono">{book.isbn}</span>
                  </div>
                )}
                {book.publisher && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Editora:</span>
                    <span>{book.publisher}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="flex flex-col p-2 bg-muted/40 rounded-lg border border-border/50">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase mb-1">
                      <History className="h-3 w-3" /> Frequência
                    </div>
                    <div className="text-sm font-bold">{book.loanCount || 0} empréstimos</div>
                  </div>
                  <div className="flex flex-col p-2 bg-muted/40 rounded-lg border border-border/50">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase mb-1">
                      <DollarSign className="h-3 w-3" /> Multas
                    </div>
                    <div className="text-sm font-bold text-destructive">{parseFloat(book.totalFines || "0").toLocaleString()} Kz</div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <span className="font-bold text-green-600">{book.availableCopies}</span>
                      <span className="text-muted-foreground">/{book.totalCopies}</span>
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => openEditDialog(book)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir Livro?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso removerá permanentemente o livro
                            "<strong>{book.title}</strong>" do sistema.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteBookMutation.mutate(book.id)}
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && books?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum livro encontrado</h3>
            <p className="text-muted-foreground text-center">
              {searchQuery
                ? "Tente ajustar sua busca"
                : "Comece adicionando livros ao acervo"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
