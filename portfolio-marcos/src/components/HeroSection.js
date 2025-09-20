import styled from 'styled-components';

const HeroContainer = styled.div`
  background: var(--black);
  padding: 120px 20px;
  text-align: center;
  border-bottom: 5px solid var(--orange);

  @media (max-width: 768px) {
    padding: 80px 20px; /* Reduz o espaçamento vertical */
  }
`;

const Title = styled.h1`
  font-size: 3.8rem;
  font-weight: 900;
  margin-bottom: 1rem;
  color: var(--white);

  @media (max-width: 768px) {
    font-size: 2.5rem; /* Reduz o tamanho da fonte */
  }
`;

const Subtitle = styled.p`
  font-size: 1.3rem;
  max-width: 750px;
  margin: 0 auto;
  color: var(--light-grey);
  line-height: 1.6;

  @media (max-width: 768px) {
    font-size: 1.1rem; /* Reduz o tamanho da fonte */
  }
`;

function HeroSection() {
  return (
    <HeroContainer>
      <Title>A Essência do Jogo em Análise</Title>
    <Subtitle>
 <Subtitle>
  Olá, eu sou Marcos Lobo. Analista de futebol apaixonado por traduzir o que acontece em campo em análises táticas e de desempenho.
  As ideias deste blog nascem da observação prática do jogo, uma abordagem que aprimorei como analista principal no projeto <strong>Improváveis do Cartola</strong>.
</Subtitle>
    </Subtitle>
    </HeroContainer>
  );
}

export default HeroSection;