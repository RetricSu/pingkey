import Image from "next/image";
import { socialLinks } from "../../lib/config";

interface PageProps {
  params: {
    slug: string;
  };
}

export default async function DynamicPage({ params }: PageProps) {
  const { slug } = await params;
  return (
    <div>
      <section>
        <a href={socialLinks.twitter} target="_blank">
          <Image
            src="/profile.png"
            alt="Profile photo"
            className="rounded-full bg-gray-100 block lg:mt-5 mt-0 lg:mb-5 mb-10 mx-auto sm:float-right sm:ml-5 sm:mb-5 grayscale hover:grayscale-0"
            unoptimized
            width={160}
            height={160}
            priority
          />
        </a>
        <h1 className="mb-8 text-2xl font-medium capitalize">{slug}</h1>
        <div className="prose prose-neutral dark:prose-invert">
          <p>
            Hello, this is Retric Su. I am a software engineer. I am open to
            discuss with crypto, blockchain, AI, history and arts.
          </p>
          <p>
            Feel free to reach me by writing an digital letter to my relays.
            Minimal POW 6 is required.
          </p>
        </div>

        <div className="mt-8 border-t border-gray-100 dark:border-gray-800 pt-8">
          <div className="mt-4 mb-6 pt-4">
            <h3 className="text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
              RetricSu's Relays
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>wss://relay.damus.io</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>wss://nos.lol</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>wss://relay.nostr.band</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>wss://nostr.wine</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>wss://relay.snort.social</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>wss://nostr-pub.wellorder.net</span>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <textarea
              placeholder="Write your message here..."
              className="w-full h-32 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              rows={6}
            />

            <div className="flex justify-between items-center">
              <button className="px-6 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium">
                Send Letter
              </button>

              <div className="text-sm text-gray-500 dark:text-gray-400">
                Minimal POW 6 required
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
