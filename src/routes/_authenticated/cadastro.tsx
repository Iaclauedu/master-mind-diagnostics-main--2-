import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Plus, RefreshCw, Trash2, Users, UserCheck, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/cadastro")({
  head: () => ({
    meta: [{ title: "Cadastro · Master Business" }],
  }),
  component: ClientesPage,
});

type Aluno = {
  id: number;
  nome: string;
  turma: string;
  mentor_responsavel: string;
  data_entrada: string;
  imersao: string;
  usuario_id: string | null;
  usuarios?: {
    email: string;
    role: string;
  } | null;
};

function generatePassword(length = 8) {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const nums = "23456789";
  const specials = "!@#$%&*?";
  const all = upper + lower + nums + specials;
  const pick = (set: string) => {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return set[arr[0] % set.length];
  };
  const chars = [pick(upper), pick(lower), pick(nums), pick(specials)];
  for (let i = chars.length; i < length; i++) chars.push(pick(all));
  for (let i = chars.length - 1; i > 0; i--) {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    const j = arr[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

const emptyForm = () => ({
  nome: "",
  turma: "",
  mentor_responsavel: "",
  data_entrada: "",
  imersao: "",
  email: "",
  senha: generatePassword(),
  role: "aluno",
});

function ClientesPage() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchAlunos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("alunos")
      .select("*, usuarios ( email, role )")
      .order("id", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar alunos", { description: error.message });
    } else {
      setAlunos((data as Aluno[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAlunos();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.nome ||
      !form.turma ||
      !form.mentor_responsavel ||
      !form.data_entrada ||
      !form.imersao ||
      !form.email ||
      !form.senha ||
      !form.role
    ) {
      toast.error("Preencha todos os campos");
      return;
    }
    setSaving(true);

    try {
      // 1. Obter a URL e Key do cliente local do Supabase
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || (supabase as any).supabaseUrl;
      const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || (supabase as any).supabaseKey;

      if (!SUPABASE_URL || !SUPABASE_KEY) {
        throw new Error("Credenciais do Supabase não configuradas no ambiente.");
      }

      // 2. Instanciar cliente temporário com persistSession: false para não derrubar o mentor
      const tempSupabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      });

      // 3. Cadastrar no Supabase Auth
      const { data: authData, error: authError } = await tempSupabase.auth.signUp({
        email: form.email,
        password: form.senha,
        options: {
          data: {
            nome: form.nome,
            role: form.role,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Usuário de autenticação não foi retornado.");

      // 4. Salvar na tabela alunos com o usuario_id correspondente (apenas se for aluno)
      if (form.role === "aluno") {
        const { error: insertError } = await supabase.from("alunos").insert({
          nome: form.nome,
          turma: form.turma,
          mentor_responsavel: form.mentor_responsavel,
          data_entrada: form.data_entrada,
          imersao: form.imersao,
          usuario_id: authData.user.id,
        });

        if (insertError) throw insertError;
      }

      toast.success("Cadastro realizado com sucesso!", {
        description: `E-mail: ${form.email} | Senha gerada: ${form.senha} (Copie e envie ao usuário)`,
        duration: 15000,
      });

      setForm(emptyForm());
      fetchAlunos();
    } catch (err: any) {
      toast.error("Erro ao cadastrar cliente", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from("alunos").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir", { description: error.message });
      return;
    }
    toast.success("Cliente removido");
    fetchAlunos();
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 shadow-lg shadow-indigo-500/30">
          <Users className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Cadastro</h1>
          <p className="text-sm text-slate-400">Cadastre e gerencie os usuários (mentores e alunos) do sistema</p>
        </div>
      </div>

      <Card className="border-white/10 bg-slate-900/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-white">Novo cadastro</CardTitle>
          <CardDescription>Preencha os dados abaixo. O usuário será criado no Supabase Auth automaticamente.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-slate-200">Nome</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Nome completo"
                className="bg-slate-950/50 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="turma" className="text-slate-200">Turma</Label>
              <Input
                id="turma"
                value={form.turma}
                onChange={(e) => setForm({ ...form, turma: e.target.value })}
                placeholder="Ex: Turma 2026.1"
                className="bg-slate-950/50 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mentor" className="text-slate-200">Mentor responsável</Label>
              <Input
                id="mentor"
                value={form.mentor_responsavel}
                onChange={(e) => setForm({ ...form, mentor_responsavel: e.target.value })}
                placeholder="Nome do mentor"
                className="bg-slate-950/50 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data" className="text-slate-200">Data de entrada</Label>
              <div className="flex gap-2">
                <Input
                  id="data"
                  type="date"
                  value={form.data_entrada}
                  onChange={(e) => setForm({ ...form, data_entrada: e.target.value })}
                  className="bg-slate-950/50 border-white/10 text-white flex-1 h-10"
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-white/10 bg-slate-950/50 text-slate-200 hover:bg-slate-800 h-10 px-3 shrink-0"
                    >
                      <CalendarIcon className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="dark bg-slate-900 border-white/10 text-slate-100 p-0 w-auto" align="end">
                    <Calendar
                      mode="single"
                      selected={form.data_entrada ? parseISO(form.data_entrada) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          const formattedDate = format(date, "yyyy-MM-dd");
                          setForm({ ...form, data_entrada: formattedDate });
                        } else {
                          setForm({ ...form, data_entrada: "" });
                        }
                      }}
                      locale={ptBR}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="imersao" className="text-slate-200">Imersão</Label>
              <Input
                id="imersao"
                value={form.imersao}
                onChange={(e) => setForm({ ...form, imersao: e.target.value })}
                placeholder="Nome da imersão"
                className="bg-slate-950/50 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@exemplo.com"
                className="bg-slate-950/50 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="role" className="text-slate-200">Tipo de Acesso</Label>
              <select
                id="role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="flex h-10 w-full rounded-md border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="aluno" className="bg-slate-900 text-white">Aluno</option>
                <option value="mentor" className="bg-slate-900 text-white">Mentor</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="senha" className="text-slate-200">Senha de Cadastro</Label>
              <div className="flex gap-2">
                <Input
                  id="senha"
                  value={form.senha}
                  onChange={(e) => setForm({ ...form, senha: e.target.value })}
                  className="bg-slate-950/50 border-white/10 text-white font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setForm({ ...form, senha: generatePassword() })}
                  className="border-white/10 bg-slate-950/50 text-slate-200 hover:bg-slate-800"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Gerar
                </Button>
              </div>
              <p className="text-xs text-slate-400">
                Uma senha de acesso temporária para o usuário fazer login. Copie-a antes de salvar.
              </p>
            </div>
            <div className="md:col-span-2">
              <Button
                type="submit"
                disabled={saving}
                className="bg-gradient-to-r from-indigo-500 to-fuchsia-500 hover:opacity-90 text-white font-semibold"
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Cadastrar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-slate-900/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-white">Usuários cadastrados</CardTitle>
          <CardDescription>
            {alunos.length} {alunos.length === 1 ? "usuário" : "usuários"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : alunos.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              Nenhum usuário cadastrado ainda.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-slate-300">Nome</TableHead>
                    <TableHead className="text-slate-300">Tipo de Acesso</TableHead>
                    <TableHead className="text-slate-300">Turma</TableHead>
                    <TableHead className="text-slate-300">Mentor</TableHead>
                    <TableHead className="text-slate-300">Imersão</TableHead>
                    <TableHead className="text-slate-300">Email</TableHead>
                    <TableHead className="text-slate-300">Data de entrada</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alunos.map((c) => {
                    const email = c.usuarios?.email || "Sem e-mail";
                    const role = c.usuarios?.role === "mentor" ? "Mentor" : "Aluno";
                    return (
                      <TableRow key={c.id} className="border-white/10">
                        <TableCell className="font-medium text-white">{c.nome}</TableCell>
                        <TableCell className="text-slate-300">
                          <span className={cn(
                            "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                            c.usuarios?.role === "mentor"
                              ? "bg-purple-400/10 text-purple-400 ring-purple-400/20"
                              : "bg-blue-400/10 text-blue-400 ring-blue-400/20"
                          )}>
                            {role}
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-300">{c.turma}</TableCell>
                        <TableCell className="text-slate-300">{c.mentor_responsavel}</TableCell>
                        <TableCell className="text-slate-300">{c.imersao}</TableCell>
                        <TableCell className="text-slate-300">{email}</TableCell>
                        <TableCell className="text-slate-300">
                          {c.data_entrada
                            ? new Date(c.data_entrada + "T00:00:00").toLocaleDateString("pt-BR")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(c.id)}
                            className="text-slate-400 hover:bg-red-500/10 hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

