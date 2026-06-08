import Link from 'next/link';
import styled from 'styled-components';

const Card = styled.div`
  background: var(--dark-grey);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  border: 1px solid rgba(255, 255, 255, 0.05);

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0,0,0,0.3);
  }

  &:hover .post-cover {
    transform: scale(1.05);
  }
`;

const CoverContainer = styled.div`
  width: 100%;
  height: 200px;
  overflow: hidden;
  position: relative;
  background: #000;
`;

const CoverImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease-in-out;
  opacity: 0.9;
`;

const CardContent = styled.div`
  padding: 25px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
`;

const Category = styled.span`
  background-color: var(--orange);
  color: var(--black);
  padding: 4px 8px;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 4px;
  margin-bottom: 15px;
  align-self: flex-start;
`;

const PostTitle = styled.h3`
  color: var(--white);
  margin-bottom: 10px;
  font-size: 1.4rem;
  line-height: 1.3;
`;

const PostSubtitle = styled.p`
  color: var(--light-grey);
  font-size: 0.95rem;
  line-height: 1.5;
  flex-grow: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 20px;
`;

const ReadMoreLink = styled(Link)`
  color: var(--orange);
  font-weight: bold;
  display: inline-block;
  margin-top: auto;
`;

function PostCard({ title, category, slug, flagCode, subtitle, coverImage }) {
  return (
    <Card>
      {coverImage && (
        <CoverContainer>
          <CoverImage src={coverImage} alt={title} className="post-cover" loading="lazy" />
        </CoverContainer>
      )}
      <CardContent>
        <Category>{category}</Category>
        <PostTitle style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {title}
          {flagCode && (
            <img 
              src={`https://flagcdn.com/w40/${flagCode}.png`} 
              alt="Bandeira" 
              loading="lazy"
              style={{ 
                height: '18px', 
                borderRadius: '2px', 
                boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                display: 'inline-block'
              }} 
            />
          )}
        </PostTitle>
        {subtitle && <PostSubtitle>{subtitle}</PostSubtitle>}
        <ReadMoreLink href={`/post/${slug}`}>Ler Análise Completa →</ReadMoreLink>
      </CardContent>
    </Card>
  );
}

export default PostCard;