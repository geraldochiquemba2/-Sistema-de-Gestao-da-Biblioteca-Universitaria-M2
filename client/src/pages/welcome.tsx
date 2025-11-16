import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Users, Clock, Search, ArrowRight } from "lucide-react";

export default function Welcome() {
  const [, setLocation] = useLocation();

  const features = [
    {
      icon: BookOpen,
      title: "Acervo Completo",
      description: "Mais de 3.800 livros especializados em tecnologia e informática",
    },
    {
      icon: Search,
      title: "Busca Inteligente",
      description: "Encontre rapidamente o livro que precisa com nosso sistema de busca avançado",
    },
    {
      icon: Clock,
      title: "Gestão de Empréstimos",
      description: "Acompanhe seus empréstimos e prazos de devolução de forma simples",
    },
    {
      icon: Users,
      title: "Acesso Rápido",
      description: "Sistema disponível para estudantes, docentes e funcionários",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="relative min-h-screen flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10 -z-10" />
        
        <header className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                <BookOpen className="h-7 w-7 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Biblioteca ISPTEC</h2>
                <p className="text-sm text-muted-foreground">Sistema de Gestão</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setLocation("/login")}
              data-testid="button-login-header"
            >
              Entrar
            </Button>
          </div>
        </header>

        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto space-y-16">
            <div className="text-center space-y-6 py-12">
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
                Bem-vindo à
                <br />
                <span className="text-primary">Biblioteca ISPTEC</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                O seu portal de conhecimento em tecnologia e ciência da computação.
                Acesse nosso acervo completo e gerencie seus empréstimos de forma fácil e eficiente.
              </p>
              <div className="flex gap-4 justify-center flex-wrap pt-4">
                <Button 
                  size="lg"
                  onClick={() => setLocation("/login")}
                  data-testid="button-access-system"
                  className="gap-2"
                >
                  Acessar Sistema
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <Card key={index} data-testid={`card-feature-${index}`}>
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="bg-primary/5 rounded-lg p-8 md:p-12 space-y-6">
              <div className="max-w-3xl mx-auto text-center space-y-4">
                <h2 className="text-3xl font-bold">Pronto para começar?</h2>
                <p className="text-muted-foreground">
                  Entre no sistema com suas credenciais institucionais e tenha acesso a todo o nosso acervo,
                  reserve livros, gerencie empréstimos e muito mais.
                </p>
                <div className="pt-4">
                  <Button 
                    size="lg" 
                    onClick={() => setLocation("/login")}
                    data-testid="button-start-now"
                  >
                    Começar Agora
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="border-t py-8">
          <div className="container mx-auto px-4">
            <div className="text-center text-sm text-muted-foreground space-y-2">
              <p className="font-medium">© 2024 ISPTEC - Instituto Superior Politécnico de Tecnologias e Ciências</p>
              <p>Todos os direitos reservados</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
