// Helper function to extract token from request cookies in Next.js Server Side
export function getSessionToken(request) {
  if (!request) return null;
  const cookieHeader = request.headers?.get?.('cookie') || '';
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, val] = cookie.trim().split('=');
    if (key && val) acc[key] = val;
    return acc;
  }, {});
  return cookies['token'] || null;
}
