import { describe, it, expect } from 'vitest';
import {
  generateCSRFToken,
  validateCSRFToken,
  escapeHtml,
  sanitizeInput,
  sanitizeFilename,
  isValidUrl,
  generateSecureRandomString,
  limitStringLength,
  isValidIP,
  getSecurityHeaders,
  getCSPHeader,
} from './security';

describe('安全工具函数', () => {
  describe('CSRF Token', () => {
    it('应该生成有效的 CSRF token', () => {
      const token = generateCSRFToken();
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('应该生成不同的 token', () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();
      expect(token1).not.toBe(token2);
    });

    it('应该验证匹配的 token', () => {
      const token = 'test-token-123';
      expect(validateCSRFToken(token, token)).toBe(true);
    });

    it('应该拒绝不匹配的 token', () => {
      expect(validateCSRFToken('token1', 'token2')).toBe(false);
    });

    it('应该拒绝空 token', () => {
      expect(validateCSRFToken('', 'token')).toBe(false);
      expect(validateCSRFToken('token', '')).toBe(false);
    });
  });

  describe('HTML 转义', () => {
    it('应该转义 HTML 特殊字符', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
    });

    it('应该转义单引号和双引号', () => {
      expect(escapeHtml(`"test" and 'test'`)).toBe('&quot;test&quot; and &#039;test&#039;');
    });

    it('应该转义 & 符号', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });
  });

  describe('输入清理', () => {
    it('应该移除 script 标签', () => {
      const input = 'Hello <script>alert("xss")</script> World';
      expect(sanitizeInput(input)).toBe('Hello  World');
    });

    it('应该移除 iframe 标签', () => {
      const input = 'Hello <iframe src="evil.com"></iframe> World';
      expect(sanitizeInput(input)).toBe('Hello  World');
    });

    it('应该移除事件处理器', () => {
      const input = '<div onclick="alert(1)">Click me</div>';
      expect(sanitizeInput(input)).not.toContain('onclick');
    });

    it('应该移除 javascript: 协议', () => {
      const input = '<a href="javascript:alert(1)">Link</a>';
      expect(sanitizeInput(input)).not.toContain('javascript:');
    });

    it('应该处理空输入', () => {
      expect(sanitizeInput('')).toBe('');
      expect(sanitizeInput(null as any)).toBe('');
      expect(sanitizeInput(undefined as any)).toBe('');
    });
  });

  describe('文件名清理', () => {
    it('应该移除路径分隔符', () => {
      expect(sanitizeFilename('../../../etc/passwd')).toBe('etcpasswd');
      expect(sanitizeFilename('..\\..\\windows\\system32')).toBe('windowssystem32');
    });

    it('应该移除特殊字符', () => {
      expect(sanitizeFilename('file<>:"|?*.txt')).toBe('file.txt');
    });

    it('应该移除前后的点', () => {
      expect(sanitizeFilename('...file.txt...')).toBe('file.txt');
    });

    it('应该限制长度', () => {
      const longName = 'a'.repeat(300);
      expect(sanitizeFilename(longName).length).toBeLessThanOrEqual(255);
    });

    it('应该处理空文件名', () => {
      expect(sanitizeFilename('')).toBe('unnamed');
      expect(sanitizeFilename(null as any)).toBe('unnamed');
    });
  });

  describe('URL 验证', () => {
    it('应该接受有效的 HTTP URL', () => {
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('https://example.com')).toBe(true);
    });

    it('应该拒绝无效的协议', () => {
      expect(isValidUrl('javascript:alert(1)')).toBe(false);
      expect(isValidUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
      expect(isValidUrl('file:///etc/passwd')).toBe(false);
    });

    it('应该拒绝无效的 URL', () => {
      expect(isValidUrl('not a url')).toBe(false);
      expect(isValidUrl('')).toBe(false);
    });
  });

  describe('随机字符串生成', () => {
    it('应该生成指定长度的字符串', () => {
      const str = generateSecureRandomString(16);
      expect(str.length).toBe(32); // 每个字节转换为 2 个十六进制字符
    });

    it('应该生成不同的字符串', () => {
      const str1 = generateSecureRandomString();
      const str2 = generateSecureRandomString();
      expect(str1).not.toBe(str2);
    });
  });

  describe('字符串长度限制', () => {
    it('应该限制字符串长度', () => {
      const longStr = 'a'.repeat(2000);
      expect(limitStringLength(longStr, 100).length).toBe(100);
    });

    it('应该保留短字符串', () => {
      const shortStr = 'hello';
      expect(limitStringLength(shortStr, 100)).toBe(shortStr);
    });

    it('应该处理空输入', () => {
      expect(limitStringLength('')).toBe('');
      expect(limitStringLength(null as any)).toBe('');
    });
  });

  describe('IP 地址验证', () => {
    it('应该接受有效的 IPv4 地址', () => {
      expect(isValidIP('192.168.1.1')).toBe(true);
      expect(isValidIP('10.0.0.1')).toBe(true);
      expect(isValidIP('127.0.0.1')).toBe(true);
    });

    it('应该拒绝无效的 IPv4 地址', () => {
      expect(isValidIP('256.1.1.1')).toBe(false);
      expect(isValidIP('192.168.1')).toBe(false);
      expect(isValidIP('192.168.1.1.1')).toBe(false);
    });

    it('应该接受有效的 IPv6 地址', () => {
      expect(isValidIP('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
    });
  });

  describe('安全响应头', () => {
    it('应该返回安全响应头对象', () => {
      const headers = getSecurityHeaders();
      expect(headers['X-Frame-Options']).toBe('DENY');
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    });
  });

  describe('CSP 头', () => {
    it('应该返回 CSP 字符串', () => {
      const csp = getCSPHeader();
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("frame-ancestors 'none'");
    });
  });
});
