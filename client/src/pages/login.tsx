import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import logoImage from "@assets/image_1763306167272.png";

export default function Login() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerUserType, setRegisterUserType] = useState<"student" | "teacher" | "staff">("student");

  const { toast } = useToast();
  const { login } = useAuth();

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", credentials);
      return await response.json();
    },
    onSuccess: (data) => {
      login(data.user);
      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vindo ${data.user.name}`,
      });

      setTimeout(() => {
        switch (data.user.userType) {
          case "admin":
            setLocation("/dashboard");
            break;
          case "teacher":
            setLocation("/teacher/dashboard");
            break;
          case "student":
            setLocation("/student/dashboard");
            break;
          case "staff":
            setLocation("/staff/dashboard");
            break;
          default:
            setLocation("/");
        }
      }, 100);
    },
    onError: (error: any) => {
      toast({
        title: "Erro no login",
        description: error.message || "Credenciais inválidas",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: {
      name: string;
      username: string;
      email: string;
      password: string;
      userType: string;
    }) => {
      const response = await apiRequest("POST", "/api/users", userData);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Agora você pode fazer login com suas credenciais",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setRegisterName("");
      setRegisterEmail("");
      setRegisterPassword("");
      setRegisterUserType("student");
    },
    onError: (error: any) => {
      let errorMessage = error.message || "Não foi possível criar a conta";

      if (errorMessage.includes("duplicate key") || errorMessage.includes("users_username_unique")) {
        errorMessage = "Este utilizador já está cadastrado. Por favor, faça login.";
      }

      toast({
        title: "Erro no cadastro",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      toast({
        title: "Erro no login",
        description: "Por favor, preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    let fullUsername = username;

    if (username.includes('@')) {
      if (!username.endsWith('@isptec.co.ao')) {
        toast({
          title: "Erro no login",
          description: "Apenas emails @isptec.co.ao são permitidos",
          variant: "destructive",
        });
        return;
      }
    } else {
      fullUsername = `${username}@isptec.co.ao`;
    }

    loginMutation.mutate({ username: fullUsername, password });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();

    if (!registerName || !registerEmail || !registerPassword) {
      toast({
        title: "Erro no cadastro",
        description: "Por favor, preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    if (registerPassword.length < 6) {
      toast({
        title: "Erro no cadastro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    let fullEmail = registerEmail;
    let username = registerEmail;

    if (registerEmail.includes('@')) {
      if (!registerEmail.endsWith('@isptec.co.ao')) {
        toast({
          title: "Erro no cadastro",
          description: "Apenas emails @isptec.co.ao são permitidos",
          variant: "destructive",
        });
        return;
      }
      username = registerEmail;
      fullEmail = registerEmail;
    } else {
      fullEmail = `${registerEmail}@isptec.co.ao`;
      username = `${registerEmail}@isptec.co.ao`;
    }

    // Validação de tipo de conta vs formato de email/ID
    const isNumeric = /^\d/.test(registerEmail);

    if (registerUserType === "student" && !isNumeric) {
      toast({
        title: "Erro no cadastro",
        description: "Estudantes devem usar o número de matrícula.",
        variant: "destructive",
      });
      return;
    }

    if ((registerUserType === "teacher" || registerUserType === "staff") && isNumeric) {
      toast({
        title: "Erro no cadastro",
        description: "Docentes e Funcionários devem usar o email institucional (nome.sobrenome).",
        variant: "destructive",
      });
      return;
    }

    registerMutation.mutate({
      name: registerName,
      username: username,
      email: fullEmail,
      password: registerPassword,
      userType: registerUserType,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 -z-10">
        <img
          src="https://images.pexels.com/photos/8199629/pexels-photo-8199629.jpeg"
          alt="Biblioteca de fundo"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-start">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            data-testid="button-back"
            className="gap-2 text-white backdrop-blur-md bg-white/10 border border-white/20"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center">
              <img src={logoImage} alt="ISPTEC Logo" className="h-20 w-20 object-contain" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white">Biblioteca ISPTEC</h1>
            <p className="text-lg text-white mt-2">
              Sistema de Gestão Bibliotecária
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bem-vindo</CardTitle>
            <CardDescription>
              Entre com sua conta ou crie uma nova
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" data-testid="tab-login">Login</TabsTrigger>
                <TabsTrigger value="register" data-testid="tab-register">Cadastro</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Email/Número de Matrícula</Label>
                    <div className="flex items-center gap-0 border rounded-md bg-background">
                      <Input
                        id="username"
                        type="text"
                        placeholder="joao.silva"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        data-testid="input-login-username"
                        disabled={loginMutation.isPending}
                        className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                      <span className="pr-3 text-sm text-muted-foreground whitespace-nowrap">@isptec.co.ao</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      data-testid="input-login-password"
                      disabled={loginMutation.isPending}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    data-testid="button-login"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
                <div className="mt-4 text-sm text-muted-foreground text-center">
                  <p>Credenciais padrão:</p>
                  <p className="font-mono">admin / 123456789</p>
                </div>
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Nome Completo</Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="João Silva"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      data-testid="input-register-name"
                      disabled={registerMutation.isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email/Número de Matrícula</Label>
                    <div className="flex items-center gap-0 border rounded-md bg-background">
                      <Input
                        id="register-email"
                        type="text"
                        placeholder="joao.silva"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        data-testid="input-register-email"
                        disabled={registerMutation.isPending}
                        className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                      <span className="pr-3 text-sm text-muted-foreground whitespace-nowrap">@isptec.co.ao</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Senha</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="••••••••"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      data-testid="input-register-password"
                      disabled={registerMutation.isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-type">Tipo de Utilizador</Label>
                    <Select
                      value={registerUserType}
                      onValueChange={(value: "student" | "teacher" | "staff") => setRegisterUserType(value)}
                      disabled={registerMutation.isPending}
                    >
                      <SelectTrigger data-testid="select-register-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Estudante</SelectItem>
                        <SelectItem value="teacher">Docente</SelectItem>
                        <SelectItem value="staff">Funcionário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    data-testid="button-register"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? "Criando conta..." : "Criar Conta"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center space-y-4">
          <div className="text-xs text-white space-y-1">
            <p>Instituto Superior Politécnico de Tecnologias e Ciências</p>
            <p className="font-medium">© 2024 ISPTEC - Todos os direitos reservados</p>
          </div>
        </div>
      </div>
    </div>
  );
}
