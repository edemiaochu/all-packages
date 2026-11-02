"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgComputer = void 0;
const react_1 = __importDefault(require("react"));
const SvgComputer = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M15 1H1a.945.945 0 00-1 1v9.1a.916.916 0 001 .9h6v2c-.9.2-1.9 1-1.2 1h4.3c.7 0-.7-.9-1.1-1v-2h6a.98.98 0 001-1V2a.945.945 0 00-1-1m0 9H1V2h14v8" })));
exports.SvgComputer = SvgComputer;
exports.default = SvgComputer;
