import styled from 'styled-components';
import HeroSection from '../components/HeroSection';
import PostCard from '../components/PostCard';
import { posts } from '../blog-data/posts';
import { copaPosts } from '../blog-data/copa2026';
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

const CopaSection = styled.section`
  text-align: center;
  margin-bottom: 60px;
  padding: 45px 30px;
  background: linear-gradient(135deg, rgba(10, 31, 29, 0.8) 0%, rgba(7, 28, 16, 0.9) 100%);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
`;

const CopaTitle = styled(SectionTitle)`
  color: #ffd700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
  margin-bottom: 10px;
`;

const CopaSubtitle = styled.p`
  color: var(--light-grey);
  margin-bottom: 40px;
  font-size: 1.1rem;
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

const CopaViewButton = styled(ViewAllButton)`
  background: #ffd700;
  color: #071c10;
  margin-top: 30px;

  &:hover {
    background: #ffea70;
    color: #071c10;
  }
`;

function HomePage() {
  const latestStandardPosts = posts.filter(post => !post.isWorldCup).slice(0, 3);
  const featuredCopaPosts = copaPosts.slice(0, 3);

  return (
    <>
      <HeroSection />
      <div className="container">
        {featuredCopaPosts.length > 0 && (
          <CopaSection>
            <CopaTitle>COPA DO MUNDO 2026</CopaTitle>
            <CopaSubtitle>Confira as análises especiais das seleções da Copa</CopaSubtitle>
            <PostGrid>
              {featuredCopaPosts.map(post => (
                <PostCard
                  key={post.slug}
                  slug={post.slug}
                  title={post.title}
                  category={post.category}
                  flagCode={post.flagCode}
                />
              ))}
            </PostGrid>
            <CopaViewButton to="/copa2026">Ver Todas as Análises da Copa</CopaViewButton>
          </CopaSection>
        )}

        <LatestPostsSection>
          <SectionTitle>Últimas Análises</SectionTitle>
          <PostGrid>
            {latestStandardPosts.map(post => (
              <PostCard
                key={post.slug}
                slug={post.slug}
                title={post.title}
                category={post.category}
                flagCode={post.flagCode}
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