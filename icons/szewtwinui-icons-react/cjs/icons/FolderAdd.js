"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgFolderAdd = void 0;
const react_1 = __importDefault(require("react"));
const SvgFolderAdd = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M14 10h1V4a1 1 0 00-1-1H7V2a1 1 0 00-1-1H2a1 1 0 00-1 1v10a1 1 0 001 1h5v-3h3V7h4z" }),
    react_1.default.createElement("path", { d: "M11 8v3H8v2h3v3h2v-3h3v-2h-3V8z" })));
exports.SvgFolderAdd = SvgFolderAdd;
exports.default = SvgFolderAdd;
