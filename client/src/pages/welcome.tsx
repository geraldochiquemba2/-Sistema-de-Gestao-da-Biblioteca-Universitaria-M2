import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Users, Clock, Search, ArrowRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import logoImage from "@assets/image_1763306167272.png";
import libraryBooksImage from "@assets/stock_images/library_books_collec_eea0da0c.jpg";
import searchTechImage from "@assets/stock_images/digital_library_sear_4c7902fd.jpg";
import readingBookImage from "@assets/stock_images/person_reading_book__57d87551.jpg";
import studentsImage from "@assets/stock_images/students_studying_to_5a27559c.jpg";

export default function Welcome() {
  const [, setLocation] = useLocation();

  const carouselImages = [
    "https://www.isptec.co.ao/public/assets/img/uploads/img-2597461014.jpeg",
    "https://scontent.flad5-1.fna.fbcdn.net/v/t39.30808-6/474685231_7537366406387327_4344414854034230848_n.jpg?_nc_cat=102&ccb=1-7&_nc_sid=3a1ebe&_nc_eui2=AeGrDWjWbH3E8cYV0oQbwLEs7zytRnucbiTvPK1Ge5xuJM6ff8z-JWlQJO4Fp4952L52Y2ybByJwMVPRm7ZM3jSo&_nc_ohc=n0tcU46mcWwQ7kNvwGMNPgn&_nc_oc=AdnslNiOy_2cA_VkRk-2cXfEpGnLbyTH6rIliaZMBCThf0LEDAsOyFevjJiUn88VcCA&_nc_zt=23&_nc_ht=scontent.flad5-1.fna&_nc_gid=o4jsX3UnbuQw_mu48mDBEQ&oh=00_AfiMhAZC7DvX2ABoD1U6O_rU-aVLJjCYozTWZzdz-VCsmQ&oe=691FAE7A",
    "https://scontent.flad5-1.fna.fbcdn.net/v/t39.30808-6/474621421_7537366189720682_8005053412394855097_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=3a1ebe&_nc_eui2=AeH2zvLGbR7999s7_XJwpSCG2mnUgTyeVFvaadSBPJ5UWwwm1-kfKc589gaZdTqEj35s-g_BXpPboJx1IOIGA2OK&_nc_ohc=4Yyg2oDjD2wQ7kNvwGVTAB_&_nc_oc=AdliOzc6XoG1RW4FLkDtkIzph04gN7DqISUqVheFioa-lZw_P8jSMVR_V4eS561FksI&_nc_zt=23&_nc_ht=scontent.flad5-1.fna&_nc_gid=6VfQg0BCoOWPgzTDWcg7rw&oh=00_Afg9jFMWL1C9JJrTQa04hPPMk_OlvPKKS0tStmSOLtUnVA&oe=691FC20A",
    "https://www.isptec.co.ao/public/assets/img/uploads/img-1888091388.jpeg",
    "https://www.menosfios.com/wp-content/uploads/2023/09/img-3436081329-scaled.jpeg",
  ];

  const features = [
    {
      icon: BookOpen,
      title: "Acervo Completo",
      description: "Mais de 3.800 livros especializados em tecnologia e informática",
      image: libraryBooksImage,
    },
    {
      icon: Search,
      title: "Busca Inteligente",
      description: "Encontre rapidamente o livro que precisa com nosso sistema de busca avançado",
      image: searchTechImage,
    },
    {
      icon: Clock,
      title: "Gestão de Empréstimos",
      description: "Acompanhe seus empréstimos e prazos de devolução de forma simples",
      image: readingBookImage,
    },
    {
      icon: Users,
      title: "Acesso Rápido",
      description: "Sistema disponível para estudantes, docentes e funcionários",
      image: studentsImage,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="relative min-h-screen flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10 -z-10" />
        
        <header className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center">
                <img src={logoImage} alt="ISPTEC Logo" className="h-12 w-12 object-contain" />
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

        <main className="flex-1 container mx-auto px-4 py-4">
          <div className="max-w-6xl mx-auto space-y-16">
            <div className="grid md:grid-cols-2 gap-12 items-center py-4">
              <div className="space-y-6">
                <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
                  Bem-vindo à
                  <br />
                  <span className="text-primary">Biblioteca ISPTEC</span>
                </h1>
                <p className="text-xl text-muted-foreground">
                  O seu portal de conhecimento em tecnologia e ciência da computação.
                  Acesse nosso acervo completo e gerencie seus empréstimos de forma fácil e eficiente.
                </p>
                <div className="flex gap-4 flex-wrap pt-4">
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

              <div className="relative">
                <Carousel
                  opts={{
                    align: "start",
                    loop: true,
                  }}
                  plugins={[
                    Autoplay({
                      delay: 4000,
                    }),
                  ]}
                  className="w-full"
                  data-testid="carousel-images"
                >
                  <CarouselContent>
                    {carouselImages.map((image, index) => (
                      <CarouselItem key={index}>
                        <div className="relative aspect-video rounded-lg overflow-hidden shadow-xl">
                          <img
                            src={image}
                            alt={`Imagem da biblioteca ISPTEC ${index + 1}`}
                            className="w-full h-full object-cover"
                            data-testid={`carousel-image-${index}`}
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-2" data-testid="carousel-prev" />
                  <CarouselNext className="right-2" data-testid="carousel-next" />
                </Carousel>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <Card key={index} data-testid={`card-feature-${index}`} className="overflow-hidden relative">
                  <div className="absolute inset-0">
                    <img 
                      src={feature.image} 
                      alt={feature.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/70 to-black/50" />
                  </div>
                  <CardContent className="pt-6 space-y-3 relative z-10">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg text-white">{feature.title}</h3>
                    <p className="text-sm text-white/90 leading-relaxed">
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
