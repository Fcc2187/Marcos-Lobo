import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { Helmet } from 'react-helmet-async';
import { posts } from '../blog-data/posts';

const PostContainer = styled.article`
  max-width: 800px;
  margin: 40px auto;
  padding: 20px;
`;

const PostHeader = styled.header`
  text-align: center;
  margin-bottom: 40px;

  h1 {
    font-size: 3rem;
    color: var(--orange);
    line-height: 1.2;
    margin-bottom: 15px;

    @media (max-width: 768px) {
      font-size: 2.2rem; /* Reduz o tamanho da fonte */
    }
  }

  p {
    color: var(--light-grey);
    font-style: italic;
  }
`;

const PostBody = styled.div`
  font-size: 1.1rem;
  line-height: 1.9;
  color: var(--white);

  p, ul, ol {
    margin-bottom: 1.5rem;
  }

  h2 {
    font-size: 1.8rem;
    color: var(--orange);
    margin-top: 2.5rem;
    margin-bottom: 1.2rem;
    border-left: 4px solid var(--orange);
    padding-left: 15px;

    @media (max-width: 768px) {
      font-size: 1.5rem; /* Reduz o tamanho da fonte */
    }
  }

  strong {
    color: #ffc9a3;
  }
`;
const PostSubtitle = styled.h2`
  font-size: 1.4rem;
  color: var(--orange); /* Cor laranja, como solicitado */
  font-weight: 400; /* Deixa a fonte mais leve que a do título */
  line-height: 1.5;
  margin-bottom: 15px;

  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 50px;
  font-size: 1.5rem;
`;

function PostPage() {
  const { slug } = useParams();
  const post = posts.find(p => p.slug === slug);

  if (!post) {
    return <ErrorMessage>Post não encontrado!</ErrorMessage>;
  }

  return (
    <PostContainer>
      <Helmet>
        <title>{post.title} - Marcos Lobo</title>
        <meta name="description" content={post.subtitle || `Leia a análise de ${post.title} por Marcos Lobo.`} />
      </Helmet>
      <PostHeader>
        <h1>
          {post.title}
          {post.flagCode && (
            <img 
              loading="lazy"
              src={`https://flagcdn.com/w40/${post.flagCode}.png`} 
              alt="Bandeira" 
              style={{ 
                verticalAlign: 'middle', 
                marginLeft: '12px', 
                height: '24px', 
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                marginBottom: '4px'
              }} 
            />
          )}
        </h1>
        <PostSubtitle>{post.subtitle}</PostSubtitle>
        <p style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.7)', marginBottom: '25px', textAlign: 'center', fontSize: '0.95rem' }}>
          Publicado por <strong style={{ color: 'var(--orange)' }}>Marcos Lobo</strong> e editado por <strong style={{ color: 'var(--orange)' }}>Felipe Caminha</strong> em {post.date}
        </p>
      </PostHeader>
      <PostBody dangerouslySetInnerHTML={{ __html: post.content }} />
    </PostContainer>
  );
}

export default PostPage;