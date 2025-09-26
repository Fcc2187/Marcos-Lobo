import styled from 'styled-components';
import { FaInstagram, FaTwitter } from 'react-icons/fa';

const FooterContainer = styled.footer`
  background: var(--dark-grey);
  color: var(--light-grey);
  text-align: center;
  padding: 30px 20px;
  margin-top: 60px;
  border-top: 2px solid var(--orange);
`;

const ContactInfo = styled.div`
  margin-bottom: 20px;

  p {
    margin: 8px 0;
  }
`;

const SocialLinks = styled.div`
  margin-bottom: 20px;

  a {
    color: var(--light-grey);
    font-size: 28px;
    margin: 0 15px;
    transition: color 0.3s ease;

    &:hover {
      color: var(--orange);
    }
  }
`;

const AnalysisSchedule = styled.p`
  font-style: italic;
  margin-bottom: 20px;
`;

const Copyright = styled.p`
  font-size: 14px;
`;

function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <FooterContainer>
      <ContactInfo>
        <p>Contato: +55 11 95204-0515</p>
        <p>E-mail: marcoslobofonseca@gmail.com  testes</p>
      </ContactInfo>

      <SocialLinks>
        <a href="https://www.instagram.com/improvcartola/" target="_blank" rel="noopener noreferrer" aria-label="Instagram dos Improváveis">
          <FaInstagram />
        </a>
        <a href="https://x.com/improvcartola" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter) dos Improváveis">
          <FaTwitter />
        </a>
      </SocialLinks>

      <AnalysisSchedule>
        Análises todas as sextas-feiras, às 20:00.
      </AnalysisSchedule>

      <Copyright>
        &copy; {currentYear} Marcos Lobo. Todos os direitos reservados.
      </Copyright>
    </FooterContainer>
  );
}

export default Footer;