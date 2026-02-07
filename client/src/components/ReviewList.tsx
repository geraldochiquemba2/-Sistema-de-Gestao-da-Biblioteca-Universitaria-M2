import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Review, type InsertReview } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Pencil, Trash2, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReviewListProps {
    bookId: string;
}

export function ReviewList({ bookId }: ReviewListProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");

    // Edit State
    const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
    const [editingRating, setEditingRating] = useState(0);
    const [editingComment, setEditingComment] = useState("");

    const { data: reviews, isLoading } = useQuery<(Review & { userName: string })[]>({
        queryKey: ["/api/books", bookId, "reviews"],
    });

    const mutation = useMutation({
        mutationFn: async (newReview: InsertReview) => {
            const res = await apiRequest("POST", "/api/reviews", newReview);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "reviews"] });
            setRating(0);
            setComment("");
            toast({
                title: "Sucesso!",
                description: "Sua avaliação foi enviada.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Erro",
                description: error.message,
                variant: "destructive"
            });
        }
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string, data: Partial<InsertReview> }) => {
            const res = await apiRequest("PATCH", `/api/reviews/${id}`, data);
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "reviews"] });
            setEditingReviewId(null);
            toast({
                title: "Sucesso!",
                description: "Sua avaliação foi atualizada.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Erro",
                description: error.message,
                variant: "destructive"
            });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await apiRequest("DELETE", `/api/reviews/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/books", bookId, "reviews"] });
            toast({
                title: "Eliminado",
                description: "Sua avaliação foi removida.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Erro",
                description: error.message,
                variant: "destructive"
            });
        }
    });

    const handleSubmit = () => {
        if (rating === 0) {
            toast({
                title: "Avaliação necessária",
                description: "Por favor, selecione uma nota de 1 a 5 estrelas.",
                variant: "destructive",
            });
            return;
        }

        if (!user) return;

        mutation.mutate({
            bookId,
            userId: user.id,
            rating,
            comment,
        });
    };

    const handleUpdate = (id: string) => {
        if (editingRating === 0) {
            toast({
                title: "Avaliação necessária",
                description: "Por favor, selecione uma nota de 1 a 5 estrelas.",
                variant: "destructive",
            });
            return;
        }

        updateMutation.mutate({
            id,
            data: {
                rating: editingRating,
                comment: editingComment,
            }
        });
    };

    const startEditing = (review: Review) => {
        setEditingReviewId(review.id);
        setEditingRating(review.rating);
        setEditingComment(review.comment || "");
    };

    const renderStars = (score: number, interactive = false, onRate?: (n: number) => void) => {
        return (
            <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`w-5 h-5 ${star <= score
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                            } ${interactive ? "cursor-pointer hover:scale-110 transition-transform" : ""}`}
                        onClick={() => interactive && onRate?.(star)}
                    />
                ))}
            </div>
        );
    };

    if (isLoading) return <div>Carregando avaliações...</div>;

    return (
        <div className="mt-8 space-y-6">
            <h3 className="text-2xl font-bold">Avaliações e Comentários</h3>

            {/* Write Review Section */}
            {user?.userType === "student" && !editingReviewId && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Deixe sua avaliação</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <span className="font-medium">Sua nota:</span>
                            {renderStars(rating, true, setRating)}
                        </div>
                        <Textarea
                            placeholder="Escreva seu comentário sobre o livro..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="resize-none"
                        />
                        <Button
                            onClick={handleSubmit}
                            disabled={mutation.isPending}
                        >
                            {mutation.isPending ? "Enviando..." : "Enviar Avaliação"}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Reviews List */}
            <div className="space-y-4">
                {reviews?.length === 0 ? (
                    <p className="text-gray-500 italic">Nenhuma avaliação ainda. Seja o primeiro a avaliar!</p>
                ) : (
                    reviews?.map((review) => (
                        <Card key={review.id} className={editingReviewId === review.id ? "ring-2 ring-primary" : ""}>
                            <CardContent className="pt-6">
                                {editingReviewId === review.id ? (
                                    // Editing View
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center space-x-2">
                                                <span className="font-medium">Nova nota:</span>
                                                {renderStars(editingRating, true, setEditingRating)}
                                            </div>
                                            <div className="flex space-x-2">
                                                <Button size="sm" variant="ghost" onClick={() => setEditingReviewId(null)}>
                                                    <X className="w-4 h-4 mr-1" /> Cancelar
                                                </Button>
                                                <Button size="sm" onClick={() => handleUpdate(review.id)} disabled={updateMutation.isPending}>
                                                    <Check className="w-4 h-4 mr-1" /> Salvar
                                                </Button>
                                            </div>
                                        </div>
                                        <Textarea
                                            value={editingComment}
                                            onChange={(e) => setEditingComment(e.target.value)}
                                            className="resize-none"
                                        />
                                    </div>
                                ) : (
                                    // Display View
                                    <>
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="flex items-center space-x-2">
                                                    <p className="font-bold">{review.userName}</p>
                                                    {user?.id === review.userId && (
                                                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase font-bold">Tu</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-400">
                                                    {new Date(review.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                {renderStars(review.rating)}
                                                {user?.id === review.userId && (
                                                    <div className="flex space-x-1">
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-primary" onClick={() => startEditing(review)}>
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-destructive" onClick={() => deleteMutation.mutate(review.id)}>
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-gray-700 whitespace-pre-wrap">{review.comment}</p>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
