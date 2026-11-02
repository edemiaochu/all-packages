"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgSmileyNeutralHollow = void 0;
const react_1 = __importDefault(require("react"));
const SvgSmileyNeutralHollow = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M11 5a1.146 1.146 0 011 1.25 1.146 1.146 0 01-1 1.25 1.146 1.146 0 01-1-1.25A1.146 1.146 0 0111 5zM5 5a1.146 1.146 0 011 1.25A1.146 1.146 0 015 7.5a1.146 1.146 0 01-1-1.25A1.146 1.146 0 015 5zm3-4a7 7 0 11-7 7 7.008 7.008 0 017-7m0-1a8 8 0 108 8 8 8 0 00-8-8zm4 10.5a.5.5 0 00-.5-.5h-7a.5.5 0 00-.5.5.5.5 0 00.5.5h7a.5.5 0 00.5-.5z" })));
exports.SvgSmileyNeutralHollow = SvgSmileyNeutralHollow;
exports.default = SvgSmileyNeutralHollow;
