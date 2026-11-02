"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgWindowAdd = void 0;
const react_1 = __importDefault(require("react"));
const SvgWindowAdd = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M7 12H1V4h11v3h1V0H0v13h7zm4-11h1v1h-1zM9 1h1v1H9z" }),
    react_1.default.createElement("path", { d: "M11 8v3H8v2h3v3h2v-3h3v-2h-3V8z" })));
exports.SvgWindowAdd = SvgWindowAdd;
exports.default = SvgWindowAdd;
