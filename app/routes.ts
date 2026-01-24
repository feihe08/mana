import { type RouteConfig, route } from "@react-router/dev/routes";

export default [
  route("/", "routes/_index.tsx"),
  route("/convert/beancount", "routes/convert.beancount.tsx"),
] satisfies RouteConfig;
