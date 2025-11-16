import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { BookOpen, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mock login - em produção, isso seria uma chamada à API
    if (email && password) {
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao Sistema de Gestão da Biblioteca ISPTEC",
      });
      setLocation("/dashboard");
    } else {
      toast({
        title: "Erro no login",
        description: "Por favor, preencha todos os campos",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 -z-10">
        <img 
          src="https://images.pexels.com/photos/8199629/pexels-photo-8199629.jpeg" 
          alt="Biblioteca de fundo" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/85 to-background/90" />
      </div>
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-start">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            data-testid="button-back"
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-lg">
              <BookOpen className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Biblioteca ISPTEC</h1>
            <p className="text-lg text-muted-foreground mt-2">
              Sistema de Gestão Bibliotecária
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Iniciar Sessão</CardTitle>
            <CardDescription>
              Entre com suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu.email@isptec.ao"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="input-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="input-password"
                />
              </div>
              <Button type="submit" className="w-full" data-testid="button-login">
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center space-y-4">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <Card className="p-3">
              <div className="font-bold text-lg text-primary">3.842</div>
              <div className="text-xs text-muted-foreground">Livros</div>
            </Card>
            <Card className="p-3">
              <div className="font-bold text-lg text-primary">247</div>
              <div className="text-xs text-muted-foreground">Empréstimos</div>
            </Card>
            <Card className="p-3">
              <div className="font-bold text-lg text-primary">1.856</div>
              <div className="text-xs text-muted-foreground">Utilizadores</div>
            </Card>
          </div>
          
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Instituto Superior Politécnico de Tecnologias e Ciências</p>
            <p className="font-medium">© 2024 ISPTEC - Todos os direitos reservados</p>
          </div>
        </div>
      </div>
    </div>
  );
}
