import { onRequestPost as __submit_pr_ts_onRequestPost } from "C:\\Users\\quinn\\Documents\\GitHub\\CLONEpubparts.xyz\\functions\\submit-pr.ts"

export const routes = [
    {
      routePath: "/submit-pr",
      mountPath: "/",
      method: "POST",
      middlewares: [],
      modules: [__submit_pr_ts_onRequestPost],
    },
  ]