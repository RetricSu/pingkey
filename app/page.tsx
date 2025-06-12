import Image from "next/image";
import { socialLinks } from "./lib/config";

export default function Page() {
  return (
    <section>
      <p className="mb-4">
        {" "}
        The easiest way to allow people to reach you in the internet without
        email, mobile phone, or any social media account.
      </p>
      <p className="mb-4">
        Try{" "}
        <a
          className="text-blue-500 underline"
          href="/p/setting-up-your-profile"
        >
          setting up{" "}
        </a>
        your profile.
      </p>
    </section>
  );
}
