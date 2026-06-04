import React from 'react';
import styled from 'styled-components';
import PostCard from '../components/PostCard';
import { copaPosts } from '../blog-data/copa2026';

const PageHeader = styled.header`
  padding: 80px 20px;
  text-align: center;
  background: linear-gradient(135deg, #0a1f1d 0%, #0d3822 50%, #071c10 100%);
  border-bottom: 3px solid #ffd700; /* Dourado */
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle, rgba(255,215,0,0.1) 0%, transparent 70%);
    pointer-events: none;
  }
`;

const PageTitle = styled.h1`
  font-size: 3.5rem;
  color: #ffd700; /* Dourado */
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.4);
  display: inline-block;
  padding-bottom: 10px;
  font-family: 'Outfit', sans-serif;
  margin-bottom: 10px;

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const PageSubtitle = styled.p`
  color: var(--white);
  font-size: 1.2rem;
  max-width: 600px;
  margin: 0 auto;
  opacity: 0.9;
  line-height: 1.6;

  span {
    color: #ffd700;
    font-weight: bold;
  }
`;

const PostGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 30px;
  margin-top: 40px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px;
  color: var(--light-grey);
  font-size: 1.2rem;
  border: 1px dashed rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  margin-top: 40px;
`;

function CopaPage() {
  return (
    <>
      <PageHeader>
        <PageTitle>COPA DO MUNDO 2026</PageTitle>
        <PageSubtitle>
          Análises táticas, desempenho de atletas e estudos aprofundados das seleções que disputarão o maior espetáculo da Terra.
        </PageSubtitle>
      </PageHeader>
      <div className="container" style={{ paddingBottom: '60px' }}>
        {copaPosts.length === 0 ? (
          <EmptyState>Nenhuma análise foi publicada ainda. Fique atento!</EmptyState>
        ) : (
          <PostGrid>
            {copaPosts.map(post => (
              <PostCard
                key={post.slug}
                slug={post.slug}
                title={post.title}
                category={post.category}
                flagCode={post.flagCode}
              />
            ))}
          </PostGrid>
        )}
      </div>
    </>
  );
}

export default CopaPage;
