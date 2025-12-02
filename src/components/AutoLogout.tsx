import { useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const INACTIVITY_LIMIT_MS = 15 * 60 * 1000; // 15 Minutos
const CHECK_INTERVAL_MS = 5000; // Checar a cada 5s
const STORAGE_KEY = "finance_app_last_activity";

export function AutoLogout() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();

    // Ref para controlar throttle de escrita no storage (Performance)
    const lastWriteRef = useRef(Date.now());

    // 1. Função que registra que o usuário está vivo
    const registerActivity = useCallback(() => {
        const now = Date.now();
        // Só escreve no disco se passou mais de 2 segundos desde a última escrita
        if (now - lastWriteRef.current > 2000) {
            localStorage.setItem(STORAGE_KEY, now.toString());
            lastWriteRef.current = now;
        }
    }, []);

    // 2. Setup dos Listeners (Roda uma vez)
    useEffect(() => {
        if (!user) return;

        // Inicializa se não existir
        if (!localStorage.getItem(STORAGE_KEY)) {
            localStorage.setItem(STORAGE_KEY, Date.now().toString());
        }

        const events = ["mousedown", "keydown", "scroll", "touchstart", "mousemove"];
        events.forEach((event) => window.addEventListener(event, registerActivity));

        return () => {
            events.forEach((event) => window.removeEventListener(event, registerActivity));
        };
    }, [user, registerActivity]);

    // 3. O "Vigia" (Polling)
    useEffect(() => {
        if (!user) return;

        const intervalId = setInterval(() => {
            const now = Date.now();
            const storedTime = localStorage.getItem(STORAGE_KEY);
            const lastActivity = storedTime ? parseInt(storedTime, 10) : now;

            // Proteção de Rotas Críticas
            const isRecoveryPage = ["/recovery", "/update-password", "/forgot-password"].some(path =>
                location.pathname.includes(path)
            );

            if (isRecoveryPage) {
                // Renova o tempo automaticamente nessas telas para não atrapalhar
                localStorage.setItem(STORAGE_KEY, now.toString());
                return;
            }

            // Verificação de Expiração
            if (now - lastActivity > INACTIVITY_LIMIT_MS) {
                console.warn("[AutoLogout] Inatividade detectada. Encerrando sessão...");

                // Limpa intervalo e storage local imediatamente
                clearInterval(intervalId);
                localStorage.removeItem(STORAGE_KEY);

                signOut().then(() => {
                    navigate("/login");
                    toast({
                        title: "Sessão Expirada",
                        description: "Você foi desconectado por inatividade para sua segurança.",
                        variant: "destructive",
                    });
                });
            }
        }, CHECK_INTERVAL_MS);

        return () => clearInterval(intervalId);
    }, [user, navigate, signOut, location, toast]);

    return null; // Componente lógico, sem renderização visual
}
