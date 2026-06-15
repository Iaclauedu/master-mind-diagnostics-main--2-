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
import { Loader2, Plus, Trash2, Calendar as CalendarIcon, ClipboardList } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/cadastro-eventos")({
  head: () => ({
    meta: [{ title: "Cadastro Eventos · Master Business" }],
  }),
  component: CadastroEventosPage,
});

type AlunoOption = {
  id: number;
  nome: string;
};

type Evento = {
  id: number;
  nome_evento: string;
  data_evento: string;
  presenca: string;
  participacao: string;
  tarefas_realizadas: string;
  feed_solicitacoes: string;
  aluno_id: number | null;
};

const emptyForm = () => ({
  aluno_id: "",
  nome_evento: "",
  data_evento: "",
  presenca: "",
  participacao: "",
  tarefas_realizadas: "",
  feed_solicitacoes: "",
});

function CadastroEventosPage() {
  const [alunos, setAlunos] = useState<AlunoOption[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loadingAlunos, setLoadingAlunos] = useState(true);
  const [loadingEventos, setLoadingEventos] = useState(true);
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

  const fetchEventos = async () => {
    setLoadingEventos(true);
    const { data, error } = await supabase
      .from("evento")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar eventos", { description: error.message });
    } else {
      setEventos(data ?? []);
    }
    setLoadingEventos(false);
  };

  useEffect(() => {
    fetchAlunos();
    fetchEventos();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.aluno_id ||
      !form.nome_evento ||
      !form.data_evento ||
      !form.presenca ||
      !form.participacao ||
      !form.tarefas_realizadas ||
      !form.feed_solicitacoes
    ) {
      toast.error("Preencha todos os campos");
      return;
    }
    setSaving(true);

    try {
      const { error } = await supabase.from("evento").insert({
        aluno_id: parseInt(form.aluno_id, 10),
        nome_evento: form.nome_evento,
        data_evento: form.data_evento,
        presenca: form.presenca,
        participacao: form.participacao,
        tarefas_realizadas: form.tarefas_realizadas,
        feed_solicitacoes: form.feed_solicitacoes,
      });

      if (error) throw error;

      toast.success("Evento cadastrado com sucesso!");
      setForm(emptyForm());
      fetchEventos();
    } catch (err: any) {
      toast.error("Erro ao cadastrar evento", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from("evento").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir evento", { description: error.message });
      return;
    }
    toast.success("Evento removido com sucesso!");
    fetchEventos();
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
          <CalendarIcon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Cadastro Eventos</h1>
          <p className="text-sm text-slate-400">Registre e gerencie a participação em eventos por aluno</p>
        </div>
      </div>

      <Card className="border-white/10 bg-slate-900/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-white">Novo Evento</CardTitle>
          <CardDescription>Insira os detalhes do evento e selecione o aluno correspondente.</CardDescription>
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
                <Label htmlFor="nome_evento" className="text-slate-200">Nome do Evento</Label>
                <Input
                  id="nome_evento"
                  value={form.nome_evento}
                  onChange={(e) => setForm({ ...form, nome_evento: e.target.value })}
                  placeholder="Ex: Summit 2026"
                  className="bg-slate-950/50 border-white/10 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_evento" className="text-slate-200">Data do Evento</Label>
                <Input
                  id="data_evento"
                  type="date"
                  value={form.data_evento}
                  onChange={(e) => setForm({ ...form, data_evento: e.target.value })}
                  className="bg-slate-950/50 border-white/10 text-white [color-scheme:dark]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="presenca" className="text-slate-200">Presença</Label>
                <Input
                  id="presenca"
                  value={form.presenca}
                  onChange={(e) => setForm({ ...form, presenca: e.target.value })}
                  placeholder="Ex: Confirmado, Presente, Ausente"
                  className="bg-slate-950/50 border-white/10 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="participacao" className="text-slate-200">Participação</Label>
              <Textarea
                id="participacao"
                value={form.participacao}
                onChange={(e) => setForm({ ...form, participacao: e.target.value })}
                placeholder="Descreva o papel ou envolvimento do aluno..."
                rows={2}
                className="bg-slate-950/50 border-white/10 text-white min-h-[60px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tarefas_realizadas" className="text-slate-200">Tarefas Realizadas</Label>
              <Textarea
                id="tarefas_realizadas"
                value={form.tarefas_realizadas}
                onChange={(e) => setForm({ ...form, tarefas_realizadas: e.target.value })}
                placeholder="Quais foram as entregas ou conquistas nesta data..."
                rows={2}
                className="bg-slate-950/50 border-white/10 text-white min-h-[60px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="feed_solicitacoes" className="text-slate-200">Feedback / Solicitações</Label>
              <Textarea
                id="feed_solicitacoes"
                value={form.feed_solicitacoes}
                onChange={(e) => setForm({ ...form, feed_solicitacoes: e.target.value })}
                placeholder="Insira as observações finais ou solicitações de follow-up..."
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
                  <Plus className="mr-2 h-4 w-4" /> Cadastrar Evento
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-slate-900/50 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-white">Eventos Cadastrados</CardTitle>
            <CardDescription>Histórico de participações em eventos registrados no sistema.</CardDescription>
          </div>
          <ClipboardList className="h-5 w-5 text-slate-400" />
        </CardHeader>
        <CardContent>
          {loadingEventos ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : eventos.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">Nenhum evento registrado ainda.</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/5">
              <Table>
                <TableHeader className="bg-white/[0.02] border-white/10">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-slate-300 font-semibold">Aluno</TableHead>
                    <TableHead className="text-slate-300 font-semibold">Evento</TableHead>
                    <TableHead className="text-slate-300 font-semibold">Data</TableHead>
                    <TableHead className="text-slate-300 font-semibold">Presença</TableHead>
                    <TableHead className="text-slate-300 font-semibold">Participação</TableHead>
                    <TableHead className="text-slate-300 font-semibold">Tarefas</TableHead>
                    <TableHead className="text-slate-300 font-semibold">Feed/Solicitações</TableHead>
                    <TableHead className="w-[80px] text-slate-300 font-semibold text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eventos.map((e) => (
                    <TableRow key={e.id} className="border-white/5 hover:bg-white/[0.02]">
                      <TableCell className="font-medium text-white">{getAlunoNome(e.aluno_id)}</TableCell>
                      <TableCell className="text-slate-200">{e.nome_evento}</TableCell>
                      <TableCell className="text-slate-300">
                        {e.data_evento ? new Date(e.data_evento + "T00:00:00").toLocaleDateString("pt-BR") : "-"}
                      </TableCell>
                      <TableCell className="text-slate-300">{e.presenca}</TableCell>
                      <TableCell className="text-slate-300 max-w-[200px] truncate" title={e.participacao}>
                        {e.participacao}
                      </TableCell>
                      <TableCell className="text-slate-300 max-w-[200px] truncate" title={e.tarefas_realizadas}>
                        {e.tarefas_realizadas}
                      </TableCell>
                      <TableCell className="text-slate-300 max-w-[200px] truncate" title={e.feed_solicitacoes}>
                        {e.feed_solicitacoes}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(e.id)}
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
