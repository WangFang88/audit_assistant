"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentRepository = void 0;
const common_1 = require("@nestjs/common");
const private_doc_entity_1 = require("../entities/private-doc.entity");
const public_doc_entity_1 = require("../entities/public-doc.entity");
let DocumentRepository = class DocumentRepository {
    createPublicDocEntity(snapshot) {
        const entity = new public_doc_entity_1.PublicDocEntity();
        entity.id = snapshot.id;
        entity.title = snapshot.title;
        entity.fileName = snapshot.fileName;
        entity.filePath = snapshot.sourcePath;
        entity.uploadedBy = snapshot.uploadedBy;
        entity.uploadedAt = new Date(snapshot.uploadedAt.replace(' ', 'T'));
        entity.indexStatus = snapshot.indexStatus;
        entity.fileType = snapshot.fileType;
        entity.parserTarget = snapshot.parserTarget;
        entity.embeddingTarget = snapshot.embeddingTarget;
        entity.vectorStoreTarget = snapshot.vectorStoreTarget;
        return entity;
    }
    createPrivateDocEntity(snapshot) {
        const entity = new private_doc_entity_1.PrivateDocEntity();
        entity.id = snapshot.id;
        entity.teamId = snapshot.groupId ?? 'unknown';
        entity.title = snapshot.title;
        entity.fileName = snapshot.fileName;
        entity.filePath = snapshot.sourcePath;
        entity.uploadedBy = snapshot.uploadedBy;
        entity.uploadedAt = new Date(snapshot.uploadedAt.replace(' ', 'T'));
        entity.indexStatus = snapshot.indexStatus;
        entity.fileType = snapshot.fileType;
        entity.parserTarget = snapshot.parserTarget;
        entity.embeddingTarget = snapshot.embeddingTarget;
        entity.vectorStoreTarget = snapshot.vectorStoreTarget;
        return entity;
    }
};
exports.DocumentRepository = DocumentRepository;
exports.DocumentRepository = DocumentRepository = __decorate([
    (0, common_1.Injectable)()
], DocumentRepository);
//# sourceMappingURL=document.repository.js.map