import styled from 'styled-components';
import { FaTwitter, FaInstagram } from 'react-icons/fa';

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
      <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <ContactInfo style={{ marginBottom: 0 }}>
          <h4 style={{ marginBottom: '10px', color: 'var(--orange)', fontSize: '1.1rem' }}>Marcos Lobo</h4>
          <p>Telefone: +55 11 95204-0515</p>
          <p>E-mail: marcoslobofonseca@gmail.com</p>
        </ContactInfo>
        
        <ContactInfo style={{ marginBottom: 0 }}>
          <h4 style={{ marginBottom: '10px', color: 'var(--orange)', fontSize: '1.1rem' }}>Felipe Caminha</h4>
          <p>Telefone: (81) 99104-5475</p>
          <p>E-mail: caminha2103@gmail.com</p>
        </ContactInfo>
      </div>

      <SocialLinks>
        <a href="https://x.com/improvcartola" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter) dos Improváveis">
          <FaTwitter />
        </a>
        <a href="https://instagram.com/fcaminha_" target="_blank" rel="noopener noreferrer" aria-label="Instagram dos Improváveis">
          <FaInstagram />
        </a>
      </SocialLinks>

      <AnalysisSchedule>
        Análises Semanais
      </AnalysisSchedule>

      <Copyright>
        &copy; {currentYear} Marcos Lobo. Todos os direitos reservados.
      </Copyright>
    </FooterContainer>
  );
}

export default Footer;