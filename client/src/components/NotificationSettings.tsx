import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";

export function NotificationSettings() {
    const { user, updateUser } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
    const [smsEnabled, setSmsEnabled] = useState(user?.smsNotifications || false);

    // Update local state when user data changes/loads
    useEffect(() => {
        if (user) {
            setPhoneNumber(user.phoneNumber || "");
            setSmsEnabled(user.smsNotifications || false);
        }
    }, [user]);

    const updateSettingsMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("PATCH", `/api/users/${user?.id}`, {
                phoneNumber,
                smsNotifications: smsEnabled
            });
            return res.json();
        },
        onSuccess: (updatedUser: any) => {
            toast({
                title: "Sucesso",
                description: "Configurações de notificação atualizadas com sucesso.",
            });
            updateUser(updatedUser);
            queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        },
        onError: (error: Error) => {
            toast({
                title: "Erro",
                description: error.message || "Falha ao atualizar configurações.",
                variant: "destructive"
            });
        }
    });

    if (!user) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Configurações de Notificação
                </CardTitle>
                <CardDescription>
                    Receba alertas sobre devoluções e multas via SMS
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="phone">Número de Telefone (Angola)</Label>
                    <div className="flex gap-2">
                        <Input
                            id="phone"
                            placeholder="923 000 000"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Insira um número válido (ex: 923 123 456).
                    </p>
                </div>

                <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="sms-alerts" className="flex flex-col space-y-1">
                        <span>Alertas por SMS</span>
                        <span className="font-normal text-xs text-muted-foreground">
                            Receba avisos quando o prazo estiver acabando
                        </span>
                    </Label>
                    <Switch
                        id="sms-alerts"
                        checked={smsEnabled}
                        onCheckedChange={setSmsEnabled}
                    />
                </div>

                <Button
                    onClick={() => updateSettingsMutation.mutate()}
                    disabled={updateSettingsMutation.isPending}
                    className="w-full"
                >
                    {updateSettingsMutation.isPending ? (
                        "Salvando..."
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Salvar Configurações
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
