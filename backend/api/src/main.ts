import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { toNodeHandler } from 'better-auth/node';
import { auth } from '../lib/auth';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const frontendOrigin = process.env.NEXT_PUBLIC_FRONTEND_URL ?? "http://localhost:8080";

  app.setGlobalPrefix("api");

  const httpAdapter = app.getHttpAdapter();
  const instance = httpAdapter.getInstance();

  instance.use("/api/auth", (req: any, res: any, next: any) => {
	res.setHeader("Access-Control-Allow-Origin", frontendOrigin);
	res.setHeader("Access-Control-Allow-Credentials", "true");
	res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
	if (req.method === "OPTIONS") {
	  return res.sendStatus(204);
	}
	next();
	// return toNodeHandler(auth)(req, res);
  });

  instance.use("/api/auth", toNodeHandler(auth));

  app.enableCors({
    origin: frontendOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
