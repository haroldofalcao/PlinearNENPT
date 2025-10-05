import { Link, useLocation } from "react-router-dom";
import { Calculator, FlaskConical, BookOpen, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Painel", href: "/", icon: Home },
  { name: "Fórmulas", href: "/formulas", icon: FlaskConical },
  { name: "Calculadora", href: "/calculator", icon: Calculator },
  { name: "Guia", href: "/guide", icon: BookOpen },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <div className="flex items-center gap-2 font-bold text-xl">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
              <FlaskConical className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-primary">PN Optimizer</span>
          </div>
          
          <nav className="ml-12 flex gap-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">{children}</main>
    </div>
  );
}
