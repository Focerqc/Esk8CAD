import { onRequestPost as __api_submit_ts_onRequestPost } from "C:\\Users\\quinn\\Documents\\GitHub\\CLONEpubparts.xyz\\functions\\api\\submit.ts"

export const routes = [
    {
      routePath: "/api/submit",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_submit_ts_onRequestPost],
    },
  ]