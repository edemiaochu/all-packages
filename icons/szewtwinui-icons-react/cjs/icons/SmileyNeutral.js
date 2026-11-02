"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgSmileyNeutral = void 0;
const react_1 = __importDefault(require("react"));
const SvgSmileyNeutral = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M8 0a8 8 0 108 8 7.998 7.998 0 00-8-8zM5 5a1.147 1.147 0 011 1.25A1.147 1.147 0 015 7.5a1.147 1.147 0 01-1-1.25A1.147 1.147 0 015 5zm6.5 6h-7a.5.5 0 010-1h7a.5.5 0 010 1zM11 7.5a1.147 1.147 0 01-1-1.25A1.147 1.147 0 0111 5a1.147 1.147 0 011 1.25 1.147 1.147 0 01-1 1.25z" })));
exports.SvgSmileyNeutral = SvgSmileyNeutral;
exports.default = SvgSmileyNeutral;
