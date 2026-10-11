export function validPushEndpoint(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.port &&
      ([
        "fcm.googleapis.com",
        "updates.push.services.mozilla.com",
        "web.push.apple.com",
      ].includes(url.hostname) ||
        /^(?:[a-z0-9-]+\.)*notify\.windows\.com$/.test(url.hostname))
    );
  } catch {
    return false;
  }
}
