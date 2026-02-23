import { onRequestGet as __api_scrape_ts_onRequestGet } from "C:\\Users\\quinn\\Documents\\GitHub\\CLONEpubparts.xyz\\functions\\api\\scrape.ts"
import { onRequestPost as __api_submit_ts_onRequestPost } from "C:\\Users\\quinn\\Documents\\GitHub\\CLONEpubparts.xyz\\functions\\api\\submit.ts"

export const routes = [
    {
      routePath: "/api/scrape",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_scrape_ts_onRequestGet],
    },
  {
      routePath: "/api/submit",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_submit_ts_onRequestPost],
    },
  ]