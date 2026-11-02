"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgGroupUngroup = void 0;
const react_1 = __importDefault(require("react"));
const SvgGroupUngroup = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", ...props },
    react_1.default.createElement("g", { fillRule: "evenodd", fill: "var(--iui-color-icon-muted, currentColor)" },
        react_1.default.createElement("path", { d: "M12 8a4 4 0 11-4 4 4 4 0 014-4", opacity: "0.5" }),
        react_1.default.createElement("path", { d: "M4 0L0 8h8" }))));
exports.SvgGroupUngroup = SvgGroupUngroup;
exports.default = SvgGroupUngroup;
