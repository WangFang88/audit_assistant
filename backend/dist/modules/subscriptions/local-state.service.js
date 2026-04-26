"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalStateService = void 0;
const common_1 = require("@nestjs/common");
const fs_1 = require("fs");
const path_1 = require("path");
let LocalStateService = class LocalStateService {
    constructor() {
        this.filePath = (0, path_1.resolve)(process.cwd(), '.data', 'app-state.json');
    }
    readState() {
        try {
            if (!(0, fs_1.existsSync)(this.filePath)) {
                return {};
            }
            const raw = (0, fs_1.readFileSync)(this.filePath, 'utf8');
            if (raw.trim().length === 0) {
                return {};
            }
            return JSON.parse(raw);
        }
        catch {
            return {};
        }
    }
    saveGroups(groups, members) {
        this.writeState({ groups, members });
    }
    saveDocuments(documents) {
        this.writeState({ documents });
    }
    saveChunks(chunks) {
        this.writeState({ chunks });
    }
    saveUsage(usage) {
        this.writeState({ usage });
    }
    saveChatState(conversations, messages) {
        this.writeState({ conversations, messages });
    }
    saveUsers(users) {
        this.writeState({ users });
    }
    saveQueryLogs(queryLogs) {
        this.writeState({ queryLogs });
    }
    saveSubscriptions(subscriptions) {
        this.writeState({ subscriptions });
    }
    writeState(partial) {
        const nextState = {
            ...this.readState(),
            ...partial,
        };
        const parentDir = (0, path_1.dirname)(this.filePath);
        if (!(0, fs_1.existsSync)(parentDir)) {
            (0, fs_1.mkdirSync)(parentDir, { recursive: true });
        }
        (0, fs_1.writeFileSync)(this.filePath, JSON.stringify(nextState, null, 2), 'utf8');
    }
};
exports.LocalStateService = LocalStateService;
exports.LocalStateService = LocalStateService = __decorate([
    (0, common_1.Injectable)()
], LocalStateService);
//# sourceMappingURL=local-state.service.js.map