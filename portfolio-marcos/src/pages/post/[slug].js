import Head from 'next/head';
import Link from 'next/link';
import styled from 'styled-components';
import { posts } from '../../blog-data/posts';

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
      font-size: 2.2rem;
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
      font-size: 1.5rem;
    }
  }

  strong {
    color: #ffc9a3;
  }
  
  img {
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  }
`;

const PostSubtitle = styled.h2`
  font-size: 1.4rem;
  color: var(--orange);
  font-weight: 400;
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

const PrevPostLink = styled(Link)`
  display: block;
  background: rgba(255, 255, 255, 0.05);
  padding: 20px;
  border-radius: 8px;
  text-decoration: none;
  margin-top: 60px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: background 0.2s, transform 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateX(-5px);
  }

  span.label {
    color: var(--light-grey);
    font-size: 0.9rem;
    display: block;
    margin-bottom: 5px;
  }
  
  span.title {
    color: var(--orange);
    font-weight: 700;
    font-size: 1.2rem;
    display: block;
  }
`;

export default function PostPage({ post, prevPost }) {
  if (!post) {
    return <ErrorMessage>Post não encontrado!</ErrorMessage>;
  }

  return (
    <PostContainer>
      <Head>
        <title>{post.title} - Marcos Lobo</title>
        <meta name="description" content={post.subtitle || `Leia a análise de ${post.title} por Marcos Lobo.`} />
      </Head>
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

      {prevPost && (
        <PrevPostLink href={`/post/${prevPost.slug}`}>
          <span className="label">⬅️ Análise Anterior</span>
          <span className="title">{prevPost.title}</span>
        </PrevPostLink>
      )}
    </PostContainer>
  );
}

export async function getStaticPaths() {
  const paths = posts.map((post) => ({
    params: { slug: post.slug },
  }));

  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  const currentIndex = posts.findIndex((p) => p.slug === params.slug);
  const post = posts[currentIndex] || null;
  let prevPost = null;

  if (post) {
    const isCopa = post.isWorldCup || post.category.includes('Copa');
    const isBrasileirao = post.isBrasileirao;
    
    // Procura o próximo post na mesma categoria (que no array é o post mais antigo, portanto "Anterior")
    for (let i = currentIndex + 1; i < posts.length; i++) {
      const candidate = posts[i];
      const candidateIsCopa = candidate.isWorldCup || candidate.category.includes('Copa');
      const candidateIsBrasileirao = candidate.isBrasileirao;
      
      let isSameCategory = false;
      if (isCopa && candidateIsCopa) {
        isSameCategory = true;
      } else if (isBrasileirao && candidateIsBrasileirao) {
        isSameCategory = true;
      } else if (!isCopa && !isBrasileirao && !candidateIsCopa && !candidateIsBrasileirao) {
        isSameCategory = true;
      }

      if (isSameCategory) {
        prevPost = {
          title: candidate.title,
          slug: candidate.slug,
        };
        break;
      }
    }
  }

  return {
    props: {
      post,
      prevPost,
    },
  };
}