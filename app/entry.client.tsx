import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

// 部署信息 - 方便 debug
console.log('🚀 Mana - Deployment Info');
console.log('Commit: fcf88c5d');
console.log('Message: refactor: remove debug UI and console logs');
console.log('Time: 2026-01-17 23:04:15 +0800');
console.log('Environment: production');

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>
  );
});
