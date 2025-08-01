import { Feed } from "feed";
import { getBlogPosts } from "app/lib/posts";
import { metaData } from "app/lib/config";
import { NextResponse } from "next/server";

// Revalidate every hour (3600 seconds)
export const revalidate = 3600;

export async function generateStaticParams() {
  return [
    { format: "rss.xml" },
    { format: "atom.xml" },
    { format: "feed.json" },
  ];
}

export async function GET(
  _: Request,
  { params }: { params: Promise<{ format: string }> }
) {
  const { format } = await params;
  const validFormats = ["rss.xml", "atom.xml", "feed.json"];

  if (!validFormats.includes(format)) {
    return NextResponse.json(
      { error: "Unsupported feed format" },
      { status: 404 }
    );
  }

  const BaseUrl = metaData.baseUrl.endsWith("/")
    ? metaData.baseUrl
    : `${metaData.baseUrl}/`;

  const feed = new Feed({
    title: metaData.title,
    description: metaData.description,
    id: BaseUrl,
    link: BaseUrl,
    copyright: `All rights reserved ${new Date().getFullYear()}, ${
      metaData.title
    }`,
    generator: "Feed for Node.js",
    feedLinks: {
      json: `${BaseUrl}feed.json`,
      atom: `${BaseUrl}atom.xml`,
      rss: `${BaseUrl}rss.xml`,
    },
  });

  const allPosts = await getBlogPosts();

  allPosts.forEach((post) => {
    const postUrl = `${BaseUrl}blog/${post.slug}`;
    const categories = post.metadata.tags
      ? post.metadata.tags.split(",").map((tag) => tag.trim())
      : [];

    feed.addItem({
      title: post.metadata.title,
      id: postUrl,
      link: postUrl,
      description: post.metadata.summary,
      category: categories.map((tag) => ({
        name: tag,
        term: tag,
      })),
      date: new Date(post.metadata.publishedAt),
    });
  });

  const responseMap: Record<string, { content: string; contentType: string }> =
    {
      "rss.xml": { content: feed.rss2(), contentType: "application/xml" },
      "atom.xml": { content: feed.atom1(), contentType: "application/xml" },
      "feed.json": { content: feed.json1(), contentType: "application/json" },
    };

  const response = responseMap[format];

  return new NextResponse(response.content, {
    headers: {
      "Content-Type": response.contentType,
      "Cache-Control": "public, max-age=3600, s-maxage=7200", // Cache for 1 hour, CDN for 2 hours
      "CDN-Cache-Control": "public, max-age=7200", // Cache on CDN for 2 hours
      "Vercel-CDN-Cache-Control": "public, max-age=7200", // Vercel-specific CDN caching
    },
  });
}
