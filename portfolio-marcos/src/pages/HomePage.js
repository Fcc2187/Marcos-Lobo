// src/pages/HomePage.js

import React from 'react';
import styled from 'styled-components';
import HeroSection from '../components/HeroSection';
import PostCard from '../components/PostCard';
import { posts } from '../blog-data/posts';
import { Link } from 'react-router-dom';

const LatestPostsSection = styled.section`
  text-align: center;
`;

const SectionTitle = styled.h2`
  font-size: 2.5rem;
  margin-bottom: 40px;
  color: var(--white);

  @media (max-width: 768px) {
    font-size: 2rem; /* Reduz o tamanho da fonte */
  }
`;

const PostGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  text-align: left;
`;

const ViewAllButton = styled(Link)`
  display: inline-block;
  margin-top: 40px;
  padding: 12px 30px;
  background: var(--orange);
  color: var(--black);
  font-weight: 700;
  border-radius: 5px;
  transition: background 0.2s ease;

  &:hover {
    background: #ff8d3b;
    color: var(--black);
  }
`;

function HomePage() {
  const latestPosts = posts.slice(0, 3);

  return (
    <>
      <HeroSection />
      <div className="container">
        <LatestPostsSection>
          <SectionTitle>Últimas Análises</SectionTitle>
          <PostGrid>
            {latestPosts.map(post => (
              <PostCard
                key={post.slug}
                slug={post.slug}
                title={post.title}
                category={post.category}
              />
            ))}
          </PostGrid>
          <ViewAllButton to="/blog">Ver Todas as Análises</ViewAllButton>
        </LatestPostsSection>
      </div>
    </>
  );
}

export default HomePage;