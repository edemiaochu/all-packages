"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgCollapseAll = void 0;
const react_1 = __importDefault(require("react"));
const SvgCollapseAll = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M4.412 5h2.176A.412.412 0 017 5.412v.176A.412.412 0 016.588 6H4.412A.412.412 0 014 5.588v-.176A.412.412 0 014.412 5zm3.65-3a1.001 1.001 0 011 1v5.063a1.001 1.001 0 01-1 1H3a1.001 1.001 0 01-1-1V3a1.001 1.001 0 011-1zm0-1H3a2 2 0 00-2 2v5.063a2 2 0 002 2h5.063a2 2 0 002-2V3a2 2 0 00-2-2zm3 3.006v1.007A.995.995 0 0112 6v5a1.001 1.001 0 01-1 1H6a.995.995 0 01-.987-.938H4.006A1.997 1.997 0 006 13h5a2 2 0 002-2V6a1.997 1.997 0 00-1.938-1.994zM14 7v1a1.001 1.001 0 011 1v5a1.001 1.001 0 01-1 1H9a1.001 1.001 0 01-1-1H7a2 2 0 002 2h5a2 2 0 002-2V9a2 2 0 00-2-2z", fillRule: "evenodd" })));
exports.SvgCollapseAll = SvgCollapseAll;
exports.default = SvgCollapseAll;
