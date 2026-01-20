/**
 * 分类器模块导出
 */

// AI 分类器
export {
  AICategorizer,
  categorizeByAI,
  smartCategorize,
  shouldUseAI,
  type AICategorizeRequest,
  type AICategorizeResponse,
} from "./ai-categorizer";

// 规则引擎
export {
  RulesEngine,
  categorizeByRules,
  getAllRules,
  addCustomRule,
} from "./rules";
