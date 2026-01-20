/**
 * 支付方式解析器
 *
 * 从支付宝/微信账单的支付方式字段中提取银行名称和卡号后四位
 */

/**
 * 支付方式信息
 */
export interface PaymentMethodInfo {
  /** 银行/支付平台名称 */
  bankName: string;
  /** 支付类型（信用卡/储蓄卡/余额等） */
  paymentType: string;
  /** 卡号后四位 */
  lastFourDigits?: string;
  /** 完整的支付方式描述 */
  fullDescription: string;
  /** 标准化的 Beancount 账户名 */
  beancountAccount: string;
}

/**
 * 解析支付宝支付方式
 */
export function parseAlipayPaymentMethod(paymentMethod: string): PaymentMethodInfo {
  if (!paymentMethod || paymentMethod.trim() === "") {
    return {
      bankName: "Unknown",
      paymentType: "Unknown",
      fullDescription: "未知支付方式",
      beancountAccount: "Assets:Cash",
    };
  }

  // 匹配信用卡：汇丰银行（中国）信用卡(2537)
  // 格式：银行名（备注）信用卡(卡号后四位)
  const creditCardMatch = paymentMethod.match(/^(.+?)（.*?）.*?\((\d{4})\)$/);
  if (creditCardMatch) {
    const bankName = creditCardMatch[1].trim();
    const accountNumber = creditCardMatch[2];

    // 银行名称映射
    const accountMap = getBankAccountMapping(bankName, "credit");

    return {
      bankName,
      paymentType: "信用卡",
      lastFourDigits: accountNumber,
      fullDescription: paymentMethod,
      beancountAccount: accountMap,
    };
  }

  // 匹配储蓄卡/借记卡：中信银行储蓄卡(4932)
  // 格式：银行名储蓄卡(卡号后四位)
  const debitCardMatch = paymentMethod.match(/^(.+?)储蓄卡\((\d{4})\)$/);
  if (debitCardMatch) {
    const bankName = debitCardMatch[1].trim();
    const accountNumber = debitCardMatch[2];

    const accountMap = getBankAccountMapping(bankName, "debit");

    return {
      bankName,
      paymentType: "储蓄卡",
      lastFourDigits: accountNumber,
      fullDescription: paymentMethod,
      beancountAccount: accountMap,
    };
  }

  // 匹配余额宝
  if (paymentMethod.includes("余额宝")) {
    return {
      bankName: "支付宝",
      paymentType: "余额宝",
      fullDescription: paymentMethod,
      beancountAccount: "Assets:Alipay:YuEBao",
    };
  }

  // 匹配账户余额
  if (paymentMethod.includes("账户余额")) {
    return {
      bankName: "支付宝",
      paymentType: "余额",
      fullDescription: paymentMethod,
      beancountAccount: "Assets:Alipay:Balance",
    };
  }

  // 默认情况
  return {
    bankName: "其他",
    paymentType: "未知",
    fullDescription: paymentMethod,
    beancountAccount: "Assets:Cash",
  };
}

/**
 * 获取银行的 Beancount 账户映射
 */
function getBankAccountMapping(
  bankName: string,
  cardType: "credit" | "debit"
): string {
  // 银行名称标准化（去除银行后缀）
  const normalizedBank = bankName
    .replace(/【\（\(].+?[\)】）]/g, "")
    .replace(/银行.*/, "")
    .trim();

  // 常见银行简称映射
  const bankCodeMap: Record<string, string> = {
    "汇丰": "HSBC",
    "中信": "CITIC",
    "招商": "CMB",
    "工商": "ICBC",
    "建设": "CCB",
    "农业": "ABC",
    "中国银行": "BOC",
    "交通": "BCM",
    "民生": "CMBC",
    "光大": "CEB",
    "浦发": "SPDB",
    "兴业": "CIB",
    "平安": "PAB",
    "华夏": "HXB",
  };

  const bankCode = bankCodeMap[normalizedBank] || normalizedBank;

  if (cardType === "credit") {
    return `Liabilities:CreditCard:${bankCode}`;
  } else {
    return `Assets:Bank:${bankCode}`;
  }
}

/**
 * 快捷函数：从支付方式字符串获取 Beancount 账户
 */
export function getBeancountAccountFromPaymentMethod(paymentMethod: string): string {
  const info = parseAlipayPaymentMethod(paymentMethod);
  return info.beancountAccount;
}
