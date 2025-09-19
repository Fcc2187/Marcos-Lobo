// src/pages/PostPage.js

import React from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
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
      <PostHeader>
        <h1>{post.title}</h1>
        <p>Publicado por {post.author} em {post.date}</p>
      </PostHeader>
      <PostBody dangerouslySetInnerHTML={{ __html: post.content }} />
    </PostContainer>
  );
}

export default PostPage;