"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgHelpCircular = void 0;
const react_1 = __importDefault(require("react"));
const SvgHelpCircular = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M8.01 0a8 8 0 108 8 8 8 0 00-8-8zm.512 11.252a.777.777 0 11-1.555 0v-.304a.777.777 0 011.555 0zM8.44 9.32a.11.11 0 01-.1.12H7.33a.1.1 0 01-.11-.089.093.093 0 010-.021c0-1.89 1.57-2.118 1.57-3.1a1.339 1.339 0 00-.18-.7.67.67 0 00-.64-.35.69.69 0 00-.63.45 2.133 2.133 0 00-.11.83H6.01c0-3.52 4-3.135 4-.31 0 1.509-1.57 1.54-1.57 3.17z" })));
exports.SvgHelpCircular = SvgHelpCircular;
exports.default = SvgHelpCircular;
