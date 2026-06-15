import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  AREAS,
  FASES,
  calcularScoreFinal,
  classificarFase,
  type Respostas,
} from "@/lib/diagnostico";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Trophy,
  Target,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Award,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [{ title: "Dashboard · Master Business" }],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [userName, setUserName] = useState<string>("");
  const [respostas, setRespostas] = useState<Respostas | null>(null);
  const [lastDiagnosticoDate, setLastDiagnosticoDate] = useState<string | null>(null);
  const [loadingDash, setLoadingDash] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (user) {
        setUserName(user.user_metadata?.name || user.email?.split("@")[0] || "Líder");

        // Busca o último diagnóstico salvo no banco para este usuário
        const { data: dashData } = await supabase
          .from("dash")
          .select("*")
          .eq("usuario_id", user.id)
          .eq("status", "completo")
          .order("data_aplicacao", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (dashData) {
          if (dashData.data_aplicacao) {
            setLastDiagnosticoDate(dashData.data_aplicacao);
          }
          // Reconstrói o objeto respostas a partir das notas armazenadas no banco
          // Convertemos a nota (0-100%) de volta para um array de respostas simuladas
          const converterNota = (nota: number): number[] => {
            // A nota é 0-100%, cada área tem 6 perguntas, máximo = 30 pontos
            const pontos = Math.round((nota / 100) * 30);
            const porPergunta = Math.round(pontos / 6);
            const clamped = Math.max(1, Math.min(5, porPergunta));
            return Array(6).fill(clamped);
          };

          const respostasReconstruidas: Respostas = {
            identidade: converterNota(dashData.nota_identidade_posicionamento),
            metodo: converterNota(dashData.nota_metodo_transformacao),
            produto: converterNota(dashData.nota_produto_soleira),
            autoridade: converterNota(dashData.nota_autoridade_conteudo),
            vendas: converterNota(dashData.nota_vendas_conversao),
            experiencia: converterNota(dashData.nota_experiencia_cliente),
            operacao: converterNota(dashData.nota_operacao_equipe),
            escala: converterNota(dashData.nota_recursos_indicadores),
          };
          setRespostas(respostasReconstruidas);
        } else {
          // Se não houver dados no banco, mantém a tela no formato original (onboarding)
          setRespostas(null);
          setLastDiagnosticoDate(null);
        }
      }
      setLoadingDash(false);
    };
    init();
  }, []);

  const scoreData = useMemo(() => {
    if (!respostas || Object.keys(respostas).length === 0) return null;
    return calcularScoreFinal(respostas);
  }, [respostas]);

  const faseVal = useMemo(() => {
    if (!scoreData) return null;
    const faseKey = classificarFase(scoreData.scoreFinal);
    return FASES[faseKey];
  }, [scoreData]);

  const forcasEDesafios = useMemo(() => {
    if (!scoreData) return null;
    const ordenadas = [...scoreData.areas].sort((a, b) => b.percentual - a.percentual);
    return {
      melhor: ordenadas[0],
      desafio: [...ordenadas].reverse()[0],
    };
  }, [scoreData]);

  const restriction = useMemo(() => {
    if (!lastDiagnosticoDate) return { isRestricted: false, libDateStr: "" };

    const parts = lastDiagnosticoDate.split("-");
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    
    const appDate = new Date(year, month, day);
    
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

  const [greeting, setGreeting] = useState("Olá");
  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite");
  }, []);

  if (loadingDash) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="text-sm text-slate-400">Carregando seu diagnóstico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8 md:py-12 space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            {greeting}, {userName}! 👋
          </h1>
          <p className="mt-1 text-slate-400 text-sm">
            Bem-vindo ao cockpit de diagnóstico empresarial Master Business.
          </p>
        </div>
        {scoreData && (
          <div className="flex flex-col items-end gap-1.5 sm:items-start md:items-end">
            {restriction.isRestricted ? (
              <>
                <Button
                  disabled
                  variant="outline"
                  className="border-white/10 bg-white/5 text-slate-500 cursor-not-allowed opacity-40"
                  title={`Um novo diagnóstico estará disponível em ${restriction.libDateStr}`}
                >
                  <RefreshCw className="mr-2 h-4 w-4" /> Refazer Diagnóstico
                </Button>
                <span className="text-[11px] text-amber-300 font-medium">
                  Liberado em: {restriction.libDateStr}
                </span>
              </>
            ) : (
              <Link to="/diagnostico">
                <Button variant="outline" className="border-white/10 bg-white/5 text-slate-300 hover:bg-white/10">
                  <RefreshCw className="mr-2 h-4 w-4" /> Refazer Diagnóstico
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>

      {!scoreData ? (
        /* ONBOARDING STATE: No completed diagnostic */
        <div className="space-y-8 animate-fade-in">
          {/* Main Hero Promo Card */}
          <div className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-indigo-950/20 p-8 md:p-12">
            <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl" />
            
            <div className="relative max-w-2xl space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-indigo-300">
                <Sparkles className="h-3.5 w-3.5" /> Diagnóstico de Maturidade Empresarial
              </div>
              
              <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl leading-tight">
                Descubra a fase de maturidade do seu negócio
              </h2>
              
              <p className="text-base text-slate-300 leading-relaxed">
                Avalie pilares indispensáveis de crescimento empresarial em 8 áreas críticas do seu negócio. 
                Obtenha o score final, identifique seus gargalos de eficiência instantaneamente e receba recomendações customizadas.
              </p>

              <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center">
                <Link to="/diagnostico">
                  <Button size="lg" className="h-12 bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-8 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 hover:from-indigo-400 hover:to-fuchsia-400">
                    Iniciar Diagnóstico <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
                <span className="text-xs text-slate-500">
                  Leva cerca de 7 minutos para responder.
                </span>
              </div>
            </div>
          </div>

          {/* The 8 Dimensions Quick List */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">Os 8 Pilares Estratégicos</h3>
            <p className="text-sm text-slate-400">Conheça as dimensões avaliadas em nosso modelo analítico:</p>
            
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {AREAS.map((a) => (
                <div key={a.id} className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-all">
                  <div className="inline-flex h-2.5 w-2.5 rounded-full mb-3" style={{ backgroundColor: a.cor }} />
                  <h4 className="font-semibold text-white text-sm">{a.nome}</h4>
                  <p className="text-xs text-slate-500 mt-1">Peso ponderado de {a.peso}% do score final.</p>
                </div>
              ))}
            </div>
          </div>

          {/* Roadmap of Maturity Phases */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-6">
            <h3 className="text-lg font-bold text-white">Níveis de Classificação Geral</h3>
            <div className="divide-y divide-white/10">
              {Object.entries(FASES).map(([key, f]) => (
                <div key={key} className="flex flex-col md:flex-row md:items-center gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3 md:w-48 shrink-0">
                    <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: f.cor }} />
                    <span className="text-sm font-semibold tracking-wider text-slate-200" style={{ color: f.cor }}>{f.nome}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-white">{f.identidade}</div>
                    <p className="text-xs text-slate-400 mt-0.5">{f.descricao}</p>
                  </div>
                  <div className="text-xs text-slate-500 tabular-nums">Score: {f.min}% a {f.max}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* COMPLETED STATE: Display diagnostic metrics */
        <div className="space-y-8 animate-fade-in">
          {restriction.isRestricted && (
            <div className="rounded-2xl border border-amber-400/20 bg-amber-500/5 p-5 text-sm text-slate-300 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
              <div className="space-y-1">
                <p className="font-semibold text-white">Próximo diagnóstico bloqueado (limite de 90 dias)</p>
                <p className="text-slate-300">
                  Para acompanhar corretamente sua evolução e maturidade empresarial, um novo diagnóstico só é liberado 90 dias após a conclusão anterior.
                </p>
                <p className="mt-2 text-amber-300 font-medium">
                  Sua próxima liberação será em: {restriction.libDateStr}
                </p>
              </div>
            </div>
          )}
          {/* Main Phase Result Banner */}
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.01] p-8 md:p-10 backdrop-blur-sm">
            <div className="absolute -top-32 -left-32 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
            
            <div className="grid gap-8 md:grid-cols-3 md:items-center">
              <div className="md:col-span-2 space-y-4">
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <Trophy className="h-4 w-4" style={{ color: faseVal?.cor }} /> Nível de Maturidade de Negócio
                </div>
                <h2 className="text-4xl font-extrabold tracking-tight md:text-6xl" style={{ color: faseVal?.cor }}>
                  {faseVal?.nome}
                </h2>
                <div className="text-md font-semibold text-slate-200">{faseVal?.identidade}</div>
                <p className="text-slate-300 text-sm max-w-xl leading-relaxed">{faseVal?.descricao}</p>
              </div>

              {/* Score block */}
              <div className="flex flex-col items-center justify-center border-l border-white/10 p-4 min-h-[160px]">
                <div className="text-xs uppercase tracking-wider text-slate-400">Score de Maturidade</div>
                <div className="mt-2 text-6xl font-black tabular-nums text-white">
                  {scoreData.scoreFinal.toFixed(1)}
                  <span className="text-xl text-slate-500 font-medium">%</span>
                </div>
                <div className="mt-4 w-full">
                  <div className="relative h-2.5 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-indigo-500 to-fuchsia-500"
                      style={{ width: `${Math.min(scoreData.scoreFinal, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Blocks: Strength & Weakness */}
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.02] p-6 flex gap-4">
              <div className="h-10 w-10 shrink-0 inline-flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <Award className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold uppercase tracking-wider text-emerald-500">Seu maior pilar</div>
                <h4 className="text-base font-bold text-white">{forcasEDesafios?.melhor.area.nome}</h4>
                <p className="text-xs text-slate-400">Nesta dimensão seu negócio obteve o melhor score geral de consistência.</p>
                <div className="inline-block mt-2 rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-300">
                  {forcasEDesafios?.melhor.percentual.toFixed(0)}% de aproveitamento
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.02] p-6 flex gap-4">
              <div className="h-10 w-10 shrink-0 inline-flex items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold uppercase tracking-wider text-amber-500">Seu maior gargalo</div>
                <h4 className="text-base font-bold text-white">{forcasEDesafios?.desafio.area.nome}</h4>
                <p className="text-xs text-slate-400">Ponto crítico da infraestrutura de negócio que requer resolução.</p>
                <div className="inline-block mt-2 rounded bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-300">
                  {forcasEDesafios?.desafio.percentual.toFixed(0)}% de aproveitamento
                </div>
              </div>
            </div>
          </div>

          {/* Action Plan Component */}
          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/20 p-6 md:p-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300">
                <Target className="h-4 w-4" />
              </div>
              <h3 className="text-lg font-bold text-white">Recomendações Práticas (Próximos 90 dias)</h3>
            </div>
            
            <p className="text-slate-300 text-sm leading-relaxed">
              O diagnóstico sugere priorizar esforços estratégicos no pilar{" "}
              <strong className="text-indigo-300 font-bold">{forcasEDesafios?.desafio.area.nome}</strong>. 
              Resolver essa limitação garantirá a maior taxa de retorno sobre investimentos e impulsionará seu nível para o próximo nível.
            </p>
            <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 text-xs space-y-2 text-slate-400">
              <div className="font-semibold text-slate-300 uppercase tracking-widest text-[9px] mb-1">Pontos para auto-reflexão e aprimoramento rápido:</div>
              {forcasEDesafios?.desafio.area.questoes.slice(0, 3).map((q, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className="text-amber-400 shrink-0">•</span>
                  <span>{q}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pillar breakdown */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white">Percentual de Eficiência por Pilar</h3>
              <p className="text-xs text-slate-400 mt-1">Acompanhe detalhadamente o desempenho de cada indicador:</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {scoreData.areas.map(({ area, percentual, contribuicao }) => (
                <div key={area.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: area.cor }} />
                      <span className="text-sm font-semibold text-white">{area.nome}</span>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">peso {area.peso}%</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-400">Aproveitamento</span>
                      <span className="text-white tabular-nums">{percentual.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden bg-white/5">
                      <div className="h-full rounded-full transition-all" style={{ width: `${percentual}%`, backgroundColor: area.cor }} />
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 flex justify-between">
                    <span>Contribuição para a maturidade</span>
                    <span className="font-medium text-slate-400">+{contribuicao.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
