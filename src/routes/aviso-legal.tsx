import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/aviso-legal")({
  component: AvisoLegalPage,
});

function AvisoLegalPage() {
  return (
    <LegalPage title="Aviso Legal" updated="5 de junho de 2025">
      <Section title="Identificação do Responsável">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-border">
            {[
              { label: "Nome", value: "David Tomas da Rocha Vilaverde" },
              { label: "Email", value: <a href="mailto:davidvilaverde@hotmail.com" className="text-wc-red hover:underline">davidvilaverde@hotmail.com</a> },
              { label: "País", value: "Portugal" },
            ].map((row, i) => (
              <tr key={i}>
                <td className="py-2.5 pr-4 font-semibold text-foreground w-32">{row.label}</td>
                <td className="py-2.5 text-muted-foreground">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Sobre a Plataforma">
        <p><strong>Ultima Geração</strong> é uma plataforma digital de previsões desportivas comunitária, dedicada ao Campeonato do Mundo de Futebol FIFA 2026. O serviço é inteiramente gratuito e não envolve apostas ou jogo a dinheiro.</p>
        <p>Esta plataforma não tem qualquer afiliação, patrocínio ou aprovação oficial por parte da FIFA ou de qualquer federação de futebol.</p>
      </Section>

      <Section title="Propriedade Intelectual">
        <p>O conteúdo desta plataforma — incluindo design, código, textos e elementos gráficos — é propriedade de David Tomas da Rocha Vilaverde, salvo indicação em contrário. A reprodução ou utilização não autorizada é proibida.</p>
      </Section>

      <Section title="Responsabilidade">
        <p>O responsável pela plataforma não garante a exatidão, completude ou atualidade do conteúdo publicado. A utilização da plataforma é feita por conta e risco do utilizador.</p>
        <p>Links para sites externos são disponibilizados a título informativo. Não nos responsabilizamos pelo conteúdo de sites de terceiros.</p>
      </Section>

      <Section title="Lei Aplicável">
        <p>Este aviso legal é regido pela legislação portuguesa, nomeadamente pelo Decreto-Lei n.º 7/2004 (Comércio Eletrónico) e pelo Regulamento (UE) 2016/679 (RGPD).</p>
      </Section>

      <Section title="Contacto">
        <p>Para qualquer questão relacionada com esta plataforma, contacta-nos através de <a href="mailto:davidvilaverde@hotmail.com" className="text-wc-red hover:underline">davidvilaverde@hotmail.com</a>. Responderemos no prazo máximo de 15 dias úteis.</p>
      </Section>
    </LegalPage>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="font-display text-xl mb-3 text-foreground">{title}</h2>
      <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">{children}</div>
    </div>
  );
}

function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-5 py-10 md:py-14">
      <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Legal</p>
      <h1 className="font-display text-3xl md:text-4xl mb-1">{title}</h1>
      <p className="text-xs text-muted-foreground mb-10">Última atualização: {updated}</p>
      <div>{children}</div>
    </div>
  );
}
