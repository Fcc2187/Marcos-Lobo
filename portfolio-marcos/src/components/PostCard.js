import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const Card = styled.div`
  background: var(--dark-grey);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  border-left: 4px solid transparent;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0,0,0,0.2);
    border-left-color: var(--orange);
  }
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
  flex-grow: 1;
`;

const ReadMoreLink = styled(Link)`
  color: var(--orange);
  font-weight: bold;
  margin-top: 15px;
  display: inline-block;
`;

function PostCard({ title, category, slug }) {
  return (
    <Card>
      <CardContent>
        <Category>{category}</Category>
        <PostTitle>{title}</PostTitle>
        <ReadMoreLink to={`/post/${slug}`}>Ler Análise Completa →</ReadMoreLink>
      </CardContent>
    </Card>
  );
}

export default PostCard;