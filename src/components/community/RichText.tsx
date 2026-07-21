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
            
            const ytMatch = props.href?.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
            if (ytMatch && ytMatch[1]) {
              return (
                <div className="my-3 overflow-hidden rounded-lg border bg-background">
                  <iframe
                    width="100%"
                    height="315"
                    src={`https://www.youtube.com/embed/${ytMatch[1]}`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              );
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
