import React from 'react';
import styled from 'styled-components';

const FooterContainer = styled.footer`
  background: var(--dark-grey);
  color: var(--light-grey);
  text-align: center;
  padding: 30px 20px;
  margin-top: 60px;
  border-top: 2px solid var(--orange);
`;

function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <FooterContainer>
      <p>&copy; {currentYear} Marcos Lobo. Todos os direitos reservados.</p>
    </FooterContainer>
  );
}

export default Footer;