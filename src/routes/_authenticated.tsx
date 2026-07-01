import { createFileRoute, Outlet, useNavigate, Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, ClipboardCheck, LogOut, Sparkles, Loader2, Menu, X, Users, Calendar, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/diagnostico", label: "Diagnóstico", icon: ClipboardCheck },
  { to: "/cadastro", label: "Cadastro", icon: Users },
  { to: "/cadastro-eventos", label: "Cadastro Eventos", icon: Calendar },
  { to: "/mentoria", label: "Mentoria", icon: BookOpen },
] as const;

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loadingRole, setLoadingRole] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const fetchUserAndRole = async (currentUser: User | null) => {
      setUser(currentUser);
      if (currentUser) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("mb_guest_mode");
        }
        // Busca a role primeiro na tabela usuarios do banco de dados (fonte da verdade)
        try {
          const { data, error } = await supabase
            .from("usuarios")
            .select("role")
            .eq("id", currentUser.id)
            .maybeSingle();

          if (!error && data?.role) {
            setRole(data.role);
            setLoadingRole(false);
            return;
          }
        } catch (err) {
          console.error("Erro ao obter a role da tabela usuarios:", err);
        }

        // Se não encontrar ou falhar, usa os metadados do Auth como fallback
        if (currentUser.user_metadata?.role) {
          setRole(currentUser.user_metadata.role);
        }
        setLoadingRole(false);
      } else {
        setRole(null);
        setLoadingRole(false);
        
        // Redireciona para o login se não estiver em ambiente de desenvolvimento com o modo convidado ativo
        const isProd = import.meta.env.PROD;
        const isGuestMode = typeof window !== "undefined" && localStorage.getItem("mb_guest_mode") === "true";
        if (isProd || !isGuestMode) {
          navigate({ to: "/login" });
        }
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      fetchUserAndRole(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data }) => {
      fetchUserAndRole(data.session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Bloqueio de rotas para alunos
  useEffect(() => {
    if (!loadingRole && role === "aluno") {
      const restrictedPaths = ["/cadastro", "/cadastro-eventos", "/mentoria"];
      if (restrictedPaths.includes(pathname)) {
        navigate({ to: "/" });
        toast.error("Acesso negado: Alunos só têm acesso ao Dashboard e ao Diagnóstico.");
      }
    }
  }, [role, loadingRole, pathname, navigate]);

  const logout = async () => {
    await supabase.auth.signOut();
    if (typeof window !== "undefined") {
      localStorage.removeItem("mb_diagnostico_respostas");
      localStorage.removeItem("mb_diagnostico_step");
      localStorage.removeItem("mb_guest_mode");
    }
    navigate({ to: "/login" });
  };

  const displayName = user?.user_metadata?.name || user?.email || "Convidado";
  const displayEmail = user?.email || "modo de teste";
  const initials =
    displayName
      .split(/[\s@]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s: string) => s[0]?.toUpperCase())
      .join("") || "MB";

  const SidebarBody = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 pt-6 pb-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 shadow-lg shadow-indigo-500/30">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div className="text-base font-bold leading-tight text-white">
          Portal
          <br />
          Master Business
        </div>
      </div>

      <div className="mx-5 mb-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="px-5 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        Menu
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV.filter((item) => {
          if (role === "aluno") {
            return item.to === "/" || item.to === "/diagnostico";
          }
          return true;
        }).map((item) => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-gradient-to-r from-indigo-500/25 via-fuchsia-500/15 to-transparent text-white ring-1 ring-inset ring-indigo-400/30"
                  : "text-slate-400 hover:bg-white/5 hover:text-white",
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-indigo-400 to-fuchsia-400" />
              )}
              <item.icon
                className={cn(
                  "h-4 w-4 transition-colors",
                  active ? "text-indigo-300" : "text-slate-500 group-hover:text-slate-300",
                )}
              />
              <span className="flex-1">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-sm font-bold text-white">
            {initials || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-white">{displayName}</div>
            <div className="truncate text-xs text-slate-500">{displayEmail}</div>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={logout}
          className="mt-1 w-full justify-start text-slate-400 hover:bg-white/5 hover:text-white"
        >
          <LogOut className="mr-2 h-4 w-4" /> Sair
        </Button>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-[#0c1a2e] text-slate-100">

      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-white/10 bg-slate-950/60 backdrop-blur-xl lg:block">
        {SidebarBody}
      </aside>

      {/* Mobile topbar */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-slate-950/70 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-bold">Master Business</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-slate-300 hover:bg-white/10"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-white/10 bg-slate-950">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-2 text-slate-300 hover:bg-white/10"
              aria-label="Fechar menu"
            >
              <X className="h-5 w-5" />
            </button>
            {SidebarBody}
          </aside>
        </div>
      )}

      <main className="relative lg:pl-64">
        <Outlet />
      </main>
    </div>
  );
}
