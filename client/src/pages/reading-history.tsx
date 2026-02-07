import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { BookOpen, Calendar, Clock, Trophy } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function ReadingHistory() {
    const { user } = useAuth();

    const { data: loans, isLoading } = useQuery({
        queryKey: ["/api/loans/user", user?.id],
        enabled: !!user?.id,
    });

    if (isLoading) {
        return <div className="p-8 text-center">Carregando histórico...</div>;
    }

    const loansList = Array.isArray(loans) ? loans : [];

    // Calculate Stats
    const totalBooksRead = loansList.filter((l: any) => l.status === "returned").length;
    const activeLoans = loansList.filter((l: any) => l.status === "active").length;

    // Mock gamification/level based on books read
    const getLevel = (count: number) => {
        if (count >= 50) return "Leitor Mestre 📚👑";
        if (count >= 20) return "Leitor Ávido 📖🔥";
        if (count >= 5) return "Leitor Iniciante 🐛";
        return "Novo Leitor 🌱";
    };

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-2">Meu Currículo de Leitura</h1>
                <p className="text-muted-foreground">companhe sua jornada literária e histórico de empréstimos.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Livros Lidos</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalBooksRead}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Nível de Leitor</CardTitle>
                        <Trophy className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-sm">{getLevel(totalBooksRead)}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Empréstimos Ativos</CardTitle>
                        <Clock className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeLoans}</div>
                    </CardContent>
                </Card>
            </div>

            {/* History Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Histórico de Empréstimos</CardTitle>
                    <CardDescription>Lista completa de todos os livros que você já pegou.</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Mobile View: Cards */}
                    <div className="md:hidden space-y-4" data-testid="history-cards-mobile">
                        {loansList.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                Nenhum empréstimo registrado.
                            </div>
                        ) : (
                            loansList.map((loan: any) => (
                                <Card key={loan.id} className="p-4 border shadow-none bg-muted/20">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="font-bold text-lg leading-tight">{loan.book?.title || "Livro Desconhecido"}</div>
                                        <Badge variant={loan.status === "active" ? "default" : "secondary"}>
                                            {loan.status === "active" ? "Ativo" : "Devolvido"}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <div className="text-muted-foreground font-semibold uppercase text-[10px]">Data Empréstimo</div>
                                            <div>{format(new Date(loan.loanDate), "dd/MM/yyyy", { locale: pt })}</div>
                                        </div>
                                        <div>
                                            <div className="text-muted-foreground font-semibold uppercase text-[10px]">Entrega Prevista</div>
                                            <div>{format(new Date(loan.dueDate), "dd/MM/yyyy", { locale: pt })}</div>
                                        </div>
                                    </div>

                                    {loan.returnDate && (
                                        <div className="mt-3 pt-3 border-t">
                                            <div className="text-muted-foreground font-semibold uppercase text-[10px]">Devolvido Em</div>
                                            <div className="text-emerald-600 font-medium">
                                                {format(new Date(loan.returnDate), "dd/MM/yyyy", { locale: pt })}
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            ))
                        )}
                    </div>

                    {/* Desktop View: Table */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Livro</TableHead>
                                    <TableHead>Data Empréstimo</TableHead>
                                    <TableHead>Devolução Prevista</TableHead>
                                    <TableHead>Devolvido Em</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loansList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24">
                                            Nenhum empréstimo registrado.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    loansList.map((loan: any) => (
                                        <TableRow key={loan.id}>
                                            <TableCell className="font-medium">{loan.book?.title || "Livro Desconhecido"}</TableCell>
                                            <TableCell>{format(new Date(loan.loanDate), "dd/MM/yyyy", { locale: pt })}</TableCell>
                                            <TableCell>{format(new Date(loan.dueDate), "dd/MM/yyyy", { locale: pt })}</TableCell>
                                            <TableCell>
                                                {loan.returnDate
                                                    ? format(new Date(loan.returnDate), "dd/MM/yyyy", { locale: pt })
                                                    : "-"}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={loan.status === "active" ? "default" : "secondary"}>
                                                    {loan.status === "active" ? "Ativo" : "Devolvido"}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
