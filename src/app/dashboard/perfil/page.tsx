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
  Trophy,
  Briefcase,
  Wallet,
  Target,
  Sparkles,
  Check
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
import { CloudiveLoading } from "@/components/brand/cloudive-loading";
import { LegacyRuinCard } from "@/components/dashboard/perfil/legacy-ruin-card";
import { handleApiError } from "@/lib/error-handler";
import { Label } from "@radix-ui/react-label";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useGamificationMode } from "@/hooks/use-gamification-mode";

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
  const [isCopied, setIsCopied] = useState(false);
  const { isClassic } = useGamificationMode();

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
      handleApiError(error, toast, "Erro ao buscar dados do perfil");
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
        toast({ title: "Avatar atualizado com sucesso!" });
      } catch (error) {
        handleApiError(error, toast, "Erro ao fazer upload da imagem");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleCopyId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      toast({
        title: "ID copiado!",
        description: "Pronto para compartilhar.",
      });
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      const response = await api.put("/user/profile", data);
      setUser(response.data);
      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
        className: "bg-gradient-to-r from-emerald-500/10 to-green-500/5 border-emerald-500/20"
      });
      window.dispatchEvent(new Event("profile-updated"));
      form.reset(response.data, { keepDirty: false });
    } catch (error) {
      handleApiError(error, toast, "Erro ao atualizar perfil");
    }
  };

  if (isLoading || !user) {
    return <CloudiveLoading withSkeleton={true} fullscreen={false} />;
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-background border p-8 md:p-12">
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative">
              <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                <AvatarImage src={avatarUrl || undefined} alt={user.name} className="object-cover" />
                <AvatarFallback className="text-4xl bg-primary/10 text-primary">{user.name.charAt(0)}</AvatarFallback>
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
                className="absolute bottom-0 right-0 h-10 w-10 rounded-full shadow-lg bg-primary hover:bg-primary/90 transition-transform hover:scale-110"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary-foreground" />
                ) : (
                  <Camera className="h-5 w-5 text-primary-foreground" />
                )}
              </Button>
            </div>
          </div>

          <div className="text-center md:text-left space-y-2 flex-1">
            {!isClassic && (
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary ring-1 ring-inset ring-primary/20 mb-2">
                <Sparkles className="h-4 w-4" />
                <span>Explorador Financeiro</span>
              </div>
            )}
            <h1 className="text-4xl font-bold font-headline tracking-tight">{user.name}</h1>
            <p className="text-muted-foreground text-lg max-w-lg">
              {isClassic
                ? "Mantenha seus dados atualizados para obter as melhores análises financeiras."
                : "Personalize sua jornada. Quanto mais completo seu perfil, melhores serão os insights da IA."
              }
            </p>

            <div className="flex items-center justify-center md:justify-start gap-2 mt-4">
              <div className="bg-background/50 backdrop-blur-sm border rounded-lg px-3 py-1.5 font-mono text-sm text-muted-foreground flex items-center gap-2">
                {isClassic ? "ID de Usuário: " : "ID: "} {user.id}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 hover:bg-primary/10 hover:text-primary"
                  onClick={handleCopyId}
                >
                  {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Background */}
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/10 to-transparent" />
        <div className="absolute -left-12 -bottom-12 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left Column: Personal Info */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="h-full shadow-lg border-t-4 border-t-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserIcon className="h-5 w-5 text-primary" />
                    Dados Pessoais
                  </CardTitle>
                  <CardDescription>
                    {isClassic ? "Suas informações básicas." : "Informações básicas do seu personagem."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome de Exibição</FormLabel>
                        <FormControl>
                          <Input placeholder="Como quer ser chamado?" {...field} className="bg-muted/30" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">E-mail</Label>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <Input
                          value={user.email}
                          onChange={(e) => {
                            // Atualiza o estado local do usuário para permitir edição do email
                            // Nota: Isso não salva no banco ainda, só no estado local para o input
                            setUser(prev => prev ? { ...prev, email: e.target.value } : null);
                          }}
                          className="bg-muted/30"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={async () => {
                            try {
                              const res = await api.put('/user/account', { email: user.email });
                              toast({
                                title: "E-mail atualizado",
                                description: res.data.message || "Verifique sua caixa de entrada.",
                              });
                              // Atualiza o user com a resposta do backend (que deve ter emailVerified: false)
                              setUser(prev => prev ? { ...prev, ...res.data } : null);
                            } catch (error: any) {
                              handleApiError(error, toast, "Erro ao atualizar e-mail");
                            }
                          }}
                        >
                          Salvar
                        </Button>
                      </div>

                      {!user.emailVerified && (
                        <div className="flex items-center justify-between bg-yellow-500/10 p-2 rounded-md border border-yellow-500/20">
                          <span className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                            <ShieldHalf className="h-3 w-3" />
                            E-mail não verificado
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs hover:bg-yellow-500/20"
                            onClick={async () => {
                              try {
                                await api.post('/auth/resend-verification', { email: user.email });
                                toast({
                                  title: "E-mail enviado!",
                                  description: "Verifique sua caixa de entrada (e spam).",
                                });
                              } catch (error) {
                                handleApiError(error, toast, "Erro ao reenviar");
                              }
                            }}
                          >
                            Reenviar Confirmação
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
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
                            className="bg-muted/30"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gênero</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? ""}>
                          <FormControl>
                            <SelectTrigger className="bg-muted/30">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="masculino">Masculino</SelectItem>
                            <SelectItem value="feminino">Feminino</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                            <SelectItem value="naodizer">Prefiro não dizer</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Financial Context */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    Contexto Financeiro
                  </CardTitle>
                  <CardDescription>
                    {isClassic
                      ? "Configure seu perfil para análises personalizadas."
                      : "Configure os atributos da sua jornada financeira para receber missões e dicas personalizadas."
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="professionalSituation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Situação Profissional</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? ""}>
                          <FormControl>
                            <SelectTrigger className="bg-muted/30">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Empregado (CLT)">Empregado (CLT)</SelectItem>
                            <SelectItem value="Autônomo/Freelancer">Autônomo/Freelancer</SelectItem>
                            <SelectItem value="Empresário/Sócio">Empresário/Sócio</SelectItem>
                            <SelectItem value="Servidor Público">Servidor Público</SelectItem>
                            <SelectItem value="Estudante">Estudante</SelectItem>
                            <SelectItem value="Aposentado/Pensionista">Aposentado/Pensionista</SelectItem>
                            <SelectItem value="Não se aplica">Não se aplica</SelectItem>
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
                        <Select onValueChange={field.onChange} value={field.value ?? ""}>
                          <FormControl>
                            <SelectTrigger className="bg-muted/30">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Até R$ 2.000">Até R$ 2.000</SelectItem>
                            <SelectItem value="R$ 2.001 - R$ 5.000">R$ 2.001 - R$ 5.000</SelectItem>
                            <SelectItem value="R$ 5.001 - R$ 10.000">R$ 5.001 - R$ 10.000</SelectItem>
                            <SelectItem value="R$ 10.001 - R$ 20.000">R$ 10.001 - R$ 20.000</SelectItem>
                            <SelectItem value="Acima de R$ 20.000">Acima de R$ 20.000</SelectItem>
                            <SelectItem value="Prefiro não informar">Prefiro não informar</SelectItem>
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
                        <Select onValueChange={field.onChange} value={field.value ?? ""}>
                          <FormControl>
                            <SelectTrigger className="bg-muted/30">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Conservador">Conservador (Segurança)</SelectItem>
                            <SelectItem value="Moderado">Moderado (Equilíbrio)</SelectItem>
                            <SelectItem value="Arrojado">Arrojado (Rentabilidade)</SelectItem>
                            <SelectItem value="Nao invisto">Ainda não invisto</SelectItem>
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
                        <FormLabel>{isClassic ? "Objetivo Principal" : "Objetivo Principal (Quest)"}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? ""}>
                          <FormControl>
                            <SelectTrigger className="bg-muted/30">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Reserva de Emergência">Reserva de Emergência</SelectItem>
                            <SelectItem value="Comprar um imóvel">Comprar um imóvel</SelectItem>
                            <SelectItem value="Comprar um carro">Comprar um carro</SelectItem>
                            <SelectItem value="Aposentadoria">Aposentadoria</SelectItem>
                            <SelectItem value="Fazer uma viagem">Fazer uma viagem</SelectItem>
                            <SelectItem value="Pagar dívidas">Pagar dívidas</SelectItem>
                            <SelectItem value="Empreender">Empreender</SelectItem>
                            <SelectItem value="Outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="justify-end border-t p-6">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting || !form.formState.isDirty}
                    className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/20"
                  >
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Salvar Alterações
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </form>
      </Form>

      {/* Legacy Ruins Section */}
      {!isClassic && (
        <Card className="shadow-lg border-t-4 border-t-amber-500/50 overflow-hidden">
          <CardHeader className="bg-gradient-to-b from-amber-500/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Trophy className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <CardTitle>Sala de Troféus (Ruínas do Legado)</CardTitle>
                <CardDescription>
                  Monumentos de suas batalhas vencidas contra as dívidas.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {ruins.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ruins.map((ruin) => (
                  <LegacyRuinCard key={ruin.id} ruin={ruin} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <ShieldHalf className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-muted-foreground">Nenhuma conquista registrada ainda.</p>
                  <p className="text-sm text-muted-foreground/70">Suas vitórias financeiras aparecerão aqui.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
