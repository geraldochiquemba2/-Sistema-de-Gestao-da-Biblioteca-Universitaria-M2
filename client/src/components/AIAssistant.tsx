import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookUser, X, Send, Bot, User, Loader2, Minimize2, Volume2, VolumeX, Settings, Sparkles, AudioLines } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    const [voiceMode, setVoiceMode] = useState<"native" | "hd">("hd");
    const scrollRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSpeak = (text: string, index: number) => {
        if (isSpeaking === index) {
            stopSpeaking();
            return;
        }

        stopSpeaking();

        if (voiceMode === "native") {
            handleNativeSpeak(text, index);
        } else {
            handleHDSpeak(text, index);
        }
    };

    const stopSpeaking = () => {
        window.speechSynthesis.cancel();
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        setIsSpeaking(null);
    };

    const handleNativeSpeak = (text: string, index: number) => {
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();

        const ratedVoices = voices
            .filter(v => v.lang.startsWith("pt-"))
            .map(voice => {
                let score = 0;
                if (voice.lang === "pt-PT") score += 50;
                const name = voice.name.toLowerCase();
                if (name.includes("google") || name.includes("microsoft") || name.includes("natural")) score += 100;
                if (name.includes("premium") || name.includes("enhanced")) score += 30;
                return { voice, score };
            })
            .sort((a, b) => b.score - a.score);

        const bestVoice = ratedVoices.length > 0 ? ratedVoices[0].voice : voices.find(v => v.lang.startsWith("pt-"));

        if (bestVoice) {
            utterance.voice = bestVoice;
            utterance.lang = bestVoice.lang;
        } else {
            utterance.lang = "pt-PT";
        }

        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.onend = () => setIsSpeaking(null);
        utterance.onerror = () => setIsSpeaking(null);

        setIsSpeaking(index);
        window.speechSynthesis.speak(utterance);
    };

    const handleHDSpeak = (text: string, index: number) => {
        // gTTS Wrapper (Open Source approach for High Quality)
        const cleanText = text.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "").substring(0, 200);
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanText)}&tl=pt-PT&client=tw-ob`;

        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => setIsSpeaking(null);
        audio.onerror = () => {
            setIsSpeaking(null);
            handleNativeSpeak(text, index); // Fallback
        };

        setIsSpeaking(index);
        audio.play().catch(() => {
            setIsSpeaking(null);
            handleNativeSpeak(text, index);
        });
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
                        <Card className="shadow-2xl border-primary/20 bg-background/95 backdrop-blur-sm overflow-hidden">
                            <CardHeader className="p-4 border-b bg-primary text-primary-foreground rounded-t-lg flex flex-row items-center justify-between space-y-0">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-primary-foreground/10 rounded-full">
                                        <Bot className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-sm font-bold">Mentor Digital</CardTitle>
                                        <p className="text-[10px] opacity-80">Qualidade: {voiceMode === "hd" ? "HD (Natural)" : "Padrão"}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20">
                                                <Settings className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56">
                                            <DropdownMenuLabel>Definições de Áudio</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => setVoiceMode("hd")} className="flex items-center justify-between cursor-pointer">
                                                <div className="flex items-center gap-2">
                                                    <Sparkles className="h-4 w-4 text-primary" />
                                                    <span>Voz HD (Google)</span>
                                                </div>
                                                {voiceMode === "hd" && <div className="h-2 w-2 rounded-full bg-primary" />}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setVoiceMode("native")} className="flex items-center justify-between cursor-pointer">
                                                <div className="flex items-center gap-2">
                                                    <AudioLines className="h-4 w-4" />
                                                    <span>Voz Nativa (eSpeak)</span>
                                                </div>
                                                {voiceMode === "native" && <div className="h-2 w-2 rounded-full bg-primary" />}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                                        onClick={() => {
                                            stopSpeaking();
                                            setIsOpen(false);
                                        }}
                                    >
                                        <Minimize2 className="h-4 w-4" />
                                    </Button>
                                </div>
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
                    if (isOpen) stopSpeaking();
                    setIsOpen(!isOpen);
                }}
            >
                {isOpen ? <X className="h-6 w-6" /> : <BookUser className="h-6 w-6" />}
            </Button>
        </div>
    );
}
