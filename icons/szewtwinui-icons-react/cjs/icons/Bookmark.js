"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgBookmark = void 0;
const react_1 = __importDefault(require("react"));
const SvgBookmark = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M4 1.6v12.8L8 12l4 2.4V1.6z", fillRule: "evenodd" })));
exports.SvgBookmark = SvgBookmark;
exports.default = SvgBookmark;
