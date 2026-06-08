import styled from 'styled-components';
import PostCard from '../components/PostCard';
import { brasileiraoPosts } from '../blog-data/brasileirao2026';

const PageHeader = styled.header`
  padding: 80px 20px;
  text-align: center;
  background: linear-gradient(135deg, #0a2113 0%, #0f4024 50%, #092e18 100%);
  border-bottom: 3px solid #ffdf00; /* Amarelo Brasil */
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle, rgba(255,223,0,0.08) 0%, transparent 70%);
    pointer-events: none;
  }
`;

const PageTitle = styled.h1`
  font-size: 3.5rem;
  color: #ffdf00; /* Amarelo Brasil */
  text-shadow: 0 0 10px rgba(255, 223, 0, 0.4);
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
    color: #ffdf00;
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

function BrasileiraoPage() {
  return (
    <>
      <PageHeader>
        <PageTitle>BRASILEIRÃO 2026</PageTitle>
        <PageSubtitle>
          Acompanhe as análises exclusivas e o desempenho dos principais clubes do Campeonato Brasileiro de 2026.
        </PageSubtitle>
      </PageHeader>
      <div className="container" style={{ paddingBottom: '60px' }}>
        {brasileiraoPosts.length === 0 ? (
          <EmptyState>Nenhuma análise foi publicada ainda. Fique atento as próximas análises do campeonato!</EmptyState>
        ) : (
          <PostGrid>
            {brasileiraoPosts.map(post => (
              <PostCard
                key={post.slug}
                slug={post.slug}
                title={post.title}
                category={post.category}
                flagCode={post.flagCode}
                subtitle={post.subtitle}
                coverImage={post.coverImage}
              />
            ))}
          </PostGrid>
        )}
      </div>
    </>
  );
}

export default BrasileiraoPage;
