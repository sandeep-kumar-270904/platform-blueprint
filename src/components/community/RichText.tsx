import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Link } from 'react-router-dom';

export const RichText = ({ content }: { content: string }) => {
  // Preprocess mentions to standard markdown links
  const processedContent = content.replace(/(^|\s)@([a-zA-Z0-9_]+)/g, '$1[@$2](/profile/$2)');

  return (
    <div className="rich-text-content">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-pre:bg-muted prose-pre:p-2 prose-pre:rounded-md break-words"
        components={{
          a: ({ node, ...props }) => {
            if (props.href?.startsWith('/profile/')) {
              return <Link to={props.href} className="text-primary font-medium hover:underline">{props.children}</Link>;
            }
            return <a {...props} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{props.children}</a>;
          }
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};
