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
    const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedNativeVoice, setSelectedNativeVoice] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            const ptVoices = voices.filter(v => v.lang.startsWith("pt-"));
            setAvailableVoices(ptVoices);

            if (ptVoices.length > 0 && !selectedNativeVoice) {
                // Tenta encontrar pt-PT primeiro, senão pega a primeira disponível
                const best = ptVoices.find(v => v.lang === "pt-PT") || ptVoices[0];
                setSelectedNativeVoice(best.name);
            }
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }, [selectedNativeVoice]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const cleanTextForSpeech = (text: string) => {
        // Regex robusta para remover emojis e símbolos especiais que o TTS tenta ler
        return text
            .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, "")
            .replace(/[😊🚀📚🔊✨⚙️🤖🏆💎✅🎨💡📝🔍📅⏳📌⚠️❌🛑]/g, "") // Emojis comuns
            .trim();
    };

    const handleSpeak = (text: string, index: number) => {
        if (isSpeaking === index) {
            stopSpeaking();
            return;
        }

        stopSpeaking();
        const cleanedText = cleanTextForSpeech(text);
        if (!cleanedText) return;

        if (voiceMode === "native") {
            handleNativeSpeak(cleanedText, index);
        } else {
            handleHDSpeak(cleanedText, index);
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
        const voice = voices.find(v => v.name === selectedNativeVoice) || voices.find(v => v.lang.startsWith("pt-"));

        if (voice) {
            utterance.voice = voice;
            utterance.lang = voice.lang;
        } else {
            utterance.lang = "pt-PT";
        }

        utterance.rate = 1.0;
        utterance.onend = () => setIsSpeaking(null);
        utterance.onerror = () => setIsSpeaking(null);

        setIsSpeaking(index);
        window.speechSynthesis.speak(utterance);
    };

    const handleHDSpeak = (text: string, index: number) => {
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text.substring(0, 200))}&tl=pt-PT&client=tw-ob`;

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
                                        <DropdownMenuContent align="end" className="w-64">
                                            <DropdownMenuLabel>Definições de Áudio</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => setVoiceMode("hd")} className="flex items-center justify-between cursor-pointer">
                                                <div className="flex items-center gap-2">
                                                    <Sparkles className="h-4 w-4 text-primary" />
                                                    <span>Voz HD (Google)</span>
                                                </div>
                                                {voiceMode === "hd" && <div className="h-2 w-2 rounded-full bg-primary" />}
                                            </DropdownMenuItem>

                                            <DropdownMenuSeparator />
                                            <DropdownMenuLabel className="text-[10px] font-normal opacity-50 uppercase tracking-wider">Vozes do Sistema</DropdownMenuLabel>
                                            {availableVoices.length === 0 && (
                                                <div className="px-2 py-1.5 text-xs text-muted-foreground italic">
                                                    Nenhuma voz nativa encontrada
                                                </div>
                                            )}
                                            {availableVoices.map((voice) => (
                                                <DropdownMenuItem
                                                    key={voice.name}
                                                    onClick={() => {
                                                        setVoiceMode("native");
                                                        setSelectedNativeVoice(voice.name);
                                                    }}
                                                    className="flex items-center justify-between cursor-pointer"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <AudioLines className="h-4 w-4" />
                                                        <span className="truncate max-w-[150px]">{voice.name.replace("Microsoft ", "").replace("Google ", "")}</span>
                                                    </div>
                                                    {voiceMode === "native" && selectedNativeVoice === voice.name && (
                                                        <div className="h-2 w-2 rounded-full bg-primary" />
                                                    )}
                                                </DropdownMenuItem>
                                            ))}
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
