// src/components/Navbar.js

import React, { useState } from 'react'; // Importe o useState
import { Link, NavLink } from 'react-router-dom';
import styled from 'styled-components';

const Nav = styled.nav`
  background: var(--dark-grey);
  padding: 0 20px;
  border-bottom: 2px solid var(--orange);
  display: flex;
  justify-content: center;
  align-items: center;
  height: 70px;
  position: relative; /* Adicionado para o menu mobile */
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
    background: var(--dark-grey);
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

const StyledNavLink = styled(NavLink)`
  color: var(--light-grey);
  font-weight: 700;
  font-size: 1rem;
  padding-bottom: 5px;

  &.active {
    color: var(--orange);
    border-bottom: 2px solid var(--orange);
  }

  @media (max-width: 768px) {
    border-bottom: none; /* Remove a borda no mobile */
    &.active {
      border-bottom: none;
    }
  }
`;

function Navbar() {
  // Estado para controlar a abertura/fechamento do menu mobile
  const [isOpen, setIsOpen] = useState(false);

  // Função para fechar o menu ao clicar em um link (útil no mobile)
  const closeMobileMenu = () => setIsOpen(false);

  return (
    <Nav>
      <NavContainer>
        <Logo to="/" onClick={closeMobileMenu}>MARCOS LOBO</Logo>
        <Hamburger onClick={() => setIsOpen(!isOpen)}>
          <span />
          <span />
          <span />
        </Hamburger>
        <NavMenu isOpen={isOpen}>
          <NavItem>
            <StyledNavLink to="/" end onClick={closeMobileMenu}>Início</StyledNavLink>
          </NavItem>
          <NavItem>
            <StyledNavLink to="/blog" onClick={closeMobileMenu}>Blog de Análises</StyledNavLink>
          </NavItem>
        </NavMenu>
      </NavContainer>
    </Nav>
  );
}

export default Navbar;