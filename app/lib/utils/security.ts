/**
 * 安全工具函数
 * 提供 CSRF 保护、XSS 防护等安全功能
 */

/**
 * 生成 CSRF Token
 * 使用 Web Crypto API 生成随机 UUID
 */
export function generateCSRFToken(): string {
  return crypto.randomUUID();
}

/**
 * 验证 CSRF Token
 * @param token 用户提交的 token
 * @param sessionToken 会话中存储的 token
 */
export function validateCSRFToken(token: string, sessionToken: string): boolean {
  if (!token || !sessionToken) {
    return false;
  }
  return token === sessionToken;
}

/**
 * HTML 转义
 * 防止 XSS 攻击
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * 清理用户输入
 * 移除潜在的 XSS 攻击向量
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    // 移除 script 标签
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    // 移除 iframe 标签
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    // 移除事件处理器
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    // 移除 javascript: 协议
    .replace(/javascript:/gi, '')
    // 移除 data: 协议（除了图片）
    .replace(/data:(?!image)/gi, '');
}

/**
 * 清理文件名
 * 防止路径遍历攻击
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return 'unnamed';
  }

  return filename
    // 移除路径分隔符
    .replace(/[/\\]/g, '')
    // 移除特殊字符
    .replace(/[<>:"|?*]/g, '')
    // 移除控制字符
    .replace(/[\x00-\x1f\x80-\x9f]/g, '')
    // 移除前后空格和点
    .trim()
    .replace(/^\.+/, '')
    .replace(/\.+$/, '')
    // 限制长度
    .substring(0, 255);
}

/**
 * 验证 URL
 * 确保 URL 是安全的
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // 只允许 http 和 https 协议
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * 生成安全的随机字符串
 * 用于生成 ID、token 等
 */
export function generateSecureRandomString(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * 限制字符串长度
 * 防止过长的输入导致性能问题
 */
export function limitStringLength(str: string, maxLength: number = 1000): string {
  if (!str || typeof str !== 'string') {
    return '';
  }
  return str.substring(0, maxLength);
}

/**
 * 验证 IP 地址格式
 */
export function isValidIP(ip: string): boolean {
  // IPv4
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(ip)) {
    const parts = ip.split('.');
    return parts.every((part) => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }

  // IPv6 (简化版)
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv6Regex.test(ip);
}

/**
 * 安全响应头配置
 * 用于 Worker 响应
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    // 防止点击劫持
    'X-Frame-Options': 'DENY',
    // 防止 MIME 类型嗅探
    'X-Content-Type-Options': 'nosniff',
    // 控制 Referer 头
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    // 限制浏览器功能
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    // XSS 保护（旧版浏览器）
    'X-XSS-Protection': '1; mode=block',
  };
}

/**
 * 内容安全策略 (CSP)
 * 用于防止 XSS 攻击
 */
export function getCSPHeader(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // React 需要 unsafe-inline
    "style-src 'self' 'unsafe-inline'", // Tailwind 需要 unsafe-inline
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.anthropic.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}
