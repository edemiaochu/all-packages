"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgFolderLock = void 0;
const react_1 = __importDefault(require("react"));
const SvgFolderLock = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M8 13H2a1 1 0 01-1-1V2a1 1 0 011-1h4a1 1 0 011 1v1h7a1 1 0 011 1v2.78A2.977 2.977 0 0013 6h-1a3.003 3.003 0 00-3 3v1H8zm8-2v5H9v-5h1V9a2.006 2.006 0 012-2h1a2.006 2.006 0 012 2v2zm-2.8 1.7a.7.7 0 00-1.4 0 .7.7 0 00.35.56L11.9 15h1.2l-.25-1.74a.623.623 0 00.35-.56zM14 9a1.001 1.001 0 00-1-1h-1a1.001 1.001 0 00-1 1v2h3z", fillRule: "evenodd" })));
exports.SvgFolderLock = SvgFolderLock;
exports.default = SvgFolderLock;
