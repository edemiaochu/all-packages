"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgFolderRemove = void 0;
const react_1 = __importDefault(require("react"));
const SvgFolderRemove = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M15 7.929V4a1 1 0 00-1-1H7V2a1 1 0 00-1-1H2a1 1 0 00-1 1v10a1 1 0 001 1h6.172l1-1L7.05 9.879 9.879 7.05 12 9.172l2.121-2.122z" }),
    react_1.default.createElement("path", { d: "M14.12 8.465l-2.121 2.121-2.121-2.121-1.414 1.414L10.585 12l-2.121 2.121 1.414 1.414 2.121-2.121 2.121 2.121 1.414-1.414L13.413 12l2.121-2.121" })));
exports.SvgFolderRemove = SvgFolderRemove;
exports.default = SvgFolderRemove;
