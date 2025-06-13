export function formatDate(date: number | string, includeRelative = false) {
  let currentDate = new Date();
  if (typeof date === "string" && !date.includes("T")) {
    date = `${date}T00:00:00`;
  }
  let targetDate = new Date(date);

  let yearsAgo = currentDate.getFullYear() - targetDate.getFullYear();
  let monthsAgo = currentDate.getMonth() - targetDate.getMonth();
  let daysAgo = currentDate.getDate() - targetDate.getDate();

  let formattedDate = "";

  if (yearsAgo > 0) {
    formattedDate = `${yearsAgo}y ago`;
  } else if (monthsAgo > 0) {
    formattedDate = `${monthsAgo}mo ago`;
  } else if (daysAgo > 0) {
    formattedDate = `${daysAgo}d ago`;
  } else {
    formattedDate = "Today";
  }

  let fullDate = targetDate.toLocaleString("en-us", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (!includeRelative) {
    return fullDate;
  }

  return `${fullDate} (${formattedDate})`;
}

export function createExportFile(pubkey: string, privateKey: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileContent = `Nostr Private Key Export
Generated: ${timestamp}
Public Key: ${pubkey}

PRIVATE KEY (Keep this secure!):
${privateKey}

WARNING: Anyone with access to this private key can control your account.
Store this in a secure location and never share it.`;

  return { fileName: `nostr-private-key-${timestamp}.txt`, fileContent };
}
