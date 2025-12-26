"use client";

import { useEffect, useRef } from "react";

interface ArticleContentProps {
  content: string;
}

declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: (element?: HTMLElement) => void;
      };
    };
    instgrm?: {
      Embeds: {
        process: () => void;
      };
    };
  }
}

export function ArticleContent({ content }: ArticleContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contentRef.current) return;

    // Convert standalone Twitter/X URLs to blockquotes
    const twitterUrlPattern = /https?:\/\/(twitter\.com|x\.com)\/[^\s<]+\/status\/\d+/gi;
    const paragraphs = contentRef.current.querySelectorAll("p");

    paragraphs.forEach((p) => {
      const text = p.textContent || "";
      const match = text.match(twitterUrlPattern);

      if (match && match.length > 0) {
        const tweetUrl = match[0].trim();

        // Check if URL is standalone (not part of a link already)
        if (!p.querySelector(`a[href="${tweetUrl}"]`) && !p.querySelector('blockquote')) {
          // Create Twitter embed blockquote
          const blockquote = document.createElement("blockquote");
          blockquote.className = "twitter-tweet";
          blockquote.setAttribute("data-conversation", "none");
          blockquote.setAttribute("data-theme", "light");

          const link = document.createElement("a");
          link.href = tweetUrl;
          link.textContent = "View Tweet";
          blockquote.appendChild(link);

          // Replace paragraph with blockquote
          p.replaceWith(blockquote);
        }
      }
    });

    // Find blockquotes that contain Twitter links and add twitter-tweet class
    const blockquotes = contentRef.current.querySelectorAll("blockquote");
    blockquotes.forEach((blockquote) => {
      const hasTwitterLink = blockquote.querySelector('a[href*="twitter.com"], a[href*="x.com"]');
      const hasPicTwitter = blockquote.innerHTML.includes("pic.twitter.com");

      if ((hasTwitterLink || hasPicTwitter) && !blockquote.classList.contains("twitter-tweet")) {
        blockquote.classList.add("twitter-tweet");
        blockquote.setAttribute("data-conversation", "none");
        blockquote.setAttribute("data-theme", "light");
      }
    });

    // Function to load Twitter widgets
    const loadTwitterWidgets = () => {
      if (window.twttr?.widgets && contentRef.current) {
        window.twttr.widgets.load(contentRef.current);
      }
    };

    // Function to load Instagram embeds
    const loadInstagramEmbeds = () => {
      if (window.instgrm?.Embeds) {
        window.instgrm.Embeds.process();
      }
    };

    // Try to load immediately if scripts are already loaded
    loadTwitterWidgets();
    loadInstagramEmbeds();

    // Also set up listeners for when scripts load
    const checkAndLoad = setInterval(() => {
      if (window.twttr?.widgets) {
        loadTwitterWidgets();
        clearInterval(checkAndLoad);
      }
    }, 500);

    // Timeout to stop checking after 10 seconds
    const timeout = setTimeout(() => {
      clearInterval(checkAndLoad);
    }, 10000);

    // Cleanup
    return () => {
      clearInterval(checkAndLoad);
      clearTimeout(timeout);
    };
  }, [content]);

  return (
    <div
      ref={contentRef}
      className="article-content"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
