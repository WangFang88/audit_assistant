"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const node_path_1 = require("node:path");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { cors: true });
    app.useStaticAssets((0, node_path_1.join)(process.cwd(), '.data', 'uploads'), {
        prefix: '/files/',
    });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    const webDistPath = process.env.WEB_DIST_PATH ?? (0, node_path_1.join)(process.cwd(), '..', 'web');
    if (require('node:fs').existsSync(webDistPath)) {
        app.useStaticAssets(webDistPath, { index: false });
        app.getHttpAdapter().getInstance().use((_req, res, next) => {
            if (_req.path.startsWith('/api') || _req.path.startsWith('/files'))
                return next();
            res.sendFile((0, node_path_1.join)(webDistPath, 'index.html'));
        });
    }
    await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}
void bootstrap();
//# sourceMappingURL=main.js.map