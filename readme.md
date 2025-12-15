# Dashboard de Controle Diabético

**Secretaria Municipal de Saúde do Rio de Janeiro (SMS/RJ)**
**Superintendência de Atenção Primária (SAP)**
**Núcleo de Inteligência e Análise (NIA)**

---

## Sobre o Projeto

O **Monitor de Controle Diabético** é uma ferramenta de inteligência de dados desenvolvida para apoiar a gestão do cuidado de pacientes crônicos — **Diabetes Mellitus** e **Pré-Diabetes** — no contexto da Atenção Primária à Saúde.

A solução transforma dados brutos, extraídos do prontuário eletrônico e de sistemas de regulação, em **visualizações acionáveis**, permitindo intervenções rápidas e orientadas por evidência em três níveis complementares:

* **Gestão**
* **Operação territorial**
* **Assistência clínica**

---

## Arquitetura da Informação

A aplicação foi estruturada com base no princípio da **usabilidade contextual**, organizando a experiência em três módulos distintos, cada um direcionado a um perfil específico de utilizador.

### 1. Visão Geral — Gestão

Foco em **Saúde Populacional**. Permite que gestores e supervisores técnicos monitorem a cobertura assistencial, a prevalência de fatores de risco e a distribuição demográfica do território.

**Indicadores-chave:**

* Vazio assistencial (mais de 6 meses sem atendimento)
* Histograma de recência de consultas
* Distribuição por raça/cor

---

### 2. Busca Ativa — Operacional

Foco na **ação territorial**. Ferramenta de trabalho para Agentes Comunitários de Saúde (ACS), voltada ao resgate de pacientes que perderam o vínculo com a unidade.

**Funcionalidade principal:**

* Listagem nominal ordenada de forma decrescente por dias de ausência
* Alertas visuais para atrasos considerados críticos

---

### 3. Risco Clínico — Assistencial

Foco na **priorização clínica**. Utiliza um algoritmo de estratificação de risco para apoiar médicos e enfermeiros na organização de agendas e no acompanhamento de pacientes mais vulneráveis.

**Algoritmo de priorização (pontuação aditiva):**

* Diabetes Mellitus: +2
* Obesidade: +1
* Tabagismo: +1
* Idade superior a 60 anos: +1

---

## Especificações Técnicas

O projeto adota uma arquitetura **client-side leve**, priorizando portabilidade, simplicidade de implantação e compatibilidade com computadores institucionais que possuem restrições para instalação de software adicional.

---

## Tecnologias Utilizadas

| Tecnologia            | Função no Projeto                                                                     |
| --------------------- | ------------------------------------------------------------------------------------- |
| **HTML5**             | Estruturação semântica das interfaces                                                 |
| **Tailwind CSS**      | Estilização utilitária, design responsivo e identidade visual institucional           |
| **JavaScript (ES6+)** | Processamento de dados, manipulação do DOM e leitura de arquivos CSV (FileReader API) |
| **Chart.js**          | Renderização de gráficos interativos e performáticos                                  |
| **Lucide Icons**      | Ícones vetoriais leves em SVG para a interface do utilizador                          |

---

## Como Foi Construído

A aplicação opera de forma **estática (serverless)**, sem necessidade de backend dedicado. Todo o fluxo de dados ocorre no navegador do utilizador.

**Fluxo de funcionamento:**

1. **Ingestão de dados**
   Leitura de arquivos `.csv` locais por meio da API `FileReader` do JavaScript.

2. **Processamento**
   Parsing do CSV, tipagem de dados e cálculo de métricas em tempo real, como:

   * Diferença de dias entre datas
   * Cálculo de vazios assistenciais
   * Soma de escores de risco clínico

3. **Renderização**
   Alimentação dinâmica de KPIs e gráficos interativos utilizando o Chart.js.

---

## Guia de Instalação e Execução

Por se tratar de uma aplicação estática, **não há necessidade de compilação** nem de instalação de dependências via `npm` ou `yarn`.

### Pré-requisitos

* Navegador web moderno (Chrome, Edge ou Firefox)
* Arquivo de dados estruturado em formato `.csv`, seguindo o padrão do e-SUS/SISREG

### Execução

1. Baixe os arquivos do projeto:

   * `index.html`
   * `busca_ativa.html`
   * `risco_clinico.html`

2. Mantenha o arquivo de dados (`dados.csv`) na mesma pasta ou disponível para upload manual.

3. Abra o arquivo `index.html` no navegador.

4. Utilize o botão **CARREGAR CSV**, localizado no canto superior direito, para alimentar o dashboard com os dados atualizados.

---

## Integração com Business Intelligence (BI)

Além do protótipo em HTML, o projeto disponibiliza a **lógica de negócio** necessária para implementação em ferramentas de Business Intelligence, como o **Power BI**, por meio do mapeamento de Perguntas e Respostas (Q&A).

Os indicadores visuais foram concebidos para serem **facilmente replicáveis via linguagem natural**, permitindo a migração gradual ou total da solução para ambientes corporativos de BI, conforme a maturidade analítica da organização.

---

## Considerações Finais

O Dashboard de Controle Diabético foi concebido como uma solução pragmática, escalável e alinhada às necessidades reais da Atenção Primária, promovendo o uso qualificado de dados como instrumento de gestão, cuidado e tomada de decisão clínica.
