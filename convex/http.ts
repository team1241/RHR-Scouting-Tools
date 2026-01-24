import { httpRouter } from "convex/server";
import { getMetadataHttp } from "./metadata";
import { getCyclesHttp } from "./cycles";

const http = httpRouter()

http.route({
    path: "/metadata",
    method: "GET",
    handler: getMetadataHttp
})

http.route({
    path: "/cycles",
    method: "GET",
    handler: getCyclesHttp
})

export default http;