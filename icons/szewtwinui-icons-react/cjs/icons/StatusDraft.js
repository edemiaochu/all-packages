"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgStatusDraft = void 0;
const react_1 = __importDefault(require("react"));
const SvgStatusDraft = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M4.794 9.744L6.2 11.15l-.563.562H5.02v-.787h-.79v-.619zM16 8a8 8 0 11-8-8 8 8 0 018 8zm-5.075-.45L8.45 5.075l-4.95 4.95V12.5h2.475zM12.5 5.637a1.344 1.344 0 00-.112-.506L10.98 3.725a.816.816 0 00-1.125 0l-1.012.956 2.419 2.531L12.275 6.2a.722.722 0 00.225-.563z" })));
exports.SvgStatusDraft = SvgStatusDraft;
exports.default = SvgStatusDraft;
