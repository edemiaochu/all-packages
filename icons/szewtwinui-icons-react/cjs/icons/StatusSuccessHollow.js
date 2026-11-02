"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgStatusSuccessHollow = void 0;
const react_1 = __importDefault(require("react"));
const SvgStatusSuccessHollow = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M8 1.5A6.5 6.5 0 111.5 8 6.5 6.5 0 018 1.5M8 0a8 8 0 108 8 8 8 0 00-8-8zM6.651 11.994L3 8.594l1.396-1.3 2.362 2.2 4.833-4.5 1.396 1.3z" })));
exports.SvgStatusSuccessHollow = SvgStatusSuccessHollow;
exports.default = SvgStatusSuccessHollow;
