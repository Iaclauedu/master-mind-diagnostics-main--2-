export type Area = {
  id: string;
  nome: string;
  peso: number; // em %
  cor: string; // hex para gráficos
  questoes: string[];
};

export const AREAS: Area[] = [
  {
    id: "identidade",
    nome: "Identidade e Posicionamento",
    peso: 15,
    cor: "#8b5cf6",
    questoes: [
      "Tenho clareza sobre qual é o meu público principal (quem eu ensino) e o que ele mais precisa resolver.",
      "Consigo explicar em uma frase o que me diferencia de outros educadores que ensinam sobre o mesmo tema.",
      "Minha marca (nome, logo, cores) é reconhecível e as pessoas sabem logo quem eu sou quando me veem.",
      "As pessoas que me conhecem conseguem descrever exatamente qual é a minha especialidade sem dificuldade.",
      "Meu posicionamento permite que eu cobre valores maiores do que a concorrência, sem que os clientes questionem muito.",
      "Sou conhecido como a pessoa que resolve um problema específico no meu nicho.",
    ],
  },
  {
    id: "metodo",
    nome: "Método e Transformação",
    peso: 15,
    cor: "#06b6d4",
    questoes: [
      "Tenho um passo a passo claro de como ensino (uma sequência lógica que faz sentido para o aluno).",
      "Consigo mostrar exemplos reais de pessoas que aplicaram o que ensino e tiveram resultados.",
      "O resultado que prometo é algo que o aluno consegue medir ou perceber de forma clara.",
      "Meus alunos conseguem ver progresso rápido, logo nos primeiros dias ou semanas de aprendizado.",
      "Meu método funciona de formas diferentes (curso, mentoria, grupo, etc.) sem perder a qualidade.",
      "Eu atualizo meu método regularmente com base no que funciona melhor com meus alunos.",
    ],
  },
  {
    id: "produto",
    nome: "Produto e Esteira",
    peso: 15,
    cor: "#10b981",
    questoes: [
      "Tenho uma oferta inicial (mais barata) que prepara o cliente para comprar a minha oferta principal.",
      "Tenho uma oferta de maior valor (mentoria, consultoria, programa exclusivo) além do meu curso principal.",
      "Meus preços são estratégicos: não cobro tão barato que pareça sem valor, nem tão caro que ninguém compre.",
      "Minha oferta tem diferenciais claros em relação ao que outras pessoas vendem (bônus, acompanhamento, comunidade).",
      "Quando alguém compra de mim, tenho um plano para vender mais coisas para essa pessoa no futuro.",
      "Meu produto principal não depende de lançamentos pontuais; ele vende o tempo todo.",
    ],
  },
  {
    id: "autoridade",
    nome: "Autoridade e Conteúdo",
    peso: 10,
    cor: "#f59e0b",
    questoes: [
      "Eu compartilho conteúdo regularmente (dicas, vídeos, posts) sobre meu tema de especialidade.",
      "Consigo produzir conteúdo em mais de um lugar (Instagram, YouTube, TikTok, Blog, Podcast) sem ficar sobrecarregado.",
      "Meu conteúdo gera interação real (comentários, mensagens, pessoas querendo saber mais) e não apenas números vazios.",
      "Invisto em anúncios para divulgar meu melhor conteúdo e atrair novas pessoas interessadas.",
      "Sou convidado para falar em eventos, podcasts ou colaborações porque reconhecem minha expertise.",
      "Tenho conteúdo que continua atraindo pessoas e gerando interesse mesmo depois de muito tempo publicado.",
    ],
  },
  {
    id: "vendas",
    nome: "Vendas e Conversão",
    peso: 20,
    cor: "#ef4444",
    questoes: [
      'Tenho um processo claro de como as pessoas saem de "não me conhecer" para "comprar de mim".',
      "Consigo rastrear quanto custa atrair um novo cliente e quanto ganho com ele (mesmo que de forma básica).",
      "Quando faço uma oferta, uma porcentagem significativa das pessoas interessadas realmente compra.",
      "Consigo escrever sobre minha oferta de forma que as pessoas entendam por que devem comprar.",
      "Faço ofertas regularmente (semanais, quinzenais) para minha lista de pessoas interessadas, gerando vendas constantes.",
      "Quando alguém não compra na primeira vez, tenho um plano para oferecer novamente.",
    ],
  },
  {
    id: "experiencia",
    nome: "Experiência do Cliente",
    peso: 10,
    cor: "#ec4899",
    questoes: [
      "Quando alguém compra de mim, eu faço algo especial para recebê-lo e deixá-lo animado para começar.",
      "Acompanho se meus alunos estão realmente aprendendo e consigo identificar quando alguém está desistindo.",
      "Meu material de ensino é organizado e fácil de encontrar (não é uma bagunça de arquivos e links).",
      "Quando um aluno tem dúvida, ele consegue tirar rapidamente e não fica dias esperando resposta.",
      "Meus alunos se relacionam uns com os outros e sentem que fazem parte de um grupo (comunidade).",
      "Eu celebro quando meus alunos conseguem resultados e peço para eles compartilharem isso comigo.",
    ],
  },
  {
    id: "operacao",
    nome: "Operação e Equipe",
    peso: 10,
    cor: "#3b82f6",
    questoes: [
      "Tenho alguém (ou mais pessoas) que me ajuda com tarefas do dia a dia, não faço tudo sozinho.",
      "Cada pessoa da minha equipe sabe exatamente qual é o seu trabalho e o que é esperado dela.",
      "Eu uso ferramentas para organizar o que precisa ser feito (tarefas, prazos, responsáveis).",
      "Tenho um documento com as principais rotinas do meu negócio para que qualquer pessoa consiga fazer.",
      "Minha equipe se comunica bem, sabe o que está acontecendo e a gente se alinha regularmente.",
      "Meu negócio gasta menos do que ganha (tenho lucro) e consigo pagar minha equipe tranquilamente.",
    ],
  },
  {
    id: "escala",
    nome: "Escala e Indicadores",
    peso: 5,
    cor: "#a3e635",
    questoes: [
      "Eu acompanho os números principais do meu negócio (quanto vendo, quanto gasto, quanto lucro).",
      "Consigo identificar qual é o maior problema que está impedindo meu negócio de crescer mais.",
      "Minha infraestrutura (plataforma de cursos, sistema de pagamento, e-mail) aguenta crescimento sem cair.",
      "Tenho uma visão clara de onde quero chegar com meu negócio nos próximos 1 a 3 anos.",
      "Testo regularmente novas formas de atrair clientes para não depender de uma única fonte.",
      "Meu modelo de negócio permite crescer sem que eu tenha que trabalhar proporcionalmente mais.",
    ],
  },
];

export const ESCALA = [
  { valor: 1, label: "Discordo totalmente", desc: "Não possuo / Não aplico" },
  { valor: 2, label: "Discordo parcialmente", desc: "Iniciante / Raramente" },
  { valor: 3, label: "Neutro", desc: "Aplico às vezes" },
  { valor: 4, label: "Concordo parcialmente", desc: "Aplico com bons resultados" },
  { valor: 5, label: "Concordo totalmente", desc: "Dominado e escalável" },
];

export type FaseKey = "FOUNDATION" | "BUILDER" | "BUSINESS" | "PERFORMANCE" | "SCALE";

export const FASES: Record<
  FaseKey,
  { nome: string; identidade: string; descricao: string; min: number; max: number; cor: string }
> = {
  FOUNDATION: {
    nome: "FOUNDATION",
    identidade: "Especialista Operacional",
    descricao:
      "Você está começando agora. Foco: definir bem o que você ensina e fazer as primeiras vendas.",
    min: 0,
    max: 20,
    cor: "#94a3b8",
  },
  BUILDER: {
    nome: "BUILDER",
    identidade: "Especialista Tático",
    descricao:
      "Você já tem alguns clientes, mas precisa organizar melhor como ensina. Foco: criar um método claro e processos básicos.",
    min: 21,
    max: 40,
    cor: "#06b6d4",
  },
  BUSINESS: {
    nome: "BUSINESS",
    identidade: "Transição para Master Business",
    descricao:
      "Seu negócio já está funcionando, mas você faz tudo. Foco: delegar tarefas e começar a escalar.",
    min: 41,
    max: 60,
    cor: "#8b5cf6",
  },
  PERFORMANCE: {
    nome: "PERFORMANCE",
    identidade: "Master Business em evolução",
    descricao:
      "Seu negócio está estruturado e crescendo. Foco: otimizar vendas, aumentar preços e criar ofertas maiores.",
    min: 61,
    max: 80,
    cor: "#f59e0b",
  },
  SCALE: {
    nome: "SCALE",
    identidade: "Exponencializando o Master Business",
    descricao:
      "Seu negócio é previsível e rentável. Foco: crescimento exponencial, novos mercados e novos modelos.",
    min: 81,
    max: 100,
    cor: "#10b981",
  },
};

export type Respostas = Record<string, number[]>;

export function calcularAreaPercentual(respostas: number[]): number {
  if (!respostas || respostas.length === 0) return 0;
  const soma = respostas.reduce((a, b) => a + (b || 0), 0);
  return (soma / 30) * 100;
}

export function calcularScoreFinal(respostas: Respostas): {
  scoreFinal: number;
  areas: { area: Area; percentual: number; contribuicao: number }[];
} {
  const areas = AREAS.map((area) => {
    const r = respostas[area.id] || [];
    const percentual = calcularAreaPercentual(r);
    const contribuicao = (percentual * area.peso) / 100;
    return { area, percentual, contribuicao };
  });
  const scoreFinal = areas.reduce((acc, a) => acc + a.contribuicao, 0);
  return { scoreFinal, areas };
}

export function classificarFase(score: number): FaseKey {
  if (score <= 20) return "FOUNDATION";
  if (score <= 40) return "BUILDER";
  if (score <= 60) return "BUSINESS";
  if (score <= 80) return "PERFORMANCE";
  return "SCALE";
}
