import { type RouteConfig, route } from "@react-router/dev/routes";

export default [
  route("/", "routes/_index.tsx"),
  route("/bills", "routes/bills.tsx"),
  route("/convert/beancount", "routes/convert.beancount.tsx"),
  route("/api/upload", "routes/api.upload.ts"),
  route("/api/uploads", "routes/api.uploads.ts"),
  route("/api/delete-upload", "routes/api.delete-upload.ts"),
  route("/api/download", "routes/api.download.ts"),
] satisfies RouteConfig;
