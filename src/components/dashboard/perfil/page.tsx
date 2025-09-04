// src/app/dashboard/perfil/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Camera,
  Loader2,
  User as UserIcon,
  ShieldHalf,
  Copy,
} from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { User, LegacyRuin } from "@/lib/definitions";
import api from "@/lib/api";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { LegacyRuinCard } from "@/components/dashboard/perfil/legacy-ruin-card";
import { Label } from "@radix-ui/react-label";

const profileSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
  gender: z
    .enum(["masculino", "feminino", "outro", "naodizer"])
    .optional()
    .nullable(),
  age: z.coerce
    .number()
    .min(10, "Idade inválida.")
    .max(120, "Idade inválida.")
    .optional()
    .nullable(),
  avatarUrl: z.string().optional().nullable(),
  professionalSituation: z.string().optional().nullable(),
  monthlyIncomeRange: z.string().optional().nullable(),
  investmentProfile: z.string().optional().nullable(),
  mainFinancialGoal: z.string().optional().nullable(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function PerfilPage() {
  const [user, setUser] = useState<User | null>(null);
  const [ruins, setRuins] = useState<LegacyRuin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", gender: null, age: null, avatarUrl: null },
  });

  const { isSubmitting } = form.formState;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [userRes, ruinsRes] = await Promise.all([
        api.get("/user"),
        api.get("/user/legacy-ruins"),
      ]);

      const userData = userRes.data;
      setUser(userData);
      setRuins(ruinsRes.data);
      form.reset(userData);

      if (userData.avatarUrl) {
        const presignedUrlRes = await api.post("/storage/get-url", {
          objectName: userData.avatarUrl,
        });
        setAvatarUrl(presignedUrlRes.data.url);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao buscar dados do perfil",
      });
    } finally {
      setIsLoading(false);
    }
  }, [form, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      try {
        const response = await api.post("/storage/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const { objectName } = response.data;
        form.setValue("avatarUrl", objectName, {
          shouldValidate: true,
          shouldDirty: true,
        });

        const presignedUrlRes = await api.post("/storage/get-url", {
          objectName,
        });
        setAvatarUrl(presignedUrlRes.data.url);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erro ao fazer upload da imagem",
        });
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleCopyId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      toast({
        title: "ID de Jogador copiado!",
        description:
          "Agora você pode compartilhar seu ID para receber convites de família.",
      });
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      const response = await api.put("/user/profile", data);
      setUser(response.data);
      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas.",
      });
      window.dispatchEvent(new Event("profile-updated"));
      form.reset(response.data, { keepDirty: false });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao atualizar perfil" });
    }
  };

  if (isLoading || !user) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <UserIcon className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold font-headline">Meu Perfil</h1>
          <p className="text-muted-foreground">
            Personalize suas informações para uma experiência única.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>
                Estes dados nos ajudam a entender você, mas não são
                obrigatórios.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarUrl || undefined} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/png, image/jpeg, image/gif"
                    onChange={handleAvatarChange}
                  />
                  <Button
                    type="button"
                    size="icon"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="w-full grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome de Exibição</FormLabel>
                        <FormControl>
                          <Input placeholder="Seu nome" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Idade</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === "" ? null : e.target.value
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Seu ID de Jogador</Label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={user.id}
                    className="font-mono text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCopyId}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Compartilhe este ID para ser convidado para uma família.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contexto Financeiro</CardTitle>
              <CardDescription>
                Informações que nos ajudam a personalizar suas dicas e análises
                de IA no futuro.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="professionalSituation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Situação Profissional</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Empregado (CLT)">
                          Empregado (CLT)
                        </SelectItem>
                        <SelectItem value="Autônomo/Freelancer">
                          Autônomo/Freelancer
                        </SelectItem>
                        <SelectItem value="Empresário/Sócio">
                          Empresário/Sócio
                        </SelectItem>
                        <SelectItem value="Servidor Público">
                          Servidor Público
                        </SelectItem>
                        <SelectItem value="Estudante">Estudante</SelectItem>
                        <SelectItem value="Aposentado/Pensionista">
                          Aposentado/Pensionista
                        </SelectItem>
                        <SelectItem value="Não se aplica">
                          Não se aplica
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="monthlyIncomeRange"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Faixa de Renda Mensal</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Até R$ 2.000">
                          Até R$ 2.000
                        </SelectItem>
                        <SelectItem value="R$ 2.001 - R$ 5.000">
                          R$ 2.001 - R$ 5.000
                        </SelectItem>
                        <SelectItem value="R$ 5.001 - R$ 10.000">
                          R$ 5.001 - R$ 10.000
                        </SelectItem>
                        <SelectItem value="R$ 10.001 - R$ 20.000">
                          R$ 10.001 - R$ 20.000
                        </SelectItem>
                        <SelectItem value="Acima de R$ 20.000">
                          Acima de R$ 20.000
                        </SelectItem>
                        <SelectItem value="Prefiro não informar">
                          Prefiro não informar
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="investmentProfile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Perfil de Investidor</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Conservador">
                          Conservador (Priorizo segurança)
                        </SelectItem>
                        <SelectItem value="Moderado">
                          Moderado (Equilíbrio risco-retorno)
                        </SelectItem>
                        <SelectItem value="Arrojado">
                          Arrojado (Busco alta rentabilidade)
                        </SelectItem>
                        <SelectItem value="Nao invisto">
                          Ainda não invisto
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mainFinancialGoal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Principal Objetivo Financeiro</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Reserva de Emergência">
                          Reserva de Emergência
                        </SelectItem>
                        <SelectItem value="Comprar um imóvel">
                          Comprar um imóvel
                        </SelectItem>
                        <SelectItem value="Comprar um carro">
                          Comprar um carro
                        </SelectItem>
                        <SelectItem value="Aposentadoria">
                          Aposentadoria
                        </SelectItem>
                        <SelectItem value="Fazer uma viagem">
                          Fazer uma viagem
                        </SelectItem>
                        <SelectItem value="Pagar dívidas">
                          Pagar dívidas
                        </SelectItem>
                        <SelectItem value="Empreender">Empreender</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="justify-end">
              <Button
                type="submit"
                disabled={isSubmitting || !form.formState.isDirty}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Salvar Perfil
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <ShieldHalf className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>As Ruínas do Legado</CardTitle>
              <CardDescription>
                Monumentos de suas batalhas vencidas contra as dívidas.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {ruins.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ruins.map((ruin) => (
                <LegacyRuinCard key={ruin.id} ruin={ruin} />
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <p>
                Nenhuma dívida foi derrotada ainda. Sua história aguarda para
                ser escrita!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
