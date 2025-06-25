import React from "react";
import {
  FaGithub,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaYoutube,
  FaTiktok,
  FaTelegram,
} from "react-icons/fa6";

interface RichAboutProps {
  text: string;
  className?: string;
}

interface ParsedElement {
  type: "text" | "url" | "social";
  content: string;
  href?: string;
  platform?: string;
}

export function RichAbout({ text, className = "" }: RichAboutProps) {
  const parseText = (input: string): ParsedElement[] => {
    if (!input) return [];

    const elements: ParsedElement[] = [];

    // Regex patterns - check social platforms first, then regular URLs
    const socialPlatformPattern =
      /(https?:\/\/(?:www\.)?(?:x|twitter|github|instagram|linkedin|youtube|tiktok|telegram)\.com\/[^\s]+)/gi;
    const urlPattern = /(https?:\/\/[^\s]+)/gi;

    let lastIndex = 0;

    // First pass: find all social platform URLs
    let socialMatch;
    const socialMatches: Array<{
      start: number;
      end: number;
      url: string;
      platform: string;
    }> = [];

    while ((socialMatch = socialPlatformPattern.exec(input)) !== null) {
      const platform =
        socialMatch[0].toLowerCase().includes("twitter") ||
        socialMatch[0].toLowerCase().includes("x")
          ? "twitter"
          : socialMatch[0].toLowerCase().includes("github")
          ? "github"
          : socialMatch[0].toLowerCase().includes("instagram")
          ? "instagram"
          : socialMatch[0].toLowerCase().includes("linkedin")
          ? "linkedin"
          : socialMatch[0].toLowerCase().includes("youtube")
          ? "youtube"
          : socialMatch[0].toLowerCase().includes("tiktok")
          ? "tiktok"
          : socialMatch[0].toLowerCase().includes("telegram")
          ? "telegram"
          : "unknown";

      socialMatches.push({
        start: socialMatch.index,
        end: socialMatch.index + socialMatch[0].length,
        url: socialMatch[0],
        platform: platform,
      });
    }

    // Second pass: find all other URLs that aren't social platforms
    let urlMatch;
    const urlMatches: Array<{ start: number; end: number; url: string }> = [];

    while ((urlMatch = urlPattern.exec(input)) !== null) {
      const matchStart = urlMatch.index;
      const matchEnd = matchStart + urlMatch[0].length;

      // Check if this URL overlaps with any social platform URL
      const isOverlapping = socialMatches.some(
        (social) =>
          (matchStart >= social.start && matchStart < social.end) ||
          (matchEnd > social.start && matchEnd <= social.end) ||
          (matchStart <= social.start && matchEnd >= social.end)
      );

      if (!isOverlapping) {
        urlMatches.push({
          start: matchStart,
          end: matchEnd,
          url: urlMatch[0],
        });
      }
    }

    // Combine and sort all matches by position
    const allMatches = [
      ...socialMatches.map((m) => ({ ...m, type: "social" as const })),
      ...urlMatches.map((m) => ({ ...m, type: "url" as const })),
    ].sort((a, b) => a.start - b.start);

    // Build elements based on sorted matches
    lastIndex = 0;
    for (const match of allMatches) {
      // Add text before match
      if (match.start > lastIndex) {
        const textBefore = input.slice(lastIndex, match.start);
        elements.push({
          type: "text",
          content: textBefore,
        });
      }

      // Add the match
      if (match.type === "social") {
        elements.push({
          type: "social",
          content: match.url,
          href: match.url,
          platform: match.platform,
        });
      } else {
        elements.push({
          type: "url",
          content: match.url,
          href: match.url,
        });
      }

      lastIndex = match.end;
    }

    // Add remaining text
    if (lastIndex < input.length) {
      elements.push({
        type: "text",
        content: input.slice(lastIndex),
      });
    }

    return elements;
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case "twitter":
        return <FaTwitter className="w-4 h-4 mr-1 inline-block" />;
      case "github":
        return <FaGithub className="w-4 h-4 mr-1 inline-block" />;
      case "instagram":
        return <FaInstagram className="w-4 h-4 mr-1 inline-block" />;
      case "linkedin":
        return <FaLinkedin className="w-4 h-4 mr-1 inline-block" />;
      case "youtube":
        return <FaYoutube className="w-4 h-4 mr-1 inline-block" />;
      case "tiktok":
        return <FaTiktok className="w-4 h-4 mr-1 inline-block" />;
      case "telegram":
        return <FaTelegram className="w-4 h-4 mr-1 inline-block" />;
      default:
        return null;
    }
  };

  const getShortenedUrl = (
    url: string,
    type: "url" | "social",
    platform?: string
  ) => {
    try {
      const urlObj = new URL(url);

      if (type === "social" && platform) {
        // For social platforms, show a clean format like "github.com/username"
        const pathParts = urlObj.pathname.split("/").filter(Boolean);
        const username = pathParts[0] || "";

        switch (platform) {
          case "twitter":
            return `x.com/${username}`;
          case "github":
            return `github.com/${username}`;
          case "instagram":
            return `instagram.com/${username}`;
          case "linkedin":
            return `linkedin.com/${pathParts.join("/")}`;
          case "youtube":
            if (url.includes("/watch?")) {
              return "youtube.com/watch";
            } else if (url.includes("/channel/")) {
              return `youtube.com/channel/${pathParts[1] || ""}`;
            } else {
              return `youtube.com/${pathParts[0] || ""}`;
            }
          case "tiktok":
            return `tiktok.com/${username}`;
          case "telegram":
            return `telegram.com/${username}`;
          default:
            return urlObj.hostname + (pathParts[0] ? `/${pathParts[0]}` : "");
        }
      } else {
        // For regular URLs, show domain + first path segment if it exists
        const pathParts = urlObj.pathname.split("/").filter(Boolean);
        if (pathParts.length > 0 && urlObj.pathname !== "/") {
          return `${urlObj.hostname}/${pathParts[0]}${
            pathParts.length > 1 ? "/..." : ""
          }`;
        } else {
          return urlObj.hostname;
        }
      }
    } catch {
      // Fallback for invalid URLs
      return url.length > 30 ? url.substring(0, 30) + "..." : url;
    }
  };

  const renderElement = (element: ParsedElement, index: number) => {
    switch (element.type) {
      case "url":
        return (
          <a
            key={index}
            href={element.href}
            target="_blank"
            rel="noopener noreferrer"
            className="!text-inherit underline !decoration-current underline-offset-2 hover:opacity-75 transition-opacity"
          >
            {getShortenedUrl(element.content, "url")}
          </a>
        );
      case "social":
        return (
          <a
            key={index}
            href={element.href}
            target="_blank"
            rel="noopener noreferrer"
            className="!text-inherit underline !decoration-current underline-offset-2 hover:opacity-75 transition-opacity inline-flex items-center"
          >
            {getSocialIcon(element.platform || "")}
            {getShortenedUrl(element.content, "social", element.platform)}
          </a>
        );
      case "text":
      default:
        return <span key={index}>{element.content}</span>;
    }
  };

  const parsedElements = parseText(text);

  return <div className={className}>{parsedElements.map(renderElement)}</div>;
}
