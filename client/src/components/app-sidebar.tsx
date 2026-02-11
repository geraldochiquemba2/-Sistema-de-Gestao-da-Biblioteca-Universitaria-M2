import {
  BookOpen,
  Users,
  BookCopy,
  FileText,
  LayoutDashboard,
  AlertCircle,
  Search,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const getMenuItems = () => {
    if (user?.userType === "student") {
      return [
        { title: "Dashboard", url: "/student/dashboard", icon: LayoutDashboard },
        { title: "Meus Empréstimos", url: "/student/loans", icon: BookCopy },
        { title: "Currículo do Leitor", url: "/student/history", icon: FileText },
        { title: "Pesquisar Livros", url: "/student/books", icon: Search },
        { title: "Repositório Digital", url: "/repository", icon: BookOpen },
      ];
    }
    if (user?.userType === "teacher") {
      return [
        { title: "Dashboard", url: "/teacher/dashboard", icon: LayoutDashboard },
        { title: "Meus Empréstimos", url: "/teacher/loans", icon: BookCopy },
        { title: "Currículo do Leitor", url: "/teacher/history", icon: FileText },
        { title: "Pesquisar Livros", url: "/teacher/books", icon: Search },
        { title: "Repositório Digital", url: "/repository", icon: BookOpen },
      ];
    }
    if (user?.userType === "staff") {
      return [
        { title: "Dashboard", url: "/staff/dashboard", icon: LayoutDashboard },
        { title: "Meus Empréstimos", url: "/staff/loans", icon: BookCopy },
        { title: "Currículo do Leitor", url: "/staff/history", icon: FileText },
        { title: "Pesquisar Livros", url: "/staff/books", icon: Search },
        { title: "Repositório Digital", url: "/repository", icon: BookOpen },
      ];
    }
    // Admin menu items
    return [
      {
        title: "Painel Principal",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Catálogo de Livros",
        url: "/books",
        icon: BookOpen,
      },
      {
        title: "Gestão de Empréstimos",
        url: "/loans",
        icon: BookCopy,
      },
      {
        title: "Utilizadores",
        url: "/users",
        icon: Users,
      },
      {
        title: "Multas",
        url: "/fines",
        icon: AlertCircle,
      },
      {
        title: "Relatórios",
        url: "/reports",
        icon: FileText,
      },
      {
        title: "Repositório Digital",
        url: "/repository",
        icon: BookOpen,
      },
      {
        title: "Autores",
        url: "/authors",
        icon: Users,
      },
      {
        title: "Categorias",
        url: "/categories",
        icon: Tag,
      },
    ];
  };

  const menuItems = getMenuItems();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
            <BookOpen className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Biblioteca ISPTEC</h2>
            <p className="text-xs text-muted-foreground">Sistema de Gestão</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`link-${item.title.toLowerCase().replace(" ", "-")}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
