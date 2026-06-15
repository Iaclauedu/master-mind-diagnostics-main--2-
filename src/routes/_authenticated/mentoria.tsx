import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Loader2, Plus, Trash2, BookOpen, Layers } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/mentoria")({
  head: () => ({
    meta: [{ title: "Mentoria · Master Business" }],
  }),
  component: MentoriaPage,
});

type AlunoOption = {
  id: number;
  nome: string;
};

type SecaoMentoria = {
  id: number;
  aluno_id: number | null;
  nome_mentor: string;
  data_sessao: string;
  secao: number;
  plano_acao: string;
  tarefas: string;
  objetivos_secao: string;
};

const emptyForm = () => ({
  aluno_id: "",
  nome_mentor: "",
  data_sessao: "",
  secao: "",
  plano_acao: "",
  tarefas: "",
  objetivos_secao: "",
});

function MentoriaPage() {
  const [alunos, setAlunos] = useState<AlunoOption[]>([]);
  const [sessoes, setSessoes] = useState<SecaoMentoria[]>([]);
  const [loadingAlunos, setLoadingAlunos] = useState(true);
  const [loadingSessoes, setLoadingSessoes] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const fetchAlunos = async () => {
    setLoadingAlunos(true);
    const { data, error } = await supabase
      .from("alunos")
      .select("id, nome")
      .order("nome", { ascending: true });

    if (error) {
      toast.error("Erro ao carregar alunos", { description: error.message });
    } else {
      setAlunos(data ?? []);
    }
    setLoadingAlunos(false);
  };

  const fetchSessoes = async () => {
    setLoadingSessoes(true);
    const { data, error } = await supabase
      .from("secao_mentoria")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar sessões de mentoria", { description: error.message });
    } else {
      setSessoes(data ?? []);
    }
    setLoadingSessoes(false);
  };

  useEffect(() => {
    fetchAlunos();
    fetchSessoes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.aluno_id ||
      !form.nome_mentor ||
      !form.data_sessao ||
      !form.secao ||
      !form.plano_acao ||
      !form.tarefas ||
      !form.objetivos_secao
    ) {
      toast.error("Preencha todos os campos");
      return;
    }
    setSaving(true);

    try {
      const { error } = await supabase.from("secao_mentoria").insert({
        aluno_id: parseInt(form.aluno_id, 10),
        nome_mentor: form.nome_mentor,
        data_sessao: form.data_sessao,
        secao: parseInt(form.secao, 10),
        plano_acao: form.plano_acao,
        tarefas: form.tarefas,
        objetivos_secao: form.objetivos_secao,
      });

      if (error) throw error;

      toast.success("Sessão de mentoria cadastrada com sucesso!");
      setForm(emptyForm());
      fetchSessoes();
    } catch (err: any) {
      toast.error("Erro ao cadastrar mentoria", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from("secao_mentoria").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir mentoria", { description: error.message });
      return;
    }
    toast.success("Mentoria removida com sucesso!");
    fetchSessoes();
  };

  const getAlunoNome = (id: number | null) => {
    if (id === null) return "Não associado";
    const found = alunos.find((a) => a.id === id);
    return found ? found.nome : `Aluno #${id}`;
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 shadow-lg shadow-indigo-500/30">
          <BookOpen className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Sessões de Mentoria</h1>
          <p className="text-sm text-slate-400">Acompanhe e registre a evolução das sessões de mentoria individual</p>
        </div>
      </div>

      <Card className="border-white/10 bg-slate-900/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-white">Nova Sessão de Mentoria</CardTitle>
          <CardDescription>Preencha as informações do plano de ação, tarefas e objetivos da sessão.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-slate-200">Aluno</Label>
                <Select
                  value={form.aluno_id}
                  onValueChange={(val) => setForm({ ...form, aluno_id: val })}
                >
                  <SelectTrigger className="bg-slate-950/50 border-white/10 text-white">
                    <SelectValue placeholder="Selecione o aluno" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-slate-950 text-white">
                    {loadingAlunos ? (
                      <div className="p-2 text-xs text-slate-400">Carregando alunos...</div>
                    ) : alunos.length === 0 ? (
                      <div className="p-2 text-xs text-slate-400">Nenhum aluno cadastrado</div>
                    ) : (
                      alunos.map((a) => (
                        <SelectItem key={a.id} value={String(a.id)}>
                          {a.nome}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome_mentor" className="text-slate-200">Nome do Mentor</Label>
                <Input
                  id="nome_mentor"
                  value={form.nome_mentor}
                  onChange={(e) => setForm({ ...form, nome_mentor: e.target.value })}
                  placeholder="Ex: Mentor Carlos"
                  className="bg-slate-950/50 border-white/10 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_sessao" className="text-slate-200">Data da Sessão</Label>
                <Input
                  id="data_sessao"
                  type="date"
                  value={form.data_sessao}
                  onChange={(e) => setForm({ ...form, data_sessao: e.target.value })}
                  className="bg-slate-950/50 border-white/10 text-white [color-scheme:dark]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="secao" className="text-slate-200">Seção / Encontro Nº</Label>
                <Input
                  id="secao"
                  type="number"
                  min="1"
                  value={form.secao}
                  onChange={(e) => setForm({ ...form, secao: e.target.value })}
                  placeholder="Ex: 1"
                  className="bg-slate-950/50 border-white/10 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="objetivos_secao" className="text-slate-200">Objetivos da Seção</Label>
              <Textarea
                id="objetivos_secao"
                value={form.objetivos_secao}
                onChange={(e) => setForm({ ...form, objetivos_secao: e.target.value })}
                placeholder="Qual o foco do encontro de hoje..."
                rows={2}
                className="bg-slate-950/50 border-white/10 text-white min-h-[60px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plano_acao" className="text-slate-200">Plano de Ação</Label>
              <Textarea
                id="plano_acao"
                value={form.plano_acao}
                onChange={(e) => setForm({ ...form, plano_acao: e.target.value })}
                placeholder="Estratégia acordada para implementação..."
                rows={2}
                className="bg-slate-950/50 border-white/10 text-white min-h-[60px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tarefas" className="text-slate-200">Tarefas do Aluno</Label>
              <Textarea
                id="tarefas"
                value={form.tarefas}
                onChange={(e) => setForm({ ...form, tarefas: e.target.value })}
                placeholder="Próximos passos e entregas acordadas..."
                rows={2}
                className="bg-slate-950/50 border-white/10 text-white min-h-[60px]"
              />
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="w-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white shadow-lg hover:from-indigo-400 hover:to-fuchsia-400 md:w-auto"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" /> Registrar Sessão
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-slate-900/50 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-white">Mentoria Registrada</CardTitle>
            <CardDescription>Acompanhamento histórico de todos os encontros e metas.</CardDescription>
          </div>
          <Layers className="h-5 w-5 text-slate-400" />
        </CardHeader>
        <CardContent>
          {loadingSessoes ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : sessoes.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">Nenhuma sessão registrada ainda.</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/5">
              <Table>
                <TableHeader className="bg-white/[0.02] border-white/10">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-slate-300 font-semibold">Aluno</TableHead>
                    <TableHead className="text-slate-300 font-semibold">Mentor</TableHead>
                    <TableHead className="text-slate-300 font-semibold">Data</TableHead>
                    <TableHead className="text-slate-300 font-semibold text-center">Encontro Nº</TableHead>
                    <TableHead className="text-slate-300 font-semibold">Objetivos</TableHead>
                    <TableHead className="text-slate-300 font-semibold">Plano de Ação</TableHead>
                    <TableHead className="text-slate-300 font-semibold">Tarefas</TableHead>
                    <TableHead className="w-[80px] text-slate-300 font-semibold text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessoes.map((s) => (
                    <TableRow key={s.id} className="border-white/5 hover:bg-white/[0.02]">
                      <TableCell className="font-medium text-white">{getAlunoNome(s.aluno_id)}</TableCell>
                      <TableCell className="text-slate-200">{s.nome_mentor}</TableCell>
                      <TableCell className="text-slate-300">
                        {s.data_sessao ? new Date(s.data_sessao + "T00:00:00").toLocaleDateString("pt-BR") : "-"}
                      </TableCell>
                      <TableCell className="text-slate-300 text-center font-bold">{s.secao}</TableCell>
                      <TableCell className="text-slate-300 max-w-[200px] truncate" title={s.objetivos_secao}>
                        {s.objetivos_secao}
                      </TableCell>
                      <TableCell className="text-slate-300 max-w-[200px] truncate" title={s.plano_acao}>
                        {s.plano_acao}
                      </TableCell>
                      <TableCell className="text-slate-300 max-w-[200px] truncate" title={s.tarefas}>
                        {s.tarefas}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(s.id)}
                          className="h-8 w-8 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
