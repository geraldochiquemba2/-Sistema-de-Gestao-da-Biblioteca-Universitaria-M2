import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Download, BookOpen, ExternalLink, Loader2, Library } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ExternalBook {
    id: string;
    title: string;
    authors: string[];
    publisher?: string;
    publishedDate?: string;
    description?: string;
    pageCount?: number;
    imageLinks?: {
        thumbnail: string;
    };
    downloadLink?: string;
    previewLink: string;
    isPdfAvailable: boolean;
    isEpubAvailable: boolean;
}

export default function Repository() {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeSearch, setActiveSearch] = useState("");
    const { toast } = useToast();

    const { data: books, isLoading, error } = useQuery<ExternalBook[]>({
        queryKey: ["/api/external-books", { query: activeSearch }],
        queryFn: async () => {
            if (!activeSearch) return [];
            const res = await apiRequest("GET", `/api/external-books?query=${encodeURIComponent(activeSearch)}`);
            return res.json();
        },
        enabled: !!activeSearch,
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setActiveSearch(searchQuery);
    };

    return (
        <div className="flex-1 space-y-6 p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Library className="h-8 w-8 text-primary" />
                    Repositório Digital
                </h1>
                <p className="text-muted-foreground">
                    Pesquise e baixe obras de domínio público (Gratuitas) diretamente do Google Books.
                </p>
            </div>

            {/* Search Bar */}
            <Card className="p-4 bg-muted/50">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <Input
                        placeholder="Pesquisar por tema, autor ou título (ex: Direito, Machado de Assis)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1"
                    />
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                        Pesquisar
                    </Button>
                </form>
            </Card>

            {/* Results */}
            {error ? (
                <div className="text-center p-8 text-destructive">
                    <p>Erro ao buscar livros. Tente novamente.</p>
                </div>
            ) : isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Card key={i} className="h-64 animate-pulse bg-muted/20" />
                    ))}
                </div>
            ) : books?.length === 0 && activeSearch ? (
                <div className="text-center p-12 bg-muted/20 rounded-lg">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">Nenhum livro gratuito encontrado</h3>
                    <p className="text-muted-foreground">Tente outro termo de pesquisa.</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {books?.map((book) => (
                        <Card key={book.id} className="flex flex-col h-full hover:shadow-lg transition-shadow">
                            <CardHeader className="flex-row gap-4 space-y-0">
                                {book.imageLinks?.thumbnail ? (
                                    <img
                                        src={book.imageLinks.thumbnail.replace("http:", "https:")}
                                        alt={book.title}
                                        className="w-20 h-28 object-cover rounded shadow-sm bg-muted"
                                    />
                                ) : (
                                    <div className="w-20 h-28 bg-muted flex items-center justify-center rounded">
                                        <BookOpen className="h-8 w-8 text-muted-foreground/50" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <CardTitle className="text-base font-bold line-clamp-3 leading-tight mb-1">
                                        {book.title}
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {book.authors?.join(", ")}
                                    </p>
                                    <div className="flex gap-2 mt-2">
                                        {book.isPdfAvailable && <Badge variant="secondary" className="text-[10px]">PDF</Badge>}
                                        {book.isEpubAvailable && <Badge variant="secondary" className="text-[10px]">EPUB</Badge>}
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="flex-1">
                                <p className="text-xs text-muted-foreground line-clamp-4">
                                    {book.description || "Sem descrição disponível."}
                                </p>
                            </CardContent>

                            <CardFooter className="pt-4 border-t gap-2">
                                {book.downloadLink ? (
                                    <Button className="w-full" asChild>
                                        <a href={book.downloadLink} target="_blank" rel="noreferrer">
                                            <Download className="h-4 w-4 mr-2" />
                                            Baixar
                                        </a>
                                    </Button>
                                ) : (
                                    <Button variant="outline" className="w-full" asChild>
                                        <a href={book.previewLink} target="_blank" rel="noreferrer">
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            Ler Online
                                        </a>
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
