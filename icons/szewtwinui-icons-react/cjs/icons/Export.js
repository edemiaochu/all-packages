"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgExport = void 0;
const react_1 = __importDefault(require("react"));
const SvgExport = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M12 12H2V5h2.2l2.5-2H0v11h14V8.4L12 10z" }),
    react_1.default.createElement("path", { d: "M4 10c1.7-1.7 3.7-3.1 7-3v2l5-4-5-4v2c-3.5 0-7 3.1-7 7" })));
exports.SvgExport = SvgExport;
exports.default = SvgExport;
