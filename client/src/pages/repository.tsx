import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Download, BookOpen, ExternalLink, Loader2, Library, Star, Globe } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ExternalBook {
    id: string;
    source: string;
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
    const [source, setSource] = useState("all");
    const { toast } = useToast();

    const { data: books, isLoading, error } = useQuery<ExternalBook[]>({
        queryKey: ["/api/external-books", { query: activeSearch, source }],
        queryFn: async () => {
            if (!activeSearch) return [];
            const res = await apiRequest("GET", `/api/external-books?query=${encodeURIComponent(activeSearch)}&source=${source}`);
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
        <div className="flex-1 space-y-6 p-6 pb-24 md:pb-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Library className="h-8 w-8 text-primary" />
                    Repositório Digital
                </h1>
                <p className="text-muted-foreground">
                    Pesquise e baixe obras de domínio público de múltiplas fontes: Google Books, Open Library e Project Gutenberg.
                </p>
            </div>

            {/* Featured External Source: welib.org */}
            <div className="grid gap-6 md:grid-cols-1">
                <Card className="overflow-hidden border-primary/20 shadow-md bg-gradient-to-r from-primary/5 to-transparent">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <Badge className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 px-3 py-1">
                                <Star className="h-3 w-3 fill-current" />
                                Recomendado pelo ISPTEC
                            </Badge>
                            <Globe className="h-5 w-5 text-muted-foreground/50" />
                        </div>
                        <div className="mt-4 flex items-center gap-4">
                            <div className="h-16 w-16 bg-white rounded-lg border shadow-sm flex items-center justify-center p-2">
                                <img src="https://welib.org/favicon.ico" alt="welib.org" className="h-10 w-10 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<Library class="h-8 w-8 text-primary" />'; }} />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-bold">welib.org</CardTitle>
                                <p className="text-sm text-muted-foreground font-medium">Biblioteca Digital Universal e Gratuita</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <p className="text-sm text-foreground/80 leading-relaxed max-w-2xl">
                            A **welib.org** é uma das maiores plataformas de acesso a livros digitais gratuitos do mundo.
                            Ideal para encontrar bibliografia académica, clássicos da literatura e manuais técnicos em diversos idiomas.
                        </p>
                    </CardContent>
                    <CardFooter className="bg-muted/30 border-t py-4">
                        <Button asChild size="lg" className="w-full md:w-auto font-bold shadow-sm transition-all hover:scale-[1.02]">
                            <a href="https://welib.org" target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-5 w-5 mr-2" />
                                Aceder à welib.org Agora
                            </a>
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            {/* Search Bar */}
            <Card className="p-4 bg-muted/50">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-2">
                    <Select value={source} onValueChange={setSource}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas as Fontes</SelectItem>
                            <SelectItem value="google">Google Books</SelectItem>
                            <SelectItem value="openlibrary">Open Library</SelectItem>
                            <SelectItem value="gutenberg">Gutenberg</SelectItem>
                            <SelectItem value="doab">DOAB (PDFs Académicos)</SelectItem>
                            <SelectItem value="welib">welib.org (Busca Externa)</SelectItem>
                        </SelectContent>
                    </Select>
                    <Input
                        placeholder="Pesquisar por tema, autor ou título..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 w-full"
                    />
                    {source === "welib" ? (
                        <Button
                            type="button"
                            className="w-full md:w-auto bg-[#0056b3] hover:bg-[#004494]"
                            onClick={() => window.open(`https://welib.org/search?q=${encodeURIComponent(searchQuery)}`, "_blank")}
                        >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Buscar na welib.org
                        </Button>
                    ) : (
                        <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                            Pesquisar
                        </Button>
                    )}
                </form>
            </Card>

            {/* Quick Search - African Literature */}
            <Card className="p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Literatura Africana e Angolana
                </h3>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setSearchQuery("Pepetela"); setActiveSearch("Pepetela"); }}>
                        Pepetela
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setSearchQuery("Ondjaki"); setActiveSearch("Ondjaki"); }}>
                        Ondjaki
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setSearchQuery("José Eduardo Agualusa"); setActiveSearch("José Eduardo Agualusa"); }}>
                        Agualusa
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setSearchQuery("Luandino Vieira"); setActiveSearch("Luandino Vieira"); }}>
                        Luandino Vieira
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setSearchQuery("Mia Couto"); setActiveSearch("Mia Couto"); }}>
                        Mia Couto
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setSearchQuery("Chinua Achebe"); setActiveSearch("Chinua Achebe"); }}>
                        Chinua Achebe
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setSearchQuery("Chimamanda Adichie"); setActiveSearch("Chimamanda Adichie"); }}>
                        Chimamanda
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setSearchQuery("Angola literatura"); setActiveSearch("Angola literatura"); }}>
                        Literatura Angolana
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setSearchQuery("African literature"); setActiveSearch("African literature"); }}>
                        Literatura Africana
                    </Button>
                </div>
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
                                    <div className="flex gap-2 mt-2 flex-wrap">
                                        <Badge variant="outline" className="text-[10px]">{book.source}</Badge>
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
                                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold" asChild>
                                        <a href={book.downloadLink} target="_blank" rel="noreferrer">
                                            <Download className="h-4 w-4 mr-2" />
                                            Baixar Agora
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
