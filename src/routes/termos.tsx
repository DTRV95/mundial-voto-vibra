import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/termos")({
  component: TermosPage,
});

function TermosPage() {
  return (
    <LegalPage title="Termos e Condições" updated="5 de junho de 2025">
      <Section title="1. Identificação do Serviço">
        <p><strong>Uma Geração</strong> é uma plataforma de previsões desportivas comunitária, inteiramente gratuita, dedicada ao Campeonato do Mundo de Futebol FIFA 2026. Não envolve apostas, dinheiro real, nem qualquer forma de jogo a dinheiro.</p>
        <p>Responsável: David Tomas da Rocha Vilaverde — <a href="mailto:davidvilaverde@hotmail.com" className="text-wc-red hover:underline">davidvilaverde@hotmail.com</a></p>
      </Section>

      <Section title="2. Aceitação dos Termos">
        <p>Ao criares uma conta ou utilizares a plataforma, aceitas estes Termos e Condições na íntegra. Se não concordares, não deves utilizar o serviço.</p>
      </Section>

      <Section title="3. Elegibilidade">
        <p>O serviço é destinado a utilizadores com 16 anos ou mais. Ao registares-te, confirmas que tens a idade mínima exigida. Utilizadores com menos de 16 anos não devem criar conta sem autorização de um responsável legal.</p>
      </Section>

      <Section title="4. Conta de Utilizador">
        <ul>
          <li>É da tua responsabilidade manter a confidencialidade das tuas credenciais de acesso.</li>
          <li>É proibido criar múltiplas contas para obter vantagem nos rankings.</li>
          <li>Podes eliminar a tua conta a qualquer momento através da página de perfil ou por pedido por email.</li>
          <li>Reservamo-nos o direito de suspender ou eliminar contas que violem estes termos.</li>
        </ul>
      </Section>

      <Section title="5. Regras de Utilização">
        <p>É estritamente proibido:</p>
        <ul>
          <li>Utilizar a plataforma para fins ilegais ou fraudulentos.</li>
          <li>Publicar conteúdo ofensivo, difamatório, discriminatório ou que viole direitos de terceiros.</li>
          <li>Tentar aceder indevidamente a sistemas, contas de outros utilizadores ou à infraestrutura da plataforma.</li>
          <li>Usar scripts ou bots para manipular previsões ou rankings.</li>
        </ul>
      </Section>

      <Section title="6. Propriedade Intelectual">
        <p>Todo o conteúdo da plataforma (design, código, textos, logótipos) é propriedade de David Tomas da Rocha Vilaverde ou de terceiros devidamente licenciados. É proibida a reprodução total ou parcial sem autorização prévia e escrita.</p>
        <p>As marcas, logótipos e denominações da FIFA e do Campeonato do Mundo pertencem aos respetivos titulares. Esta plataforma não tem qualquer afiliação oficial com a FIFA.</p>
      </Section>

      <Section title="7. Torneios Privados">
        <p>Os torneios privados criados pelos utilizadores são da responsabilidade de quem os cria. Qualquer prémio anunciado num torneio privado é da inteira responsabilidade do criador desse torneio, não tendo a plataforma qualquer intervenção ou responsabilidade na sua atribuição.</p>
      </Section>

      <Section title="8. Disponibilidade do Serviço">
        <p>A plataforma é disponibilizada "tal como está". Não garantimos disponibilidade ininterrupta e reservamo-nos o direito de suspender, alterar ou encerrar o serviço a qualquer momento, com ou sem aviso prévio.</p>
      </Section>

      <Section title="9. Limitação de Responsabilidade">
        <p>A plataforma não assume responsabilidade por danos diretos ou indiretos decorrentes da utilização ou impossibilidade de utilização do serviço, incluindo perda de dados ou interrupção do acesso.</p>
      </Section>

      <Section title="10. Alterações aos Termos">
        <p>Reservamo-nos o direito de alterar estes Termos a qualquer momento. As alterações entram em vigor após publicação na plataforma. A utilização continuada após as alterações implica a aceitação dos novos termos.</p>
      </Section>

      <Section title="11. Lei Aplicável e Foro">
        <p>Estes Termos são regidos pela lei portuguesa. Para resolução de litígios, é competente o tribunal da comarca de residência do utilizador, nos termos da legislação aplicável.</p>
      </Section>
    </LegalPage>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="font-display text-xl mb-3 text-foreground">{title}</h2>
      <div className="space-y-2 text-sm text-muted-foreground leading-relaxed [&_ul]:mt-2 [&_ul]:space-y-1.5 [&_ul]:list-disc [&_ul]:pl-5">{children}</div>
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
