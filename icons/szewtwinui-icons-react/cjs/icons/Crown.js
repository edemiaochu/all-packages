"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgCrown = void 0;
const react_1 = __importDefault(require("react"));
const SvgCrown = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M15.977 6.184a.994.994 0 01-1.457.661l-1.499 5.394a.35.35 0 01-.337.256H3.316a.35.35 0 01-.337-.256L1.48 6.845a.994.994 0 01-1.457-.661A1.003 1.003 0 011 4.97a1.003 1.003 0 01.92 1.395l2.652 1.362a.33.33 0 00.435-.127l2.508-4.295a1.007 1.007 0 01-.485-1.124A1.001 1.001 0 019 2.43c0 .375-.21.7-.515.875L10.993 7.6a.33.33 0 00.435.127l2.652-1.362A1.003 1.003 0 0115 4.97c.62 0 1.113.572.977 1.214zm-3.076 6.786H3.1a.949.949 0 00-.949.949v.1c0 .304.247.551.551.551H13.3a.551.551 0 00.551-.551v-.1a.949.949 0 00-.949-.949z" })));
exports.SvgCrown = SvgCrown;
exports.default = SvgCrown;
