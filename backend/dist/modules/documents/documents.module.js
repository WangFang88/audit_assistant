"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const document_chunk_entity_1 = require("../../database/entities/document-chunk.entity");
const document_entity_1 = require("../../database/entities/document.entity");
const database_support_module_1 = require("../../database/database-support.module");
const auth_module_1 = require("../auth/auth.module");
const groups_module_1 = require("../groups/groups.module");
const subscriptions_module_1 = require("../subscriptions/subscriptions.module");
const documents_controller_1 = require("./documents.controller");
const documents_service_1 = require("./documents.service");
const file_storage_service_1 = require("./file-storage.service");
let DocumentsModule = class DocumentsModule {
};
exports.DocumentsModule = DocumentsModule;
exports.DocumentsModule = DocumentsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([document_entity_1.DocumentEntity, document_chunk_entity_1.DocumentChunkEntity]), database_support_module_1.DatabaseSupportModule, auth_module_1.AuthModule, (0, common_1.forwardRef)(() => groups_module_1.GroupsModule), subscriptions_module_1.SubscriptionsModule],
        controllers: [documents_controller_1.DocumentsController],
        providers: [documents_service_1.DocumentsService, file_storage_service_1.FileStorageService],
        exports: [documents_service_1.DocumentsService],
    })
], DocumentsModule);
//# sourceMappingURL=documents.module.js.map