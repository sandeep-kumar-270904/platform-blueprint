const crypto = require('crypto');
const geoip = require('geoip-lite');

// Simple user-agent parser since we don't want heavy dependencies for just OS/Browser
const parseUserAgent = (userAgent) => {
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';

  if (!userAgent) return { browser, os };

  if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Edg')) browser = 'Edge';
  else if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Safari')) browser = 'Safari';

  if (userAgent.includes('Win')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('like Mac OS X')) os = 'iOS';

  return { browser, os };
};

exports.getDeviceFingerprint = (req) => {
  const userAgent = req.headers['user-agent'] || '';
  
  // Get IP (handles proxies like nginx)
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  // If multiple IPs (e.g., '192.168.1.1, 10.0.0.1'), take the first one
  const cleanIp = ip.split(',')[0].trim();
  
  const geo = geoip.lookup(cleanIp);
  const region = geo ? `${geo.city || 'Unknown City'}, ${geo.region || geo.country || 'Unknown Region'}` : 'Unknown Location';

  const { browser, os } = parseUserAgent(userAgent);
  
  // Hash combining OS, Browser, and Region (rough region, not precise IP, to avoid changing on mobile towers)
  // We use region to prevent noisy alerts if IP changes slightly within the same city
  const hashString = `${os}-${browser}-${region}`;
  const hash = crypto.createHash('sha256').update(hashString).digest('hex');

  return {
    hash,
    browser,
    os,
    region,
    ip: cleanIp
  };
};
