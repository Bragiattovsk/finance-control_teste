import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "./ui/button"; // Seu botão do shadcn

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    void error;
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background p-4 text-center">
          <h2 className="text-xl font-bold">Ops! Algo deu errado.</h2>
          <p className="text-muted-foreground">Pode ser uma atualização nova do sistema.</p>
          <Button 
            onClick={() => window.location.reload()} // Força o refresh
            className="bg-primary text-white"
          >
            Atualizar Página
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
