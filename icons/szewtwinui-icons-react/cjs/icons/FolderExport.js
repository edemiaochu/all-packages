"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgFolderExport = void 0;
const react_1 = __importDefault(require("react"));
const SvgFolderExport = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M11 15a6.08 6.08 0 00-6-6V7l-5 3.5L5 14v-2c3-.1 4.4 1.5 6 3m5-12.21v7.42a.928.928 0 01-.93.93h-4.26A6.976 6.976 0 006 8.08v-3l-3 2.1V.93A.935.935 0 013.93 0h3.71a.928.928 0 01.93.93v.93h6.5a.928.928 0 01.93.93z" })));
exports.SvgFolderExport = SvgFolderExport;
exports.default = SvgFolderExport;
