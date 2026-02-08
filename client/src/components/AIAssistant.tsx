import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookUser, X, Send, Bot, User, Loader2, Minimize2, Volume2, VolumeX } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export function AIAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "Olá! Sou o seu Mentor Digital da Biblioteca ISPTEC. Em que posso ajudá-lo hoje? 😊"
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState<number | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSpeak = (text: string, index: number) => {
        if (isSpeaking === index) {
            window.speechSynthesis.cancel();
            setIsSpeaking(null);
            return;
        }

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);

        // Sistema Inteligente de Seleção de Voz
        const voices = window.speechSynthesis.getVoices();

        // Atribuir pontuação para cada voz disponível
        const ratedVoices = voices
            .filter(v => v.lang.startsWith("pt-")) // Apenas vozes em Português
            .map(voice => {
                let score = 0;

                // Prioridade 1: Sotaque de Portugal (pt-PT) - mais comum em Angola/ISPTEC
                if (voice.lang === "pt-PT") score += 50;

                // Prioridade 2: Vozes de Alta Qualidade (Google, Microsoft, Naturais)
                const name = voice.name.toLowerCase();
                if (name.includes("google") || name.includes("microsoft") || name.includes("natural")) score += 100;
                if (name.includes("premium") || name.includes("enhanced")) score += 30;

                return { voice, score };
            })
            .sort((a, b) => b.score - a.score); // Ordenar pela melhor pontuação

        const bestVoice = ratedVoices.length > 0 ? ratedVoices[0].voice : voices.find(v => v.lang.startsWith("pt-"));

        if (bestVoice) {
            utterance.voice = bestVoice;
            utterance.lang = bestVoice.lang;
        } else {
            utterance.lang = "pt-PT"; // Fallback de idioma
        }

        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onend = () => setIsSpeaking(null);
        utterance.onerror = () => setIsSpeaking(null);

        setIsSpeaking(index);
        window.speechSynthesis.speak(utterance);
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const res = await apiRequest("POST", "/api/chat", {
                messages: [...messages, userMessage]
            });
            const data = await res.json();
            setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
        } catch (error) {
            setMessages((prev) => [...prev, {
                role: "assistant",
                content: "Ops! Tive um pequeno problema técnico. Pode tentar novamente?"
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        className="mb-4 w-[350px] sm:w-[400px]"
                    >
                        <Card className="shadow-2xl border-primary/20 bg-background/95 backdrop-blur-sm">
                            <CardHeader className="p-4 border-b bg-primary text-primary-foreground rounded-t-lg flex flex-row items-center justify-between space-y-0">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-primary-foreground/10 rounded-full">
                                        <Bot className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-sm font-bold">Mentor Digital</CardTitle>
                                        <p className="text-[10px] opacity-80">Online agora</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <Minimize2 className="h-4 w-4" />
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                <ScrollArea className="h-[400px] p-4" ref={scrollRef}>
                                    <div className="space-y-4">
                                        {messages.map((m, i) => (
                                            <div
                                                key={i}
                                                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                                            >
                                                <div
                                                    className={`max-w-[80%] p-3 rounded-2xl text-sm relative group ${m.role === "user"
                                                        ? "bg-primary text-primary-foreground rounded-tr-none"
                                                        : "bg-muted rounded-tl-none"
                                                        }`}
                                                >
                                                    <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
                                                    {m.role === "assistant" && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className={`h-6 w-6 absolute -right-8 top-1 transition-opacity ${isSpeaking === i ? 'text-primary' : 'text-muted-foreground'}`}
                                                            onClick={() => handleSpeak(m.content, i)}
                                                        >
                                                            {isSpeaking === i ? <VolumeX className="h-4 w-4 animate-pulse" /> : <Volume2 className="h-4 w-4" />}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {isLoading && (
                                            <div className="flex justify-start">
                                                <div className="bg-muted p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                                    <span className="text-xs text-muted-foreground italic">Digitando...</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                            <CardFooter className="p-3 border-t bg-muted/30">
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handleSend();
                                    }}
                                    className="flex w-full gap-2"
                                >
                                    <Input
                                        placeholder="Pergunte ao mentor..."
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        disabled={isLoading}
                                        className="flex-1 bg-background"
                                    />
                                    <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </form>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <Button
                size="lg"
                className={`h-14 w-14 rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95 ${isOpen ? 'rotate-90' : ''}`}
                onClick={() => {
                    if (isOpen) window.speechSynthesis.cancel();
                    setIsOpen(!isOpen);
                }}
            >
                {isOpen ? <X className="h-6 w-6" /> : <BookUser className="h-6 w-6" />}
            </Button>
        </div>
    );
}
