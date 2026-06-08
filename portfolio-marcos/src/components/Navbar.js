import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styled from 'styled-components';

const Nav = styled.nav`
  background: rgba(18, 18, 18, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: 0 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  height: 70px;
  position: sticky;
  top: 0;
  z-index: 1000;
`;

const NavContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 1100px;
  max-width: 100%;
`;

const Logo = styled(Link)`
  color: var(--white);
  font-size: 1.5rem;
  font-weight: 900;
  z-index: 10; /* Garante que o logo fique na frente do menu mobile */
`;

// --- Estilos para o Menu Hambúrguer ---
const Hamburger = styled.div`
  display: none; /* Escondido por padrão em telas grandes */
  flex-direction: column;
  cursor: pointer;
  z-index: 10;

  span {
    height: 3px;
    width: 25px;
    background: var(--white);
    margin-bottom: 4px;
    border-radius: 5px;
  }

  @media (max-width: 768px) {
    display: flex; /* Aparece em telas mobile */
  }
`;

// --- Ajustes no Menu Principal ---
const NavMenu = styled.ul`
  display: flex;
  list-style: none;
  gap: 30px;

  @media (max-width: 768px) {
    /* Em telas mobile, o menu se torna uma coluna vertical */
    flex-direction: column;
    background: rgba(18, 18, 18, 0.95);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    position: absolute;
    top: 70px;
    left: 0;
    width: 100%;
    text-align: center;
    padding: 20px 0;
    /* Controla a visibilidade do menu */
    display: ${({ isOpen }) => (isOpen ? 'flex' : 'none')};
  }
`;

const NavItem = styled.li`
  @media (max-width: 768px) {
    width: 100%;
    padding: 10px 0;
  }
`;

const StyledNavLink = styled(Link)`
  color: var(--light-grey);
  font-weight: 700;
  font-size: 1rem;
  padding-bottom: 5px;
  transition: color 0.2s ease, text-shadow 0.2s ease;

  &:hover {
    color: var(--white);
  }

  ${({ $isActive }) => $isActive && `
    color: var(--white);
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
    border-bottom: 2px solid var(--white);
  `}

  @media (max-width: 768px) {
    border-bottom: none; /* Remove a borda no mobile */
    ${({ $isActive }) => $isActive && `
      border-bottom: none;
    `}
  }
`;

function Navbar() {
  // Estado para controlar a abertura/fechamento do menu mobile
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  // Função para fechar o menu ao clicar em um link (útil no mobile)
  const closeMobileMenu = () => setIsOpen(false);

  return (
    <Nav>
      <NavContainer>
        <Logo href="/" onClick={closeMobileMenu}>MARCOS LOBO</Logo>
        <Hamburger onClick={() => setIsOpen(!isOpen)}>
          <span />
          <span />
          <span />
        </Hamburger>
        <NavMenu isOpen={isOpen}>
          <NavItem>
            <StyledNavLink href="/" $isActive={router.pathname === '/'} onClick={closeMobileMenu}>Início</StyledNavLink>
          </NavItem>
          <NavItem>
            <StyledNavLink href="/copa2026" $isActive={router.pathname === '/copa2026'} onClick={closeMobileMenu}>Copa 2026 🏆</StyledNavLink>
          </NavItem>
          <NavItem>
            <StyledNavLink href="/brasileirao2026" $isActive={router.pathname === '/brasileirao2026'} onClick={closeMobileMenu}>
              Brasileirão 2026 <img src="https://flagcdn.com/w20/br.png" alt="🇧🇷" style={{ verticalAlign: 'middle', height: '14px', marginLeft: '4px', borderRadius: '2px' }} />
            </StyledNavLink>
          </NavItem>
          <NavItem>
            <StyledNavLink href="/blog" $isActive={router.pathname === '/blog'} onClick={closeMobileMenu}>Blog de Análises</StyledNavLink>
          </NavItem>
        </NavMenu>
      </NavContainer>
    </Nav>
  );
}

export default Navbar;