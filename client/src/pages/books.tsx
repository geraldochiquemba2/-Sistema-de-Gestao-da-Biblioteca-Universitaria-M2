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
import { Plus, Search, BookOpen, Tag, Camera, Loader2, Edit, Trash2, Star, History, DollarSign, MessageSquare, Wand2, Sparkles } from "lucide-react";
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

interface BookReviewsDialogProps {
  bookId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookTitle?: string;
}

function BookReviewsDialog({ bookId, open, onOpenChange, bookTitle }: BookReviewsDialogProps) {
  const { data: reviews, isLoading } = useQuery<any[]>({
    queryKey: ["/api/books", bookId, "reviews"],
    enabled: !!bookId && open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Avaliações: {bookTitle}</DialogTitle>
          <DialogDescription>O que os utilizadores dizem sobre este livro.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : !reviews || reviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Este livro ainda não foi avaliado.</div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="p-3 bg-muted/30 rounded-lg border">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`h-3 w-3 ${s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
                    ))}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-xs font-bold text-foreground mb-1">{review.userName}</p>
                <p className="text-sm italic text-foreground/80">"{review.comment}"</p>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const tagColors = {
  white: { bg: "bg-white", text: "text-gray-800", border: "border-gray-300", label: "Etiqueta Branca (5 Dias)" },
  yellow: { bg: "bg-yellow-400", text: "text-yellow-900", border: "border-yellow-600", label: "Etiqueta Amarela (1 Dia)" },
  red: { bg: "bg-red-600", text: "text-white", border: "border-red-800", label: "Etiqueta Vermelha (Uso Local)" },
};

export default function Books() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<any | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSearchingWeb, setIsSearchingWeb] = useState(false);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  const [viewingReviewsBook, setViewingReviewsBook] = useState<any | null>(null);
  const [magicQuery, setMagicQuery] = useState("");
  const [isMagicLoading, setIsMagicLoading] = useState(false);
  const { toast } = useToast();

  const handleMagicFill = async (image?: string, images?: string[]) => {
    if (!magicQuery && !image && !images) return;

    setIsMagicLoading(true);
    setSearchResults(null); // Clear previous searches
    try {
      const res = await apiRequest("POST", "/api/books/magic-fill", {
        query: magicQuery,
        image,
        images,
        currentCategories: categories
      });
      const data = await res.json();

      if (Array.isArray(data)) {
        // Text search returned multiple options
        setSearchResults(data);
        toast({
          title: "Resultados encontrados! 🔍",
          description: "Selecione a edição correta abaixo para preencher os dados.",
        });
      } else {
        // Image search or direct result
        populateBookForm(data);
        setMagicQuery("");
        toast({
          title: "Pirlimpimpim! ✨",
          description: "Os dados foram preenchidos e a categoria sugerida automaticamente.",
        });
      }
    } catch (error: any) {
      toast({
        title: "A magia falhou",
        description: error.message || "Tente novamente ou preencha manualmente.",
        variant: "destructive",
      });
    } finally {
      setIsMagicLoading(false);
    }
  };

  const selectSearchResult = async (book: any) => {
    populateBookForm(book);
    setSearchResults(null);
    setMagicQuery("");

    // Auto-suggest category for the selected book
    setIsMagicLoading(true);
    try {
      const res = await apiRequest("POST", "/api/books/suggest-category", {
        book,
        categories
      });
      const { categoryId } = await res.json();
      if (categoryId) {
        form.setValue("categoryId", categoryId);
        toast({
          title: "Categoria Sugerida! ✨",
          description: "A IA classificou o livro automaticamente.",
        });
      }
    } catch (error) {
      console.error("Category suggestion error:", error);
    } finally {
      setIsMagicLoading(false);
    }
  };

  const populateBookForm = (data: any) => {
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
    if (data.categoryId) {
      form.setValue("categoryId", data.categoryId);
    }
  };

  const handleMagicImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsMagicLoading(true);
    try {
      const compressedImages = await Promise.all(
        Array.from(files).map((file) => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const img = new Image();
              img.src = reader.result as string;
              img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1024;
                const MAX_HEIGHT = 1024;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                  if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                  }
                } else {
                  if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                  }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8).split(",")[1];
                resolve(compressedBase64);
              };
              img.onerror = () => reject(new Error("Erro ao carregar imagem"));
            };
            reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
            reader.readAsDataURL(file);
          });
        })
      );
      handleMagicFill(undefined, compressedImages);
    } catch (error: any) {
      toast({
        title: "Erro ao processar imagens",
        description: error.message || "Não foi possível processar as fotos.",
        variant: "destructive",
      });
    } finally {
      setIsMagicLoading(false);
    }
  };

  const { data: books, isLoading } = useQuery<any[]>({
    queryKey: ["/api/books", searchQuery, selectedCategoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (selectedCategoryFilter !== "all") params.append("categoryId", selectedCategoryFilter);
      const res = await apiRequest("GET", `/api/books?${params.toString()}`);
      return res.json();
    }
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

            <div className="p-4 rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 mb-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <Wand2 className="h-20 w-20 rotate-12" />
              </div>

              <div className="relative space-y-4">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/20 p-2 rounded-lg">
                    <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-primary">Preenchimento Mágico (IA + Web)</h4>
                    <p className="text-[11px] text-muted-foreground">Tire uma foto ou descreva o livro para preencher tudo automaticamente.</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Ex: Dom Casmurro de Machado de Assis..."
                    value={magicQuery}
                    onChange={(e) => setMagicQuery(e.target.value)}
                    className="bg-background border-primary/20 focus-visible:ring-primary"
                    disabled={isMagicLoading}
                  />
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => handleMagicFill()}
                    disabled={isMagicLoading || !magicQuery.trim()}
                    className="shadow-sm"
                  >
                    {isMagicLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Preencher"}
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="h-[1px] flex-1 bg-primary/10" />
                  <span className="text-[10px] text-muted-foreground uppercase font-bold px-2">Ou use a câmera</span>
                  <div className="h-[1px] flex-1 bg-primary/10" />
                </div>

                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2 border-primary/20 hover:bg-primary/10 text-primary"
                    onClick={() => document.getElementById('magic-image-input')?.click()}
                    disabled={isMagicLoading}
                  >
                    {isMagicLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Camera className="h-4 w-4" /> Capturar Foto(s) da Capa/Verso</>}
                  </Button>
                  <input
                    id="magic-image-input"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleMagicImageUpload}
                  />
                </div>
              </div>
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
            <Card
              key={book.id}
              data-testid={`card-book-${book.id}`}
              className={`border-2 ${book.tag === 'red' ? 'border-red-500 shadow-red-100/50' :
                book.tag === 'yellow' ? 'border-yellow-500 shadow-yellow-100/50' :
                  'border-gray-200'
                } transition-all hover:shadow-md`}
            >
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
                  <div
                    className="flex items-center gap-1.5 mt-1 cursor-pointer hover:underline decoration-yellow-400"
                    onClick={() => setViewingReviewsBook(book)}
                  >
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
      <BookReviewsDialog
        bookId={viewingReviewsBook?.id || null}
        bookTitle={viewingReviewsBook?.title}
        open={!!viewingReviewsBook}
        onOpenChange={(open) => !open && setViewingReviewsBook(null)}
      />
    </div>
  );
}
