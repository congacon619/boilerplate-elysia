import {Elysia} from "elysia";
import cors from "@elysiajs/cors";
import {envVars, swaggerConfig} from "./config";

const app = new Elysia()
	.use(
		cors({
			methods: envVars.CORS_ALLOW_METHOD ?? "*",
			origin: envVars.CORS_ALLOW_ORIGIN,
			allowedHeaders: envVars.CORS_ALLOW_HEADERS,
		}),
	)
	.use(swaggerConfig())
	.get("/env", () => envVars)
	.get("/", () => "Hello Elysia")
	.listen(envVars.PORT);

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
