"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgSaveAs = void 0;
const react_1 = __importDefault(require("react"));
const SvgSaveAs = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M7 13.8v-.41l.29-.29.1-.1H4a1 1 0 01-1-1V9a1 1 0 011-1h6a1 1 0 011 1v.39l.35-.39.72-.68.33-.32.53-.5A1.61 1.61 0 0114 7V0H0v12l2 2h5zM2 6.5v-5a.5.5 0 01.5-.5h9a.5.5 0 01.5.5v5a.5.5 0 01-.5.5h-9a.5.5 0 01-.5-.5z" }),
    react_1.default.createElement("path", { d: "M5 9a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1m7.4.4l2.2 2.2-4.4 4.4H8v-2.2m1.9 1.5l.5-.5-1.25-1.25-.5.5v.55h.7v.7m3.35-4.9c0-.1-.05-.1-.1-.1h-.1l-2.85 2.9a.17.17 0 000 .1c0 .1 0 .1.1.1s0 0 .1-.05l2.85-2.85a.17.17 0 000-.1m3.3-.5a.64.64 0 01-.2.5l-.9.9-2.15-2.25.9-.85a.72.72 0 011 0l1.25 1.25a1.19 1.19 0 01.1.45" })));
exports.SvgSaveAs = SvgSaveAs;
exports.default = SvgSaveAs;
