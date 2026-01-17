import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

// 部署信息 - 方便 debug（构建时自动注入）
console.log('🚀 Mana - Deployment Info');
console.log('Commit:', __GIT_COMMIT__);
console.log('Message:', __GIT_MESSAGE__);
console.log('Time:', __GIT_TIME__);
console.log('Environment:', import.meta.env.MODE);

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>
  );
});
