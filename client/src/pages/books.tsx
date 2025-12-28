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
import { Plus, Search, BookOpen, Tag, Camera, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const bookFormSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  author: z.string().min(1, "Autor é obrigatório"),
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
  red: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300", label: "Uso na Biblioteca" },
  yellow: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-300", label: "1 Dia" },
  white: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-700 dark:text-gray-300", label: "5 Dias" },
};

export default function Books() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();

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

        toast({
          title: "Dados extraídos!",
          description: "As informações da capa foram preenchidas automaticamente.",
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
    queryKey: searchQuery ? ["/api/books", { search: searchQuery }] : ["/api/books"],
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

  const createBookMutation = useMutation({
    mutationFn: async (data: BookFormValues) => {
      return apiRequest("/api/books", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      toast({
        title: "Livro cadastrado!",
        description: "O livro foi adicionado ao acervo com sucesso.",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cadastrar livro",
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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-book">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Livro
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Livro</DialogTitle>
              <DialogDescription>
                Preencha os dados do livro ou tire uma foto da capa para preenchimento automático
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg mb-4 bg-muted/50">
              {isScanning ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm font-medium">Analisando capa do livro...</p>
                </div>
              ) : (
                <>
                  <Camera className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2 text-center">Capture ou envie uma foto da capa para extrair os dados</p>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="max-w-xs"
                    data-testid="input-ocr-camera"
                  />
                </>
              )}
            </div>

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
                  {createBookMutation.isPending ? "Cadastrando..." : "Cadastrar Livro"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
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
                  <Badge className={`${tagColors[book.tag as keyof typeof tagColors].bg} ${tagColors[book.tag as keyof typeof tagColors].text} flex-shrink-0`}>
                    <Tag className="h-3 w-3 mr-1" />
                    {tagColors[book.tag as keyof typeof tagColors].label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{book.author}</p>
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
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <span className="font-bold text-green-600">{book.availableCopies}</span>
                      <span className="text-muted-foreground">/{book.totalCopies}</span>
                    </span>
                  </div>
                  <Badge variant={book.availableCopies > 0 ? "default" : "secondary"}>
                    {book.availableCopies > 0 ? "Disponível" : "Indisponível"}
                  </Badge>
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
