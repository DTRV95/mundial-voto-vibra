import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/cookies")({
  component: CookiesPage,
});

function CookiesPage() {
  return (
    <LegalPage title="Política de Cookies" updated="5 de junho de 2025">
      <Section title="1. O que são Cookies?">
        <p>Cookies são pequenos ficheiros de texto armazenados no teu dispositivo quando visitas um website. Permitem que o site recorde as tuas preferências e mantenha a tua sessão ativa.</p>
      </Section>

      <Section title="2. Cookies que Utilizamos">
        <p>Esta plataforma utiliza exclusivamente cookies estritamente necessários ao funcionamento. Não utilizamos cookies de rastreio, publicidade ou análise comportamental.</p>
        <table className="mt-3 w-full text-xs border border-border rounded-xl overflow-hidden">
          <thead className="bg-secondary text-left">
            <tr>
              <th className="px-3 py-2 font-semibold">Nome</th>
              <th className="px-3 py-2 font-semibold">Finalidade</th>
              <th className="px-3 py-2 font-semibold">Duração</th>
              <th className="px-3 py-2 font-semibold">Tipo</th>
            </tr>
          </thead>
          <tbody>
            {[
              { name: "sb-*-auth-token", purpose: "Autenticação segura do utilizador (Supabase Auth)", duration: "Sessão / 1 ano", type: "Estritamente necessário" },
              { name: "sb-*-auth-token-code-verifier", purpose: "Verificação de segurança no login (PKCE flow)", duration: "Sessão", type: "Estritamente necessário" },
            ].map((c, i) => (
              <tr key={i} className="border-t border-border">
                <td className="px-3 py-2 font-mono">{c.name}</td>
                <td className="px-3 py-2">{c.purpose}</td>
                <td className="px-3 py-2 whitespace-nowrap">{c.duration}</td>
                <td className="px-3 py-2">{c.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="3. Cookies de Terceiros">
        <p>Não carregamos cookies de redes sociais, plataformas de publicidade ou ferramentas de análise de terceiros. O único serviço externo utilizado é a <strong>Supabase</strong>, que gere a autenticação e base de dados de forma segura, em conformidade com o RGPD.</p>
      </Section>

      <Section title="4. Como Gerir os Cookies">
        <p>Como os cookies utilizados são estritamente necessários para o funcionamento da plataforma (autenticação), não é possível desativá-los sem perder acesso à tua conta.</p>
        <p>Podes, no entanto, eliminar todos os cookies através das definições do teu browser:</p>
        <ul>
          <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-wc-red hover:underline">Google Chrome</a></li>
          <li><a href="https://support.mozilla.org/pt-PT/kb/limpar-cookies-e-dados-de-sites-firefox" target="_blank" rel="noopener noreferrer" className="text-wc-red hover:underline">Mozilla Firefox</a></li>
          <li><a href="https://support.apple.com/pt-pt/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-wc-red hover:underline">Apple Safari</a></li>
          <li><a href="https://support.microsoft.com/pt-pt/microsoft-edge/eliminar-cookies-no-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-wc-red hover:underline">Microsoft Edge</a></li>
        </ul>
        <p>Nota: eliminar os cookies irá terminar a tua sessão na plataforma.</p>
      </Section>

      <Section title="5. Contacto">
        <p>Para questões sobre a nossa utilização de cookies, contacta-nos em <a href="mailto:davidvilaverde@hotmail.com" className="text-wc-red hover:underline">davidvilaverde@hotmail.com</a>.</p>
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
