import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAuthorSchema, type Author } from "@shared/schema";
import { Plus, Search, Edit, Trash2, Loader2, Users } from "lucide-react";
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

export default function Authors() {
    const [searchQuery, setSearchQuery] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);
    const { toast } = useToast();

    const { data: authors, isLoading } = useQuery<Author[]>({
        queryKey: ["/api/authors"],
    });

    const form = useForm({
        resolver: zodResolver(insertAuthorSchema),
        defaultValues: {
            name: "",
            biography: "",
        },
    });

    const onSubmit = (data: any) => {
        mutation.mutate(data);
    };

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            if (editingAuthor) {
                return apiRequest("PATCH", `/api/authors/${editingAuthor.id}`, data);
            }
            return apiRequest("POST", "/api/authors", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/authors"] });
            setIsDialogOpen(false);
            setEditingAuthor(null);
            form.reset();
            toast({
                title: editingAuthor ? "Autor atualizado" : "Autor cadastrado",
                description: `O autor foi ${editingAuthor ? "atualizado" : "cadastrado"} com sucesso.`,
            });
        },
        onError: (error: any) => {
            toast({
                title: "Erro ao salvar autor",
                description: error.message || "Tente novamente",
                variant: "destructive",
            });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return apiRequest("DELETE", `/api/authors/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/authors"] });
            toast({
                title: "Autor excluído",
                description: "O autor foi removido com sucesso.",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Erro ao excluir autor",
                description: error.message || "Tente novamente",
                variant: "destructive",
            });
        },
    });

    const filteredAuthors = authors?.filter((author) =>
        author.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const openAddDialog = () => {
        setEditingAuthor(null);
        form.reset({ name: "", biography: "" });
        setIsDialogOpen(true);
    };

    const openEditDialog = (author: Author) => {
        setEditingAuthor(author);
        form.reset({
            name: author.name,
            biography: author.biography || "",
        });
        setIsDialogOpen(true);
    };

    return (
        <div className="flex-1 space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestão de Autores</h1>
                    <p className="text-muted-foreground">
                        Gerir os autores cadastrados no sistema
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openAddDialog}>
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Autor
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingAuthor ? "Editar Autor" : "Novo Autor"}
                            </DialogTitle>
                            <DialogDescription>
                                Preencha os dados do autor abaixo.
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nome Completo</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Ex: Machado de Assis" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="biography"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Biografia (Opcional)</FormLabel>
                                            <FormControl>
                                                <Textarea {...field} value={field.value || ""} placeholder="Breve biografia do autor" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full" disabled={mutation.isPending}>
                                    {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {editingAuthor ? "Atualizar" : "Cadastrar"}
                                </Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Buscar autores..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="h-32 animate-pulse bg-muted" />
                    ))}
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredAuthors?.map((author) => (
                        <Card key={author.id}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-primary" />
                                        {author.name}
                                    </div>
                                </CardTitle>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(author)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Excluir Autor</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Tem certeza que deseja excluir o autor "{author.name}"? Esta ação não pode ser desfeita e só funcionará se não houver livros vinculados.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => deleteMutation.mutate(author.id)}
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                >
                                                    Excluir
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground line-clamp-3">
                                    {author.biography || "Sem biografia disponível."}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
