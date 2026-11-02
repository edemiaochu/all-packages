"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgNotification = void 0;
const react_1 = __importDefault(require("react"));
const SvgNotification = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M12.964 10.92V6.63a5.024 5.024 0 00-3.782-4.94v-.52A1.32 1.32 0 008 0a1.221 1.221 0 00-1.182 1.17v.52a5.118 5.118 0 00-3.782 4.94v4.29L1.5 12.48V13h13v-.52zM9.5 16h-3a1 1 0 01-1-1 1 1 0 011-1h3a1 1 0 011 1 1 1 0 01-1 1z" })));
exports.SvgNotification = SvgNotification;
exports.default = SvgNotification;
