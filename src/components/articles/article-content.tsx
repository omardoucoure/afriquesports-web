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

    // Find blockquotes that contain Twitter links and add twitter-tweet class
    const blockquotes = contentRef.current.querySelectorAll("blockquote");
    blockquotes.forEach((blockquote) => {
      const hasTwitterLink = blockquote.querySelector('a[href*="twitter.com"], a[href*="x.com"]');
      const hasPicTwitter = blockquote.innerHTML.includes("pic.twitter.com");

      if ((hasTwitterLink || hasPicTwitter) && !blockquote.classList.contains("twitter-tweet")) {
        blockquote.classList.add("twitter-tweet");
        blockquote.setAttribute("data-conversation", "none");
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
