import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpen, Calculator, FlaskConical, HelpCircle, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";
import { trackPageView } from "@/lib/analytics";

export default function Guide() {
  useEffect(() => {
    trackPageView('guide', 'Guia do Usuário');
  }, []);
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Guia do Usuário</h1>
        <p className="text-muted-foreground mt-1">
          Aprenda a usar o Otimizador de Nutrição Parenteral de forma eficaz
        </p>
      </div>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <CardTitle>Primeiros Passos</CardTitle>
          </div>
          <CardDescription>Introdução rápida ao otimizador</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">O que é esta ferramenta?</h3>
            <p className="text-sm text-muted-foreground">
              O Otimizador de Nutrição Parenteral é uma ferramenta profissional que usa algoritmos
              avançados de otimização para encontrar a combinação mais econômica de fórmulas de nutrição
              parenteral enquanto atende todos os requisitos nutricionais. Foi projetado para profissionais
              de saúde, farmacêuticos e nutricionistas.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Principais Benefícios</h3>
            <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
              <li>Minimize custos enquanto atende todas as restrições nutricionais</li>
              <li>Comparação rápida de múltiplas combinações de fórmulas</li>
              <li>Suporte para custos personalizados e opções de filtragem</li>
              <li>Importação/exportação em Excel para fácil gerenciamento de dados</li>
              <li>Análise visual dos resultados com gráficos</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Step by Step Guide */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-accent" />
            <CardTitle>Tutorial Passo a Passo</CardTitle>
          </div>
          <CardDescription>Siga estes passos para otimizar fórmulas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                1
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold">Gerencie Suas Fórmulas</h3>
                <p className="text-sm text-muted-foreground">
                  Navegue até a página de Fórmulas para visualizar, adicionar, editar ou importar fórmulas do Excel.
                  Certifique-se de que sua base de dados inclui todas as fórmulas que você deseja considerar.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                2
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold">Defina as Restrições</h3>
                <p className="text-sm text-muted-foreground">
                  Vá para a página da Calculadora e insira os requisitos nutricionais do paciente:
                  calorias mínimas/máximas, proteína e limites de volume.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                3
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold">Execute a Otimização</h3>
                <p className="text-sm text-muted-foreground">
                  Clique no botão "Otimizar Combinação de Fórmulas" para executar o algoritmo de otimização.
                  O sistema encontrará a melhor combinação em segundos.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                4
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold">Revise os Resultados</h3>
                <p className="text-sm text-muted-foreground">
                  Examine os resultados incluindo custo total, fórmulas selecionadas e composição nutricional.
                  Use os gráficos para visualizar a distribuição.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                5
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold">Exporte e Compartilhe</h3>
                <p className="text-sm text-muted-foreground">
                  Exporte os resultados para Excel ou PDF para documentação e compartilhamento com sua equipe.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-success" />
            <CardTitle>Perguntas Frequentes</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>O que é otimização por programação linear?</AccordionTrigger>
              <AccordionContent>
                Programação linear é um método matemático para encontrar o melhor resultado em um modelo
                matemático com relacionamentos lineares. No nosso caso, encontra a combinação de fórmulas que
                minimiza o custo enquanto satisfaz todas as restrições nutricionais.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>Quão precisos são os resultados?</AccordionTrigger>
              <AccordionContent>
                O otimizador fornece soluções matematicamente ótimas baseadas nos dados e restrições
                que você fornece. Sempre verifique os resultados com julgamento clínico e protocolos institucionais.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>Posso personalizar os custos das fórmulas?</AccordionTrigger>
              <AccordionContent>
                Sim! Você pode definir custos personalizados para fórmulas individuais para refletir os
                preços reais da sua instituição ou taxas contratuais. Isso está disponível nas opções avançadas.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger>E se nenhuma solução for encontrada?</AccordionTrigger>
              <AccordionContent>
                Se o otimizador retornar "Inviável", significa que nenhuma combinação de fórmulas disponíveis
                pode satisfazer todas as suas restrições. Tente relaxar algumas restrições ou adicionar mais fórmulas
                ao seu banco de dados.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger>Como importo fórmulas do Excel?</AccordionTrigger>
              <AccordionContent>
                Na página de Fórmulas, clique em "Importar Excel" e selecione seu arquivo. O sistema suporta
                formatos padrão do Excel (.xlsx, .xls) com colunas para nome, volume, calorias, proteína
                e outras propriedades das fórmulas.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Glossary */}
      <Card>
        <CardHeader>
          <CardTitle>Glossário</CardTitle>
          <CardDescription>Termos comuns usados em nutrição parenteral</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline">kcal</Badge>
                <span className="font-semibold">Quilocalorias</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Unidade de energia fornecida pela fórmula de nutrição parenteral.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline">MCT/LCT</Badge>
                <span className="font-semibold">Triglicerídeos de Cadeia Média/Longa</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Tipo de emulsão lipídica que mistura ácidos graxos de cadeia média e longa.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline">Central</Badge>
                <span className="font-semibold">Acesso Venoso Central</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Administração via cateter venoso central, permite maior osmolaridade.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline">Periférica</Badge>
                <span className="font-semibold">Acesso Venoso Periférico</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Administração via veia periférica, requer fórmulas de menor osmolaridade.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
