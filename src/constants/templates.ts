import { DocumentTemplate, MessageTemplate } from '../types/document';

export const DEFAULT_DOCUMENT_TEMPLATES: Omit<DocumentTemplate, 'id' | 'owner_uid' | 'createdAt'>[] = [
  {
    name: 'Procuracao Ad Judicia',
    category: 'proxy',
    isDefault: true,
    variables: ['clientName', 'clientCPF', 'clientAddress', 'lawyerName', 'oabNumber', 'oabState'],
    content: `<html>
<head><style>
body { font-family: 'Times New Roman', serif; font-size: 14pt; line-height: 1.8; margin: 40px; }
h1 { text-align: center; font-size: 16pt; margin-bottom: 30px; }
p { text-align: justify; text-indent: 40px; }
.signature { margin-top: 60px; text-align: center; }
.line { border-top: 1px solid #000; width: 300px; margin: 0 auto; }
</style></head>
<body>
<h1>PROCURACAO AD JUDICIA</h1>

<p>Pelo presente instrumento particular de procuracao, <strong>{{clientName}}</strong>, inscrito(a) no CPF sob o n. {{clientCPF}}, residente e domiciliado(a) em {{clientAddress}}, nomeia e constitui seu(sua) bastante procurador(a) o(a) advogado(a) <strong>{{lawyerName}}</strong>, inscrito(a) na OAB/{{oabState}} sob o n. {{oabNumber}}, com escritorio profissional situado na [endereco do escritorio], a quem confere amplos e gerais poderes para o foro em geral, conforme o art. 105 do Codigo de Processo Civil, podendo propor acoes contra quem de direito, bem como contestar, recorrer, transigir, desistir, dar e receber quitacao, firmar compromissos, substabelecer com ou sem reservas, e praticar todos os demais atos necessarios ao fiel cumprimento do presente mandato.</p>

<div class="signature">
<p>[Cidade], [Data]</p>
<br><br>
<div class="line"></div>
<p>{{clientName}}</p>
</div>
</body>
</html>`,
  },
  {
    name: 'Contrato de Honorarios Advocaticios',
    category: 'contract',
    isDefault: true,
    variables: ['clientName', 'clientCPF', 'lawyerName', 'oabNumber', 'oabState', 'totalValue', 'installments', 'caseDescription'],
    content: `<html>
<head><style>
body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; margin: 40px; }
h1 { text-align: center; font-size: 14pt; margin-bottom: 30px; }
h2 { font-size: 12pt; margin-top: 20px; }
p { text-align: justify; }
.clause { margin-bottom: 15px; }
.signature { margin-top: 40px; }
.line { border-top: 1px solid #000; width: 250px; display: inline-block; margin-top: 40px; }
</style></head>
<body>
<h1>CONTRATO DE PRESTACAO DE SERVICOS ADVOCATICIOS</h1>

<div class="clause">
<h2>CONTRATANTE:</h2>
<p><strong>{{clientName}}</strong>, CPF: {{clientCPF}}</p>
</div>

<div class="clause">
<h2>CONTRATADO(A):</h2>
<p><strong>{{lawyerName}}</strong>, OAB/{{oabState}} n. {{oabNumber}}</p>
</div>

<div class="clause">
<h2>CLAUSULA 1 - DO OBJETO</h2>
<p>O(A) CONTRATADO(A) se compromete a prestar servicos advocaticios referentes a: {{caseDescription}}.</p>
</div>

<div class="clause">
<h2>CLAUSULA 2 - DOS HONORARIOS</h2>
<p>O valor total dos honorarios sera de {{totalValue}}, a ser pago em {{installments}} parcela(s).</p>
</div>

<div class="clause">
<h2>CLAUSULA 3 - DAS OBRIGACOES</h2>
<p>O(A) CONTRATADO(A) se obriga a manter o(a) CONTRATANTE informado(a) sobre o andamento do processo, agindo com zelo, diligencia e etica profissional.</p>
</div>

<div class="clause">
<h2>CLAUSULA 4 - DO FORO</h2>
<p>Fica eleito o foro da Comarca de [Cidade] para dirimir quaisquer duvidas oriundas do presente contrato.</p>
</div>

<div class="signature">
<p>[Cidade], [Data]</p>
<br>
<div class="line"></div>
<p>CONTRATANTE</p>
<br>
<div class="line"></div>
<p>CONTRATADO(A)</p>
</div>
</body>
</html>`,
  },
  {
    name: 'Substabelecimento com Reservas',
    category: 'proxy',
    isDefault: true,
    variables: ['lawyerName', 'oabNumber', 'oabState', 'newLawyerName', 'newOabNumber', 'newOabState', 'clientName'],
    content: `<html>
<head><style>
body { font-family: 'Times New Roman', serif; font-size: 14pt; line-height: 1.8; margin: 40px; }
h1 { text-align: center; font-size: 16pt; margin-bottom: 30px; }
p { text-align: justify; text-indent: 40px; }
.signature { margin-top: 60px; text-align: center; }
.line { border-top: 1px solid #000; width: 300px; margin: 0 auto; }
</style></head>
<body>
<h1>SUBSTABELECIMENTO COM RESERVAS</h1>

<p>Pelo presente instrumento, <strong>{{lawyerName}}</strong>, advogado(a) inscrito(a) na OAB/{{oabState}} sob o n. {{oabNumber}}, na qualidade de procurador(a) de <strong>{{clientName}}</strong>, substabelece, COM RESERVAS DE IGUAIS PODERES, ao(a) advogado(a) <strong>{{newLawyerName}}</strong>, inscrito(a) na OAB/{{newOabState}} sob o n. {{newOabNumber}}, todos os poderes que lhe foram conferidos na procuracao outorgada pelo(a) referido(a) mandante.</p>

<div class="signature">
<p>[Cidade], [Data]</p>
<br><br>
<div class="line"></div>
<p>{{lawyerName}}</p>
<p>OAB/{{oabState}} {{oabNumber}}</p>
</div>
</body>
</html>`,
  },
  {
    name: 'Declaracao de Hipossuficiencia',
    category: 'petition',
    isDefault: true,
    variables: ['clientName', 'clientCPF', 'clientAddress'],
    content: `<html>
<head><style>
body { font-family: 'Times New Roman', serif; font-size: 14pt; line-height: 1.8; margin: 40px; }
h1 { text-align: center; font-size: 16pt; margin-bottom: 30px; }
p { text-align: justify; text-indent: 40px; }
.signature { margin-top: 60px; text-align: center; }
.line { border-top: 1px solid #000; width: 300px; margin: 0 auto; }
</style></head>
<body>
<h1>DECLARACAO DE HIPOSSUFICIENCIA ECONOMICA</h1>

<p>Eu, <strong>{{clientName}}</strong>, inscrito(a) no CPF sob o n. {{clientCPF}}, residente e domiciliado(a) em {{clientAddress}}, DECLARO, para os devidos fins de direito, sob as penas da lei, que nao possuo condicoes financeiras de arcar com as custas processuais e honorarios advocaticios sem prejuizo do sustento proprio e de minha familia, nos termos do art. 98 e seguintes do Codigo de Processo Civil e do art. 5o, inciso LXXIV, da Constituicao Federal.</p>

<p>Declaro, ainda, estar ciente de que a falsidade desta declaracao pode acarretar sancoes civis e criminais, conforme previsto em lei.</p>

<div class="signature">
<p>[Cidade], [Data]</p>
<br><br>
<div class="line"></div>
<p>{{clientName}}</p>
<p>CPF: {{clientCPF}}</p>
</div>
</body>
</html>`,
  },
  {
    name: 'Peticao Inicial Simples',
    category: 'petition',
    isDefault: true,
    variables: ['court', 'branch', 'clientName', 'clientCPF', 'clientAddress', 'lawyerName', 'oabNumber', 'oabState', 'defendant', 'caseType', 'facts', 'legalBasis', 'requests', 'caseValue'],
    content: `<html>
<head><style>
body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; margin: 40px; }
h1 { text-align: center; font-size: 14pt; margin-bottom: 10px; }
h2 { font-size: 12pt; text-transform: uppercase; margin-top: 25px; }
p { text-align: justify; text-indent: 40px; }
.header { text-align: center; margin-bottom: 30px; }
.signature { margin-top: 40px; text-align: center; }
.line { border-top: 1px solid #000; width: 300px; margin: 0 auto; }
</style></head>
<body>
<div class="header">
<p>EXCELENTISSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA {{branch}} - {{court}}</p>
</div>

<br><br>

<p><strong>{{clientName}}</strong>, inscrito(a) no CPF sob o n. {{clientCPF}}, residente e domiciliado(a) em {{clientAddress}}, por seu(sua) advogado(a) infra-assinado(a) (procuracao em anexo), vem, respeitosamente, a presenca de Vossa Excelencia, propor a presente</p>

<h1>{{caseType}}</h1>

<p>em face de <strong>{{defendant}}</strong>, pelos fatos e fundamentos a seguir expostos.</p>

<h2>I - DOS FATOS</h2>
<p>{{facts}}</p>

<h2>II - DO DIREITO</h2>
<p>{{legalBasis}}</p>

<h2>III - DOS PEDIDOS</h2>
<p>{{requests}}</p>

<h2>IV - DO VALOR DA CAUSA</h2>
<p>Da-se a causa o valor de {{caseValue}}.</p>

<p>Nestes termos, pede deferimento.</p>

<div class="signature">
<p>[Cidade], [Data]</p>
<br><br>
<div class="line"></div>
<p>{{lawyerName}}</p>
<p>OAB/{{oabState}} {{oabNumber}}</p>
</div>
</body>
</html>`,
  },
];

export const DEFAULT_MESSAGE_TEMPLATES: Omit<MessageTemplate, 'id' | 'owner_uid' | 'createdAt'>[] = [
  {
    name: 'Boas-vindas',
    category: 'greeting',
    channel: 'whatsapp',
    content:
      'Prezado(a) {{clientName}}, seja bem-vindo(a) ao nosso escritorio. Sou {{lawyerName}} e estou a disposicao para auxiliar no seu caso. Qualquer duvida, estou disponivel neste contato.',
  },
  {
    name: 'Atualizacao processual',
    category: 'update',
    channel: 'whatsapp',
    content:
      'Prezado(a) {{clientName}}, informo que houve uma nova movimentacao no processo n. {{caseNumber}}. Entre em contato para mais detalhes.',
  },
  {
    name: 'Lembrete de audiencia',
    category: 'reminder',
    channel: 'whatsapp',
    content:
      'Prezado(a) {{clientName}}, lembramos que sua audiencia esta agendada para o dia {{date}} as {{time}}. Favor confirmar presenca e trazer os documentos solicitados.',
  },
  {
    name: 'Cobranca gentil',
    category: 'payment',
    channel: 'whatsapp',
    content:
      'Prezado(a) {{clientName}}, verificamos que a parcela com vencimento em {{dueDate}} encontra-se em aberto. Pedimos a gentileza de regularizar o pagamento. Caso ja tenha efetuado, por favor desconsidere esta mensagem.',
  },
  {
    name: 'Reuniao agendada',
    category: 'meeting',
    channel: 'whatsapp',
    content:
      'Prezado(a) {{clientName}}, sua reuniao esta confirmada para o dia {{date}} as {{time}}. Endereco: [endereco do escritorio]. Em caso de impossibilidade, favor comunicar com antecedencia.',
  },
];
