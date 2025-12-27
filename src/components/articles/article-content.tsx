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
      // Check if paragraph contains a Twitter/X link
      const twitterLink = p.querySelector('a[href*="twitter.com/"], a[href*="x.com/"]');

      if (twitterLink) {
        const href = twitterLink.getAttribute('href');

        // Verify it's a status URL
        if (href && /\/status\/\d+/.test(href)) {
          // Check if this is the only content in the paragraph (standalone tweet)
          const paragraphText = p.textContent?.trim() || "";
          const linkText = twitterLink.textContent?.trim() || "";

          // If paragraph only contains the link (or link + whitespace), convert to embed
          if (paragraphText === linkText || paragraphText === href) {
            const blockquote = document.createElement("blockquote");
            blockquote.className = "twitter-tweet";
            blockquote.setAttribute("data-conversation", "none");
            blockquote.setAttribute("data-theme", "light");

            const link = document.createElement("a");
            link.href = href;
            link.textContent = "View Tweet";
            blockquote.appendChild(link);

            p.replaceWith(blockquote);
          }
        }
      } else {
        // Handle plain text Twitter URLs (not wrapped in <a> tag)
        const text = p.textContent || "";
        const match = text.match(twitterUrlPattern);

        if (match && match.length > 0) {
          const tweetUrl = match[0].trim();

          if (!p.querySelector('blockquote')) {
            const blockquote = document.createElement("blockquote");
            blockquote.className = "twitter-tweet";
            blockquote.setAttribute("data-conversation", "none");
            blockquote.setAttribute("data-theme", "light");

            const link = document.createElement("a");
            link.href = tweetUrl;
            link.textContent = "View Tweet";
            blockquote.appendChild(link);

            p.replaceWith(blockquote);
          }
        }
      }
    });

    // Handle WordPress figure embeds for Twitter (e.g., <figure class="wp-block-embed-twitter">)
    const figures = contentRef.current.querySelectorAll("figure.wp-block-embed-twitter");
    console.log(`[Twitter Embed] Found ${figures.length} figure elements with wp-block-embed-twitter class`);

    figures.forEach((figure, index) => {
      const wrapper = figure.querySelector('.wp-block-embed__wrapper');
      if (wrapper) {
        const text = wrapper.textContent || "";
        console.log(`[Twitter Embed] Figure ${index}: text content =`, text.substring(0, 100));
        const match = text.match(twitterUrlPattern);
        console.log(`[Twitter Embed] Figure ${index}: regex match =`, match);

        if (match && match.length > 0) {
          const tweetUrl = match[0].trim();
          console.log(`[Twitter Embed] Figure ${index}: Converting to blockquote with URL =`, tweetUrl);

          // Don't convert if already has a blockquote
          if (!figure.querySelector('blockquote')) {
            const blockquote = document.createElement("blockquote");
            blockquote.className = "twitter-tweet";
            blockquote.setAttribute("data-conversation", "none");
            blockquote.setAttribute("data-theme", "light");

            const link = document.createElement("a");
            link.href = tweetUrl;
            link.textContent = "View Tweet";
            blockquote.appendChild(link);

            figure.replaceWith(blockquote);
            console.log(`[Twitter Embed] Figure ${index}: Successfully converted to blockquote`);
          } else {
            console.log(`[Twitter Embed] Figure ${index}: Already has blockquote, skipping`);
          }
        } else {
          console.log(`[Twitter Embed] Figure ${index}: No Twitter URL match found in text`);
        }
      } else {
        console.log(`[Twitter Embed] Figure ${index}: No .wp-block-embed__wrapper found`);
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
