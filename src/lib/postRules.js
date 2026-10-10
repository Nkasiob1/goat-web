const LINK = /(https?:\/\/|www\.|t\.me\/|\b[a-z0-9-]+\.(com|net|org|io|xyz|co|app|ly|gg|link|finance|exchange|info|biz|site|online|top|vip|club|cc)\b)/i;

export function checkBody(text) {                        // returns a problem message, or "" if the post is fine
  const body = text.trim();
  if (!body) return "Write something first.";
  if (body.length > 500) return "Keep it under 500 characters.";
  if (LINK.test(body)) return "Links and web addresses aren't allowed in the community.";
  return "";
}