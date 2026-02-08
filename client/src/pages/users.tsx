import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Eye } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { UserDetailsDialog } from "@/components/UserDetailsDialog";

// Helper type for the enriched user data
type UserWithStats = User & {
  currentLoans: number;
  totalLoansHistory: number;
  fines: number;
  totalFinesHistory: number;
};

const userTypeConfig = {
  teacher: { text: "Docente", limit: "4 livros, 15 dias" },
  student: { text: "Estudante", limit: "2 livros, 5 dias" },
  staff: { text: "Funcionário", limit: "2 livros, 5 dias" },
  admin: { text: "Administrador", limit: "Ilimitado" },
} as const;

// Helper to map DB user types to config keys
function getUserTypeKey(type: string): keyof typeof userTypeConfig {
  if (type === "teacher" || type === "student" || type === "staff" || type === "admin") {
    return type;
  }
  return "student"; // Default fallback
}

const statusConfig = {
  true: { text: "Ativo", color: "bg-chart-2 text-white" },
  false: { text: "Inativo", color: "bg-destructive text-destructive-foreground" },
};

export default function Users() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const { data: users, isLoading } = useQuery<UserWithStats[]>({
    queryKey: ["/api/users"],
  });

  const normalize = (str: string) =>
    str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const filteredUsers = (users || []).filter((user) => {
    const searchNormalized = normalize(searchQuery);
    const matchesSearch =
      normalize(user.name).includes(searchNormalized) ||
      normalize(user.email).includes(searchNormalized);
    const matchesType = typeFilter === "all" || user.userType === typeFilter;
    return matchesSearch && matchesType;
  });

  if (isLoading) {
    return <div className="p-6">Carregando utilizadores...</div>;
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Utilizadores</h1>
          <p className="text-muted-foreground">
            Gerencie os utilizadores da biblioteca e seus acessos
          </p>
        </div>
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nome ou email..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-users"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-user-type">
            <SelectValue placeholder="Tipo de Utilizador" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            <SelectItem value="teacher">Docente</SelectItem>
            <SelectItem value="student">Estudante</SelectItem>
            <SelectItem value="staff">Funcionário</SelectItem>
            <SelectItem value="admin">Administrador</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        {/* Mobile View: Cards */}
        <div className="md:hidden space-y-4 p-4" data-testid="user-cards-mobile">
          {filteredUsers.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Nenhum utilizador encontrado
            </div>
          ) : (
            filteredUsers.map((user) => (
              <Card key={user.id} className="p-4 space-y-4" data-testid={`card-user-${user.id}`}>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate" data-testid={`text-name-mobile-${user.id}`}>{user.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                  </div>
                  <Badge className={statusConfig[String(user.isActive) as "true" | "false"].color}>
                    {statusConfig[String(user.isActive) as "true" | "false"].text}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase font-semibold">Tipo</div>
                    <div className="text-sm font-medium capitalize">{userTypeConfig[getUserTypeKey(user.userType)].text}</div>
                    <div className="text-[10px] text-muted-foreground">{userTypeConfig[getUserTypeKey(user.userType)].limit}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase font-semibold">Empréstimos</div>
                    <div className="text-sm font-medium">{user.currentLoans} ativos / {user.totalLoansHistory} total</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase font-semibold">Multas</div>
                    {Number(user.fines) > 0 ? (
                      <div className="text-sm font-bold text-destructive">{user.fines} Kz</div>
                    ) : (
                      <div className="text-sm text-muted-foreground">Isento</div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedUserId(user.id);
                      setIsDetailsOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Detalhes
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilizador</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Empréstimos (Ativos/Total)</TableHead>
                <TableHead>Multas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum utilizador encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium" data-testid={`text-name-${user.id}`}>{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium capitalize">{userTypeConfig[getUserTypeKey(user.userType)].text}</div>
                        <div className="text-xs text-muted-foreground">
                          {userTypeConfig[getUserTypeKey(user.userType)].limit}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell data-testid={`text-loans-${user.id}`}>
                      <span className="font-medium text-primary">{user.currentLoans}</span>
                      <span className="text-muted-foreground mx-1">/</span>
                      <span className="text-muted-foreground text-xs">{user.totalLoansHistory} total</span>
                    </TableCell>
                    <TableCell>
                      {Number(user.fines) > 0 ? (
                        <span className="text-destructive font-medium" data-testid={`text-fines-${user.id}`}>
                          {user.fines} Kz
                        </span>
                      ) : Number(user.totalFinesHistory) > 0 ? (
                        <span className="text-muted-foreground text-xs italic" title="Teve multas anteriormente (já liquidado)">
                          Liquidado ({user.totalFinesHistory} Kz)
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusConfig[String(user.isActive) as "true" | "false"].color} data-testid={`badge-status-${user.id}`}>
                        {statusConfig[String(user.isActive) as "true" | "false"].text}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedUserId(user.id);
                          setIsDetailsOpen(true);
                        }}
                        data-testid={`button-view-${user.id}`}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <UserDetailsDialog
        userId={selectedUserId}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />
    </div>
  );
}
