export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-10">

        <div className="mb-8">
          <p className="text-xs font-bold tracking-widest text-blue-600 uppercase mb-2">SKILL HUNTER ATS</p>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Política de Privacidade</h1>
          <p className="text-sm text-gray-400">Última atualização: junho de 2026</p>
        </div>

        <div className="prose prose-gray max-w-none text-sm leading-relaxed space-y-6">

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-2">1. Quem somos</h2>
            <p className="text-gray-600">
              O <strong>SKILL HUNTER</strong> é um sistema ATS (Applicant Tracking System) operado pela
              <strong> Skill Certo</strong>, utilizado exclusivamente para gestão de processos seletivos.
              Esta política descreve como coletamos, utilizamos e protegemos os dados pessoais de
              candidatos processados pelo sistema.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-2">2. Dados coletados</h2>
            <p className="text-gray-600 mb-2">Ao importar um currículo, o sistema processa e armazena:</p>
            <ul className="list-disc pl-5 text-gray-600 space-y-1">
              <li>Nome completo</li>
              <li>Endereço de e-mail e telefone</li>
              <li>Localização (cidade/estado)</li>
              <li>Cargo atual e histórico profissional</li>
              <li>Habilidades técnicas (hard skills) e comportamentais (soft skills)</li>
              <li>Idiomas e formação acadêmica</li>
              <li>Arquivo original do currículo (PDF ou DOCX)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-2">3. Finalidade do tratamento</h2>
            <p className="text-gray-600">
              Os dados são utilizados exclusivamente para fins de recrutamento e seleção de candidatos
              para vagas de emprego. Nenhum dado é utilizado para fins comerciais, publicitários ou
              compartilhado com terceiros sem consentimento.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-2">4. Base legal (LGPD)</h2>
            <p className="text-gray-600">
              O tratamento de dados é realizado com base no <strong>legítimo interesse</strong> do
              recrutador no contexto de processo seletivo (art. 7º, IX da Lei 13.709/2018 — LGPD),
              e no <strong>consentimento</strong> implícito do candidato ao submeter seu currículo
              para análise.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-2">5. Armazenamento e segurança</h2>
            <ul className="list-disc pl-5 text-gray-600 space-y-1">
              <li>Dados armazenados em banco PostgreSQL hospedado na Railway (servidores nos EUA)</li>
              <li>Comunicação criptografada via HTTPS/TLS</li>
              <li>Acesso restrito por autenticação JWT</li>
              <li>Backups automáticos diários com retenção de 30 dias</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-2">6. Seus direitos (art. 18 da LGPD)</h2>
            <p className="text-gray-600 mb-2">Como titular dos dados, você tem direito a:</p>
            <ul className="list-disc pl-5 text-gray-600 space-y-1">
              <li><strong>Acesso:</strong> saber quais dados seus estão armazenados</li>
              <li><strong>Correção:</strong> solicitar correção de dados incorretos</li>
              <li><strong>Anonimização ou exclusão:</strong> solicitar a remoção dos seus dados pessoais</li>
              <li><strong>Portabilidade:</strong> receber seus dados em formato estruturado</li>
              <li><strong>Revogação:</strong> retirar consentimento a qualquer momento</li>
            </ul>
            <p className="text-gray-600 mt-2">
              Para exercer seus direitos, entre em contato pelo e-mail:{' '}
              <a href="mailto:privacidade@skillcerto.com.br" className="text-blue-600 hover:underline">
                privacidade@skillcerto.com.br
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-2">7. Retenção dos dados</h2>
            <p className="text-gray-600">
              Os dados são mantidos pelo período necessário ao processo seletivo ou por até
              <strong> 2 anos</strong> após o último contato, salvo obrigação legal ou solicitação
              de exclusão pelo titular.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-2">8. Contato do Encarregado (DPO)</h2>
            <p className="text-gray-600">
              Dúvidas sobre esta política ou sobre o tratamento de dados:{' '}
              <a href="mailto:privacidade@skillcerto.com.br" className="text-blue-600 hover:underline">
                privacidade@skillcerto.com.br
              </a>
            </p>
          </section>

        </div>

        <div className="mt-10 pt-6 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">SKILL HUNTER ATS · Skill Certo · 2026</p>
          <a href="/login" className="text-xs text-blue-600 hover:underline">← Voltar ao sistema</a>
        </div>
      </div>
    </div>
  )
}
