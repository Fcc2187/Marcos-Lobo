// Os slugs devem ser únicos
export const posts = [
  {
    slug: 'analise-de-scouts-decisivos-no-cartola',
    title: 'Scouts Decisivos: Como a análise de dados brutos pode prever o sucesso no Cartola FC',
    category: 'Análise Esportiva',
    date: '15 de Setembro de 2025',
    author: 'Marcos Lobo',
    content: `
      <p>A análise de scouts no futebol fantasy vai muito além de simplesmente olhar os números finais. É preciso mergulhar nos dados brutos para encontrar os verdadeiros indicadores de performance, os chamados "scouts silenciosos".</p>
      <h2>A importância dos Desarmes (DS) vs. Faltas Cometidas (FC)</h2>
      <p>Um erro comum é valorizar apenas o número de desarmes. No entanto, a relação DS/FC é um indicador muito mais poderoso da eficiência de um defensor. Jogadores com alta taxa de desarmes e baixo número de faltas não só pontuam mais, como também evitam cartões que negativam a pontuação. Uma análise de regressão simples pode mostrar a correlação direta entre um bom ratio DS/FC e a média de pontos de um zagueiro ao longo do campeonato.</p>
      <h2>Finalizações para Fora (FF): Um indicador de volume ofensivo</h2>
      <p>Muitos ignoram a Finalização para Fora (FF), pois ela não gera pontos diretos. Contudo, este é um dos scouts mais importantes para prever gols e assistências futuras. Um atacante com alto volume de FF está constantemente se posicionando em zonas de perigo. A conversão de chutes em gols pode variar, mas a oportunidade gerada é um dado consistente. Cruzar o dado de FF com a posição média do jogador em campo (mapa de calor) pode revelar atletas prestes a ter uma rodada de "explosão" de pontos.</p>
    `
  },
  {
    slug: 'mito-da-formacao-tatica-nos-dados',
    title: 'O Mito da Formação Tática: Uma análise baseada em dados sobre o impacto real dos esquemas táticos',
    category: 'Análise Esportiva',
    date: '10 de Setembro de 2025',
    author: 'Marcos Lobo',
    content: `
      <p>No mundo do futebol, discute-se à exaustão sobre as vantagens do 4-3-3 sobre o 3-5-2. Mas qual o impacto real disso em dados mensuráveis? Nesta análise, investigamos os números de duas temporadas do Brasileirão para entender as correlações.</p>
      <h2>Gols Esperados (xG) por formação</h2>
      <p>Analisando o xG (Expected Goals) gerado e sofrido, notamos que a formação tática, por si só, tem uma correlação mais fraca com o sucesso do que a qualidade individual e o entrosamento dos jogadores. Times que alternam entre 3 e 4 defensores, por exemplo, não apresentaram variações estatisticamente significantes no xG sofrido, sugerindo que a execução e o perfil dos atletas são mais importantes que o desenho no papel.</p>
    `
  },
  {
    slug: '3-dashboards-essenciais-para-ecommerce',
    title: 'Business Intelligence no E-commerce: 3 dashboards essenciais que todo gestor deveria usar',
    category: 'Business Intelligence',
    date: '05 de Setembro de 2025',
    author: 'Marcos Lobo',
    content: `
      <p>Gerenciar um e-commerce sem dados é como navegar sem bússola. A seguir, apresento três modelos de dashboards em Power BI/Tableau que são cruciais para qualquer operação online.</p>
      <h2>1. Dashboard de Saúde da Operação (Visão Diária)</h2>
      <p>KPIs essenciais: Vendas por hora, taxa de conversão, ticket médio, carrinhos abandonados e principais produtos vendidos. Este painel permite identificar rapidamente anomalias na operação.</p>
      <h2>2. Dashboard de Análise de Cohort (Visão Mensal)</h2>
      <p>Este dashboard agrupa clientes por mês de primeira compra e acompanha seu comportamento ao longo do tempo. Ele é fundamental para entender a retenção e o LTV (Lifetime Value), mostrando se suas estratégias de fidelização estão funcionando.</p>
    `
  }
];