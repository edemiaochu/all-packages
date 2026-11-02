"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgExpandAll = void 0;
const react_1 = __importDefault(require("react"));
const SvgExpandAll = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M7 5.412v.176A.412.412 0 016.588 6H6v.588A.412.412 0 015.588 7h-.176A.412.412 0 015 6.588V6h-.588A.412.412 0 014 5.588v-.176A.412.412 0 014.412 5H5v-.588A.412.412 0 015.412 4h.176A.412.412 0 016 4.412V5h.588A.412.412 0 017 5.412zM14 7v1a1.001 1.001 0 011 1v5a1.001 1.001 0 01-1 1H9a1.001 1.001 0 01-1-1H7a2 2 0 002 2h5a2 2 0 002-2V9a2 2 0 00-2-2zm-1 4V6a1.997 1.997 0 00-1.938-1.994v1.007A.995.995 0 0112 6v5a1.001 1.001 0 01-1 1H6a.995.995 0 01-.987-.938H4.006A1.997 1.997 0 006 13h5a2 2 0 002-2zm-4.938-.938H3a2 2 0 01-2-2V3a2 2 0 012-2h5.063a2 2 0 012 2v5.063a2 2 0 01-2 2zM3 9.063h5.063a1.001 1.001 0 001-1V3a1.001 1.001 0 00-1-1H3a1.001 1.001 0 00-1 1v5.063a1.001 1.001 0 001 1z", fillRule: "evenodd" })));
exports.SvgExpandAll = SvgExpandAll;
exports.default = SvgExpandAll;
