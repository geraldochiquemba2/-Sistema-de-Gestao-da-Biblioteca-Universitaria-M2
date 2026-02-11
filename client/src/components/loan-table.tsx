import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { format, differenceInDays } from "date-fns";

export interface Loan {
  id: string;
  userId: string;
  userName: string;
  userType: "docente" | "estudante" | "funcionario";
  bookId: string;
  bookTitle: string;
  loanDate: Date;
  dueDate: Date;
  status: "active" | "overdue" | "returned";
  renewalCount: number;
  fine?: number;
}

interface LoanTableProps {
  loans: Loan[];
  onReturn?: (loanId: string) => void;
  onRenew?: (loanId: string) => void;
  onViewUser?: (loanId: string) => void;
}

const statusConfig = {
  active: { text: "Ativo", color: "bg-chart-2 text-white" },
  overdue: { text: "Atrasado", color: "bg-destructive text-destructive-foreground" },
  returned: { text: "Devolvido", color: "bg-muted text-muted-foreground" },
};

export function LoanTable({ loans, onReturn, onRenew, onViewUser }: LoanTableProps) {
  const getDaysRemaining = (dueDate: Date) => {
    const days = differenceInDays(dueDate, new Date());
    return days;
  };

  return (
    <div className="rounded-md border">
      {/* Mobile View: Cards */}
      <div className="md:hidden space-y-4 p-4" data-testid="loan-cards-mobile">
        {loans.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Nenhum empréstimo encontrado
          </div>
        ) : (
          loans.map((loan) => {
            const daysRemaining = getDaysRemaining(loan.dueDate);
            return (
              <Card key={loan.id} className="p-4 space-y-3" data-testid={`card-loan-${loan.id}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-lg">{loan.userName}</div>
                    <div className="text-xs text-muted-foreground capitalize">{loan.userType}</div>
                  </div>
                  <Badge className={statusConfig[loan.status].color}>
                    {statusConfig[loan.status].text}
                  </Badge>
                </div>

                <div>
                  <div className="text-sm font-medium text-muted-foreground">Livro</div>
                  <div>{loan.bookTitle}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-muted-foreground">Empréstimo</div>
                    <div>{format(loan.loanDate, "dd/MM/yyyy")}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Devolução</div>
                    <div>{format(loan.dueDate, "dd/MM/yyyy")}</div>
                  </div>
                </div>

                {loan.status === "active" && (
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span className={daysRemaining < 0 ? "text-destructive" : "text-emerald-600"}>
                      {daysRemaining < 0
                        ? `${Math.abs(daysRemaining)} dias de atraso`
                        : `${daysRemaining} dias restantes`}
                    </span>
                    <span className="text-muted-foreground text-xs font-bold bg-muted px-2 py-0.5 rounded">
                      Renovações: {loan.renewalCount}/2
                    </span>
                  </div>
                )}

                {loan.fine ? (
                  <div className="p-2 bg-destructive/10 text-destructive rounded-md font-bold text-center">
                    Multa: {loan.fine} Kz
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  {(loan.status === "active" || loan.status === "overdue") && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => onRenew?.(loan.id)}
                      >
                        Renovar
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => onReturn?.(loan.id)}
                      >
                        Devolver
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => onViewUser?.(loan.id)}
                  >
                    Ver Utilizador
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Desktop View: Table */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Utilizador</TableHead>
              <TableHead>Título do Livro</TableHead>
              <TableHead>Data de Empréstimo</TableHead>
              <TableHead>Data de Devolução</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Renovações</TableHead>
              <TableHead>Multa</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhum empréstimo encontrado
                </TableCell>
              </TableRow>
            ) : (
              loans.map((loan) => {
                const daysRemaining = getDaysRemaining(loan.dueDate);
                return (
                  <TableRow key={loan.id} data-testid={`row-loan-${loan.id}`}>
                    <TableCell>
                      <div>
                        <div className="font-medium" data-testid={`text-user-${loan.id}`}>{loan.userName}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {loan.userType}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell data-testid={`text-book-${loan.id}`}>{loan.bookTitle}</TableCell>
                    <TableCell>{format(loan.loanDate, "dd/MM/yyyy")}</TableCell>
                    <TableCell>
                      <div>
                        <div>{format(loan.dueDate, "dd/MM/yyyy")}</div>
                        {loan.status === "active" && (
                          <div className={`text-xs ${daysRemaining < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                            {daysRemaining < 0
                              ? `${Math.abs(daysRemaining)} dias de atraso`
                              : `${daysRemaining} dias restantes`}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusConfig[loan.status].color} data-testid={`badge-status-${loan.id}`}>
                        {statusConfig[loan.status].text}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-bold text-muted-foreground bg-muted/50 px-2 py-1 rounded inline-block">
                        {loan.renewalCount}/2
                      </div>
                    </TableCell>
                    <TableCell>
                      {loan.fine !== undefined && loan.fine !== null ? (
                        <span className={loan.fine > 0 ? "text-destructive font-medium" : "text-muted-foreground"} data-testid={`text-fine-${loan.id}`}>
                          {loan.fine} Kz
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        {(loan.status === "active" || loan.status === "overdue") && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onRenew?.(loan.id)}
                              data-testid={`button-renew-${loan.id}`}
                            >
                              Renovar
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => onReturn?.(loan.id)}
                              data-testid={`button-return-${loan.id}`}
                            >
                              Devolver
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewUser?.(loan.id)}
                          data-testid={`button-view-user-${loan.id}`}
                        >
                          Ver Utilizador
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
