import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCategorySchema, type Category } from "@shared/schema";
import { Plus, Search, Edit, Trash2, Loader2, Tag } from "lucide-react";
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

export default function Categories() {
    const [searchQuery, setSearchQuery] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const { toast } = useToast();

    const { data: categories, isLoading } = useQuery<Category[]>({
        queryKey: ["/api/categories"],
    });

    const form = useForm({
        resolver: zodResolver(insertCategorySchema),
        defaultValues: {
            name: "",
            description: "",
        },
    });

    const onSubmit = (data: any) => {
        mutation.mutate(data);
    };

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            if (editingCategory) {
                return apiRequest("PATCH", `/api/categories/${editingCategory.id}`, data);
            }
            return apiRequest("POST", "/api/categories", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
            setIsDialogOpen(false);
            setEditingCategory(null);
            form.reset();
            toast({
                title: editingCategory ? "Categoria atualizada" : "Categoria criada",
                description: `A categoria foi ${editingCategory ? "atualizada" : "criada"} com sucesso.`,
            });
        },
        onError: (error: any) => {
            toast({
                title: "Erro ao salvar categoria",
                description: error.message || "Tente novamente",
                variant: "destructive",
            });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return apiRequest("DELETE", `/api/categories/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
            toast({
                title: "Categoria excluída",
                description: "A categoria foi removida com sucesso.",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Erro ao excluir categoria",
                description: error.message || "Tente novamente",
                variant: "destructive",
            });
        },
    });

    const filteredCategories = categories?.filter((cat) =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const openAddDialog = () => {
        setEditingCategory(null);
        form.reset({ name: "", description: "" });
        setIsDialogOpen(true);
    };

    const openEditDialog = (category: Category) => {
        setEditingCategory(category);
        form.reset({
            name: category.name,
            description: category.description || "",
        });
        setIsDialogOpen(true);
    };

    return (
        <div className="flex-1 space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestão de Categorias</h1>
                    <p className="text-muted-foreground">
                        Gerir as categorias de livros do acervo
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openAddDialog}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nova Categoria
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingCategory ? "Editar Categoria" : "Nova Categoria"}
                            </DialogTitle>
                            <DialogDescription>
                                Preencha os dados da categoria abaixo.
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nome</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Ex: Engenharia de Software" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Descrição (Opcional)</FormLabel>
                                            <FormControl>
                                                <Input {...field} value={field.value || ""} placeholder="Breve descrição da categoria" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full" disabled={mutation.isPending}>
                                    {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {editingCategory ? "Atualizar" : "Criar"}
                                </Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Buscar categorias..."
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
                    {filteredCategories?.map((category) => (
                        <Card key={category.id}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    <div className="flex items-center gap-2">
                                        <Tag className="h-4 w-4 text-primary" />
                                        {category.name}
                                    </div>
                                </CardTitle>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(category)}>
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
                                                <AlertDialogTitle>Excluir Categoria</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Tem certeza que deseja excluir a categoria "{category.name}"? Esta ação não pode ser desfeita e só funcionará se não houver livros vinculados.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => deleteMutation.mutate(category.id)}
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
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                    {category.description || "Sem descrição disponível."}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
