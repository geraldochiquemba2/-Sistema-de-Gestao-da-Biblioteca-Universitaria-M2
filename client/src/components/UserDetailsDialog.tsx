import { useQuery } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { BookOpen, Clock, Trophy, History, Loader2 } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface UserDetailsDialogProps {
    userId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function UserDetailsDialog({ userId, open, onOpenChange }: UserDetailsDialogProps) {
    const { data: userData, isLoading: userLoading } = useQuery<any>({
        queryKey: ["/api/users", userId],
        enabled: !!userId && open,
    });

    const { data: loans, isLoading: loansLoading } = useQuery<any[]>({
        queryKey: ["/api/loans/user", userId],
        enabled: !!userId && open,
    });

    const isLoading = userLoading || loansLoading;
    const loansList = loans || [];

    const totalBooksRead = loansList.filter((l: any) => l.status === "returned").length;
    const activeLoansCount = loansList.filter((l: any) => l.status === "active").length;

    const getLevel = (count: number) => {
        if (count >= 50) return "Leitor Mestre 📚👑";
        if (count >= 20) return "Leitor Ávido 📖🔥";
        if (count >= 5) return "Leitor Iniciante 🐛";
        return "Novo Leitor 🌱";
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Perfil do Utilizador</DialogTitle>
                    <DialogDescription>
                        Informações detalhadas e histórico de leitura.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : userData ? (
                    <div className="space-y-6 flex-1 overflow-hidden flex flex-col">
                        <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                                {userData.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">{userData.name}</h2>
                                <p className="text-sm text-muted-foreground">{userData.email}</p>
                                <div className="flex gap-2 mt-1">
                                    <Badge variant="outline" className="capitalize">
                                        {userData.userType === 'teacher' ? 'Docente' : userData.userType === 'student' ? 'Estudante' : userData.userType}
                                    </Badge>
                                    <Badge className={userData.isActive ? "bg-chart-2" : "bg-destructive"}>
                                        {userData.isActive ? "Ativo" : "Inativo"}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <Card className="bg-primary/5 border-primary/10">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Livros Lidos</CardTitle>
                                    <BookOpen className="h-4 w-4 text-primary" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{totalBooksRead}</div>
                                </CardContent>
                            </Card>

                            <Card className="bg-chart-2/5 border-chart-2/10">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Empréstimos Ativos</CardTitle>
                                    <Clock className="h-4 w-4 text-chart-2" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{activeLoansCount}</div>
                                </CardContent>
                            </Card>

                            <Card className="bg-yellow-500/5 border-yellow-500/10">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Nivel</CardTitle>
                                    <Trophy className="h-4 w-4 text-yellow-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm font-bold">{getLevel(totalBooksRead)}</div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                            <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                                <History className="h-5 w-5" />
                                Histórico de Empréstimos
                            </h3>
                            <ScrollArea className="flex-1 border rounded-md">
                                <Table>
                                    <TableHeader className="bg-muted/50 sticky top-0 z-10">
                                        <TableRow>
                                            <TableHead>Livro</TableHead>
                                            <TableHead>Data Empréstimo</TableHead>
                                            <TableHead>Data Prevista</TableHead>
                                            <TableHead>Multa</TableHead>
                                            <TableHead>Estado</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loansList.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-10 text-muted-foreground font-medium">
                                                    Nenhum empréstimo encontrado para este utilizador.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            loansList.map((loan: any) => (
                                                <TableRow key={loan.id}>
                                                    <TableCell className="font-medium max-w-[250px] truncate">
                                                        {loan.bookTitle || loan.book?.title || "Livro desconhecido"}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap">
                                                        {format(new Date(loan.loanDate), "dd/MM/yyyy", { locale: pt })}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap">
                                                        {format(new Date(loan.dueDate), "dd/MM/yyyy", { locale: pt })}
                                                    </TableCell>
                                                    <TableCell>
                                                        {loan.fine ? (
                                                            <span className="text-destructive font-medium">{loan.fine} Kz</span>
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )}
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
                            </ScrollArea>
                        </div>
                    </div>
                ) : (
                    <div className="py-20 text-center text-muted-foreground font-medium">
                        Não foi possível carregar os dados do utilizador.
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
