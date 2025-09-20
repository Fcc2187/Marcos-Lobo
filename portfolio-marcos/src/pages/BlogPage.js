import styled from 'styled-components';
import PostCard from '../components/PostCard';
import { posts } from '../blog-data/posts';

const PageHeader = styled.header`
  padding: 60px 20px;
  text-align: center;
  background: var(--dark-grey);
`;

const PageTitle = styled.h1`
  font-size: 3rem;
  color: var(--white);
  border-bottom: 3px solid var(--orange);
  display: inline-block;
  padding-bottom: 10px;
`;

const PostGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 30px;
`;

function BlogPage() {
  return (
    <>
      <PageHeader>
        <PageTitle>Blog de Análises</PageTitle>
      </PageHeader>
      <div className="container">
        <PostGrid>
          {posts.map(post => (
            <PostCard
              key={post.slug}
              slug={post.slug}
              title={post.title}
              category={post.category}
            />
          ))}
        </PostGrid>
      </div>
    </>
  );
}

export default BlogPage;