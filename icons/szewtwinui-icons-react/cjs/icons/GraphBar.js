"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgGraphBar = void 0;
const react_1 = __importDefault(require("react"));
const SvgGraphBar = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M1 14V0H0v15h16v-1z" }),
    react_1.default.createElement("path", { d: "M12 6h3v7h-3zM7 2h3v11H7zM2 4h3v9H2z" })));
exports.SvgGraphBar = SvgGraphBar;
exports.default = SvgGraphBar;
