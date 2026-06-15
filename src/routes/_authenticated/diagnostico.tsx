import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import {
  AREAS,
  ESCALA,
  FASES,
  calcularScoreFinal,
  calcularAreaPercentual,
  classificarFase,
  type Respostas,
} from "@/lib/diagnostico";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Target,
  TrendingUp,
  RotateCcw,
  Trophy,
  AlertTriangle,
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/diagnostico")({
  head: () => ({
    meta: [{ title: "Diagnóstico · Master Business" }],
  }),
  component: Diagnostico,
});

type Step = "intro" | "quiz" | "resultado";

function Diagnostico() {
  const [step, setStep] = useState<Step>("intro");
  const [areaIdx, setAreaIdx] = useState(0);
  const [respostas, setRespostas] = useState<Respostas>({});
  const [lastDiagnosticoDate, setLastDiagnosticoDate] = useState<string | null>(null);
  const [checkingDiagnostico, setCheckingDiagnostico] = useState(true);

  // Load initial answers and step from localStorage safely on client side
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedRespostas = localStorage.getItem("mb_diagnostico_respostas");
        if (savedRespostas) {
          setRespostas(JSON.parse(savedRespostas));
        }
        const savedStep = localStorage.getItem("mb_diagnostico_step");
        if (savedStep) {
          setStep(savedStep as Step);
        }
      } catch (e) {
        console.error("Error loading mock client cache:", e);
      }
    }
  }, []);

  // Verificar o último diagnóstico completo salvo no Supabase
  useEffect(() => {
    const checkLastDiagnostico = async () => {
      try {
        setCheckingDiagnostico(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setCheckingDiagnostico(false);
          return;
        }

        const { data, error } = await supabase
          .from("dash")
          .select("data_aplicacao")
          .eq("usuario_id", user.id)
          .eq("status", "completo")
          .order("data_aplicacao", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("Erro ao verificar diagnóstico anterior:", error);
        } else if (data && data.data_aplicacao) {
          setLastDiagnosticoDate(data.data_aplicacao);
        }
      } catch (err) {
        console.error("Exceção ao verificar último diagnóstico:", err);
      } finally {
        setCheckingDiagnostico(false);
      }
    };

    checkLastDiagnostico();
  }, [step]);

  const restriction = useMemo(() => {
    if (!lastDiagnosticoDate) return { isRestricted: false, libDateStr: "" };

    const parts = lastDiagnosticoDate.split("-");
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    
    const appDate = new Date(year, month, day);
    
    // Adiciona 90 dias
    const libDate = new Date(appDate.getTime());
    libDate.setDate(appDate.getDate() + 90);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    libDate.setHours(0, 0, 0, 0);

    const isRestricted = today < libDate;

    const libDay = String(libDate.getDate()).padStart(2, "0");
    const libMonth = String(libDate.getMonth() + 1).padStart(2, "0");
    const libYear = libDate.getFullYear();
    const libDateStr = `${libDay}/${libMonth}/${libYear}`;

    return { isRestricted, libDateStr };
  }, [lastDiagnosticoDate]);

  // Save answers whenever they change
  useEffect(() => {
    if (typeof window !== "undefined" && Object.keys(respostas).length > 0) {
      localStorage.setItem("mb_diagnostico_respostas", JSON.stringify(respostas));
    }
  }, [respostas]);

  // Save step whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("mb_diagnostico_step", step);
    }
  }, [step]);

  const areaAtual = AREAS[areaIdx];
  const respostasArea = respostas[areaAtual?.id] || [];
  const areaCompleta =
    respostasArea.length === areaAtual?.questoes.length && respostasArea.every((r) => r > 0);

  const totalPerguntas = AREAS.reduce((acc, a) => acc + a.questoes.length, 0);
  const respondidas = Object.values(respostas).reduce(
    (acc, arr) => acc + arr.filter((r) => r > 0).length,
    0,
  );
  const progresso = (respondidas / totalPerguntas) * 100;

  const setResposta = (qIdx: number, valor: number) => {
    setRespostas((prev) => {
      const atual = [...(prev[areaAtual.id] || [])];
      atual[qIdx] = valor;
      return { ...prev, [areaAtual.id]: atual };
    });
  };

  const salvarNoBanco = async (respostasFinais: Respostas) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return; // Se não estiver logado, apenas mantém localStorage

      const { scoreFinal } = calcularScoreFinal(respostasFinais);
      const faseKey = classificarFase(scoreFinal);
      const fase = FASES[faseKey];

      const { error } = await supabase.from("dash").insert({
        usuario_id: user.id,
        nota_identidade_posicionamento: Math.round(calcularAreaPercentual(respostasFinais["identidade"] || [])),
        nota_metodo_transformacao: Math.round(calcularAreaPercentual(respostasFinais["metodo"] || [])),
        nota_produto_soleira: Math.round(calcularAreaPercentual(respostasFinais["produto"] || [])),
        nota_autoridade_conteudo: Math.round(calcularAreaPercentual(respostasFinais["autoridade"] || [])),
        nota_vendas_conversao: Math.round(calcularAreaPercentual(respostasFinais["vendas"] || [])),
        nota_experiencia_cliente: Math.round(calcularAreaPercentual(respostasFinais["experiencia"] || [])),
        nota_operacao_equipe: Math.round(calcularAreaPercentual(respostasFinais["operacao"] || [])),
        nota_recursos_indicadores: Math.round(calcularAreaPercentual(respostasFinais["escala"] || [])),
        score_final: Math.round(scoreFinal),
        identidade_atual: fase.identidade,
        data_aplicacao: new Date().toISOString().split("T")[0],
        status: "completo",
      });

      if (error) {
        console.error("[Diagnóstico] Erro ao salvar no banco:", error.message);
        toast.error("Diagnóstico salvo localmente (erro ao sincronizar com o servidor)");
      } else {
        toast.success("Diagnóstico salvo com sucesso!");
      }
    } catch (err) {
      console.error("[Diagnóstico] Exceção ao salvar:", err);
    }
  };

  const proximaArea = () => {
    if (areaIdx < AREAS.length - 1) {
      setAreaIdx(areaIdx + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // Finaliza: salva no banco e exibe resultado
      salvarNoBanco(respostas);
      setStep("resultado");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const areaAnterior = () => {
    if (areaIdx > 0) {
      setAreaIdx(areaIdx - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const reiniciar = () => {
    setRespostas({});
    setAreaIdx(0);
    setStep("intro");
    if (typeof window !== "undefined") {
      localStorage.removeItem("mb_diagnostico_respostas");
      localStorage.removeItem("mb_diagnostico_step");
    }
  };

  return (
    <div className="relative mx-auto max-w-4xl px-4 py-10 md:px-8 md:py-14">
      {step === "intro" && (
        <Intro 
          onStart={() => setStep("quiz")} 
          restriction={restriction}
          loading={checkingDiagnostico}
        />
      )}

      {step === "quiz" && (
        <Quiz
          areaIdx={areaIdx}
          areaAtual={areaAtual}
          respostasArea={respostasArea}
          setResposta={setResposta}
          progresso={progresso}
          respondidas={respondidas}
          totalPerguntas={totalPerguntas}
          areaCompleta={areaCompleta}
          proximaArea={proximaArea}
          areaAnterior={areaAnterior}
          onSelecionarArea={setAreaIdx}
          respostas={respostas}
        />
      )}

      {step === "resultado" && (
        <Resultado 
          respostas={respostas} 
          onReiniciar={reiniciar} 
          restriction={restriction}
        />
      )}
    </div>
  );
}

function Intro({ 
  onStart,
  restriction,
  loading
}: { 
  onStart: () => void;
  restriction: { isRestricted: boolean; libDateStr: string };
  loading: boolean;
}) {
  return (
    <div className="space-y-10">
      <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-indigo-200">
        <Sparkles className="h-3.5 w-3.5" /> Diagnóstico de Entrada
      </div>

      <div className="space-y-5">
        <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
          Descubra em que{" "}
          <span className="bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
            fase
          </span>{" "}
          está o seu negócio de educação
        </h1>
        <p className="max-w-2xl text-lg text-slate-300">
          Em poucos minutos, avalie 8 áreas estratégicas do seu negócio e receba um relatório
          completo com sua fase atual, suas maiores forças, desafios e os próximos passos para se
          tornar um <strong className="text-white">Master Business</strong>.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { icon: Target, titulo: "48 perguntas", desc: "Escala intuitiva de 1 a 5" },
          {
            icon: TrendingUp,
            titulo: "8 áreas estratégicas",
            desc: "Cálculo com pesos ponderados",
          },
          { icon: Trophy, titulo: "5 fases de maturidade", desc: "Do Foundation ao Scale" },
        ].map((item) => (
          <div
            key={item.titulo}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
          >
            <item.icon className="mb-3 h-6 w-6 text-indigo-300" />
            <div className="font-semibold">{item.titulo}</div>
            <div className="text-sm text-slate-400">{item.desc}</div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            size="lg"
            onClick={onStart}
            disabled={loading || restriction.isRestricted}
            className="h-12 bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-8 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 hover:from-indigo-400 hover:to-fuchsia-400 disabled:opacity-40"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
              </span>
            ) : restriction.isRestricted ? (
              "Diagnóstico Indisponível"
            ) : (
              <>Começar diagnóstico <ArrowRight className="ml-1 h-4 w-4" /></>
            )}
          </Button>
          {!loading && !restriction.isRestricted && (
            <span className="text-sm text-slate-400">Leva cerca de 7 minutos</span>
          )}
        </div>

        {restriction.isRestricted && (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-500/5 p-5 text-sm text-amber-200 flex items-start gap-3 max-w-2xl">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
            <div className="space-y-1">
              <p className="font-semibold text-white">Diagnóstico já realizado recentemente</p>
              <p className="text-slate-300">
                Você já realizou o diagnóstico. Para acompanhar sua evolução com precisão e tempo de maturidade,
                um novo diagnóstico só é liberado a cada 90 dias após a conclusão anterior.
              </p>
              <p className="mt-2 text-amber-300 font-medium">
                Próxima liberação: {restriction.libDateStr}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Quiz({
  areaIdx,
  areaAtual,
  respostasArea,
  setResposta,
  progresso,
  respondidas,
  totalPerguntas,
  areaCompleta,
  proximaArea,
  areaAnterior,
  onSelecionarArea,
  respostas,
}: {
  areaIdx: number;
  areaAtual: (typeof AREAS)[number];
  respostasArea: number[];
  setResposta: (qIdx: number, valor: number) => void;
  progresso: number;
  respondidas: number;
  totalPerguntas: number;
  areaCompleta: boolean;
  proximaArea: () => void;
  areaAnterior: () => void;
  onSelecionarArea: (idx: number) => void;
  respostas: Respostas;
}) {
  return (
    <div className="space-y-8">
      {/* Progress header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-300">
            Área {areaIdx + 1} de {AREAS.length}
          </span>
          <span className="text-slate-400">
            {respondidas} / {totalPerguntas} respostas · {Math.round(progresso)}%
          </span>
        </div>
        <Progress
          value={progresso}
          className="h-2 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-indigo-400 [&>div]:to-fuchsia-400"
        />
        <div className="flex flex-wrap gap-1.5 pt-1">
          {AREAS.map((a, i) => {
            const isMe = i === areaIdx;
            const answers = respostas[a.id] || [];
            const isCompleta = answers.length === a.questoes.length && answers.every((r) => r > 0);
            const clickable = i < areaIdx || isCompleta;

            return (
              <button
                key={a.id}
                type="button"
                onClick={() => clickable && onSelecionarArea(i)}
                disabled={!clickable && !isMe}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-all duration-200 focus:outline-none",
                  isMe
                    ? "bg-fuchsia-400"
                    : clickable
                      ? "bg-indigo-400 hover:bg-indigo-300 hover:h-2 cursor-pointer shadow-[0_0_8px_rgba(129,140,248,0.3)]"
                      : "bg-white/10 cursor-not-allowed",
                )}
                title={
                  isMe
                    ? `Área atual: ${a.nome}`
                    : clickable
                      ? `Ir para: ${a.nome} (Liberada)`
                      : `${a.nome} (Ainda bloqueada)`
                }
              />
            );
          })}
        </div>
      </div>

      {/* Area header */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm md:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-slate-400">
            {areaAtual.questoes.length} perguntas nesta área
          </span>
        </div>
        <h2 className="mt-3 text-2xl font-bold md:text-3xl">{areaAtual.nome}</h2>
        <p className="mt-2 text-sm text-slate-400">
          Marque a opção que melhor representa sua realidade atual. Seja honesto — o diagnóstico só
          é útil quando reflete a verdade.
        </p>
      </div>

      {/* Questions */}
      <div className="space-y-5">
        {areaAtual.questoes.map((q, qIdx) => (
          <div
            key={qIdx}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm md:p-6"
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  respostasArea[qIdx]
                    ? "bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white"
                    : "bg-white/10 text-slate-300",
                )}
              >
                {respostasArea[qIdx] ? <CheckCircle2 className="h-4 w-4" /> : qIdx + 1}
              </div>
              <p className="text-base leading-relaxed text-slate-100 md:text-[17px]">{q}</p>
            </div>

            <div className="mt-5 grid grid-cols-5 gap-2">
              {ESCALA.map((opt) => {
                const ativo = respostasArea[qIdx] === opt.valor;
                return (
                  <button
                    key={opt.valor}
                    type="button"
                    onClick={() => setResposta(qIdx, opt.valor)}
                    className={cn(
                      "group relative flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center transition-all",
                      ativo
                        ? "border-transparent bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-lg shadow-indigo-500/30"
                        : "border-white/10 bg-white/[0.02] text-slate-300 hover:border-indigo-300/40 hover:bg-white/[0.06]",
                    )}
                    title={`${opt.label} — ${opt.desc}`}
                  >
                    <span className="text-xl font-bold">{opt.valor}</span>
                    <span className="hidden text-[10px] font-medium leading-tight md:block">
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-2 hidden justify-between text-[10px] uppercase tracking-wider text-slate-500 md:flex">
              <span>Discordo totalmente</span>
              <span>Concordo totalmente</span>
            </div>
          </div>
        ))}
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <Button
          variant="ghost"
          onClick={areaAnterior}
          disabled={areaIdx === 0}
          className="text-slate-300 hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Anterior
        </Button>
        <Button
          onClick={proximaArea}
          disabled={!areaCompleta}
          className="h-11 bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-6 text-white shadow-lg shadow-indigo-500/30 hover:from-indigo-400 hover:to-fuchsia-400 disabled:opacity-40"
        >
          {areaIdx === AREAS.length - 1 ? "Ver meu resultado" : "Próxima área"}
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function Resultado({ 
  respostas, 
  onReiniciar,
  restriction
}: { 
  respostas: Respostas; 
  onReiniciar: () => void;
  restriction: { isRestricted: boolean; libDateStr: string };
}) {
  const { scoreFinal, areas } = useMemo(() => calcularScoreFinal(respostas), [respostas]);
  const faseKey = classificarFase(scoreFinal);
  const fase = FASES[faseKey];

  const ordenadas = [...areas].sort((a, b) => b.percentual - a.percentual);
  const forcas = ordenadas.slice(0, 2);
  const desafios = [...ordenadas].reverse().slice(0, 2);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.02] p-8 backdrop-blur-sm md:p-12">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
          <Trophy className="h-4 w-4" style={{ color: fase.cor }} /> Sua fase atual
        </div>
        <h2
          className="mt-3 text-5xl font-bold tracking-tight md:text-7xl"
          style={{ color: fase.cor }}
        >
          {fase.nome}
        </h2>
        <p className="mt-2 text-lg font-medium text-slate-200">{fase.identidade}</p>
        <p className="mt-4 max-w-2xl text-slate-300">{fase.descricao}</p>

        <div className="mt-8 flex flex-wrap items-end gap-6">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400">Score final</div>
            <div className="mt-1 text-6xl font-bold tabular-nums">
              {scoreFinal.toFixed(1)}
              <span className="text-2xl text-slate-400">%</span>
            </div>
          </div>
          <div className="flex-1 min-w-[200px]">
            <FaseScale score={scoreFinal} />
          </div>
        </div>
      </div>

      {/* Áreas */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm md:p-8">
        <h3 className="text-xl font-bold">Desempenho por área estratégica</h3>
        <p className="mt-1 text-sm text-slate-400">
          Cada área contribui para o score final de acordo com seu peso.
        </p>

        <div className="mt-6 space-y-4">
          {areas.map(({ area, percentual, contribuicao }) => (
            <div key={area.id}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  {area.nome} <span className="text-xs text-slate-500">· peso {area.peso}%</span>
                </span>
                <span className="tabular-nums text-slate-300">
                  {percentual.toFixed(0)}%{" "}
                  <span className="text-slate-500">(+{contribuicao.toFixed(1)})</span>
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${percentual}%`,
                    backgroundColor: area.cor,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Forças / Desafios */}
      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/5 p-6 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-emerald-300">
            <CheckCircle2 className="h-5 w-5" />
            <h3 className="text-lg font-bold">Suas maiores forças</h3>
          </div>
          <p className="mt-1 text-sm text-emerald-200/70">
            Continue investindo — são seus diferenciais.
          </p>
          <ul className="mt-4 space-y-3">
            {forcas.map(({ area, percentual }) => (
              <li key={area.id} className="flex items-center justify-between">
                <span>{area.nome}</span>
                <span className="font-bold tabular-nums">{percentual.toFixed(0)}%</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-amber-400/20 bg-amber-500/5 p-6 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-amber-300">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="text-lg font-bold">Seus maiores desafios</h3>
          </div>
          <p className="mt-1 text-sm text-amber-200/70">
            Evoluir essas áreas fará grande diferença.
          </p>
          <ul className="mt-4 space-y-3">
            {desafios.map(({ area, percentual }) => (
              <li key={area.id} className="flex items-center justify-between">
                <span>{area.nome}</span>
                <span className="font-bold tabular-nums">{percentual.toFixed(0)}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Próximos 90 dias */}
      <div className="rounded-3xl border border-indigo-400/20 bg-indigo-500/5 p-6 backdrop-blur-sm md:p-8">
        <div className="flex items-center gap-2 text-indigo-200">
          <Target className="h-5 w-5" />
          <h3 className="text-lg font-bold">O que fazer nos próximos 90 dias</h3>
        </div>
        <p className="mt-3 text-slate-200">
          Foque toda sua energia em <strong className="text-white">{desafios[0]?.area.nome}</strong>
          . Essa é a alavanca de maior impacto para o seu negócio sair da fase {fase.nome} e avançar
          para o próximo nível.
        </p>
        <p className="mt-2 text-sm text-slate-400">
          Use suas forças em <strong>{forcas[0]?.area.nome}</strong> como ponto de apoio para
          construir essa evolução.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3 pt-2">
        <Button
          variant="outline"
          onClick={onReiniciar}
          disabled={restriction.isRestricted}
          className="border-white/20 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white disabled:opacity-40"
        >
          <RotateCcw className="mr-2 h-4 w-4" /> Refazer diagnóstico
        </Button>
        {restriction.isRestricted && (
          <p className="text-sm text-amber-300 font-medium">
            Um novo diagnóstico estará disponível em: {restriction.libDateStr} (limite de 90 dias)
          </p>
        )}
      </div>
    </div>
  );
}

function FaseScale({ score }: { score: number }) {
  const fases = Object.values(FASES);
  return (
    <div>
      <div className="relative h-3 overflow-hidden rounded-full bg-white/5">
        <div className="absolute inset-0 flex">
          {fases.map((f) => (
            <div key={f.nome} className="flex-1" style={{ backgroundColor: `${f.cor}30` }} />
          ))}
        </div>
        <div
          className="absolute top-0 h-full w-1 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]"
          style={{ left: `calc(${Math.min(score, 100)}% - 2px)` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wider text-slate-500">
        {fases.map((f) => (
          <span key={f.nome}>{f.nome}</span>
        ))}
      </div>
    </div>
  );
}
