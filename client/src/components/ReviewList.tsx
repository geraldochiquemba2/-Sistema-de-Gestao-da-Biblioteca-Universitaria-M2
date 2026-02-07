import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Review, type InsertReview } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, StarHalf } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReviewListProps {
    bookId: string;
}

export function ReviewList({ bookId }: ReviewListProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const renderStars = (score: number, interactive = false) => {
        return (
            <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`w-5 h-5 ${star <= score
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                            } ${interactive ? "cursor-pointer hover:scale-110 transition-transform" : ""}`}
                        onClick={() => interactive && setRating(star)}
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
            {user?.userType === "student" && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Deixe sua avaliação</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <span className="font-medium">Sua nota:</span>
                            {renderStars(rating, true)}
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
                        <Card key={review.id}>
                            <CardContent className="pt-6">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="font-bold">{review.userName}</p>
                                        <p className="text-xs text-gray-400">
                                            {new Date(review.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    {renderStars(review.rating)}
                                </div>
                                <p className="text-gray-700">{review.comment}</p>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
