import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacidade")({
  component: PrivacidadePage,
});

function PrivacidadePage() {
  return (
    <LegalPage title="Política de Privacidade" updated="5 de junho de 2025">
      <Section title="1. Responsável pelo Tratamento">
        <p>O responsável pelo tratamento dos teus dados pessoais é:</p>
        <p className="mt-2 font-semibold">David Tomas da Rocha Vilaverde</p>
        <p>Email: <a href="mailto:davidvilaverde@hotmail.com" className="text-wc-red hover:underline">davidvilaverde@hotmail.com</a></p>
      </Section>

      <Section title="2. Dados Recolhidos">
        <p>Recolhemos os seguintes dados pessoais:</p>
        <ul>
          <li><strong>Dados de conta:</strong> endereço de email e nome de utilizador, fornecidos no momento do registo.</li>
          <li><strong>Dados de utilização:</strong> previsões submetidas, pontos obtidos e histórico de participação.</li>
          <li><strong>Dados técnicos:</strong> endereço IP, tipo de browser e sistema operativo, recolhidos automaticamente para segurança e funcionamento da plataforma.</li>
        </ul>
      </Section>

      <Section title="3. Finalidade e Base Legal">
        <p>Os teus dados são tratados para:</p>
        <ul>
          <li>Gerir a tua conta e autenticação (base legal: execução de contrato).</li>
          <li>Permitir a participação em previsões e rankings (base legal: execução de contrato).</li>
          <li>Garantir a segurança e o funcionamento da plataforma (base legal: interesse legítimo).</li>
          <li>Cumprimento de obrigações legais (base legal: obrigação legal).</li>
        </ul>
      </Section>

      <Section title="4. Conservação dos Dados">
        <p>Os teus dados são conservados enquanto mantiveres uma conta ativa na plataforma. Após eliminação da conta, os dados são apagados no prazo de 30 dias, salvo obrigação legal em contrário.</p>
      </Section>

      <Section title="5. Partilha de Dados">
        <p>Os teus dados não são vendidos nem partilhados com terceiros para fins comerciais. São partilhados apenas com:</p>
        <ul>
          <li><strong>Supabase Inc.</strong> — infraestrutura de base de dados e autenticação, com servidores na União Europeia.</li>
        </ul>
      </Section>

      <Section title="6. Os Teus Direitos (RGPD)">
        <p>Tens direito a:</p>
        <ul>
          <li><strong>Acesso</strong> — solicitar uma cópia dos teus dados pessoais.</li>
          <li><strong>Retificação</strong> — corrigir dados incorretos ou incompletos.</li>
          <li><strong>Eliminação</strong> — solicitar o apagamento dos teus dados ("direito ao esquecimento").</li>
          <li><strong>Portabilidade</strong> — receber os teus dados num formato estruturado e legível por máquina.</li>
          <li><strong>Oposição</strong> — opor-te ao tratamento com base em interesse legítimo.</li>
          <li><strong>Reclamação</strong> — apresentar queixa à <a href="https://www.cnpd.pt" target="_blank" rel="noopener noreferrer" className="text-wc-red hover:underline">CNPD (Comissão Nacional de Proteção de Dados)</a>.</li>
        </ul>
        <p className="mt-2">Para exercer qualquer um destes direitos, contacta-nos em <a href="mailto:davidvilaverde@hotmail.com" className="text-wc-red hover:underline">davidvilaverde@hotmail.com</a>. Responderemos no prazo de 30 dias.</p>
      </Section>

      <Section title="7. Segurança">
        <p>Adotamos medidas técnicas e organizacionais adequadas para proteger os teus dados contra acesso não autorizado, perda ou destruição, incluindo transmissão cifrada (HTTPS) e autenticação segura.</p>
      </Section>

      <Section title="8. Alterações a Esta Política">
        <p>Reservamo-nos o direito de atualizar esta política. Em caso de alterações significativas, notificaremos os utilizadores por email ou através da plataforma. A data de última atualização está sempre indicada no topo deste documento.</p>
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
