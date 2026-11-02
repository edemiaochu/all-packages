"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgDuplicate = void 0;
const react_1 = __importDefault(require("react"));
const SvgDuplicate = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M12 16H0V4h2v10h10z" }),
    react_1.default.createElement("path", { d: "M3 1v12h12V1zm10 7h-3v3H8V8H5V6h3V3h2v3h3z" })));
exports.SvgDuplicate = SvgDuplicate;
exports.default = SvgDuplicate;
