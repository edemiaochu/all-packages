"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgFolderChevronUp = void 0;
const react_1 = __importDefault(require("react"));
const SvgFolderChevronUp = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M14 4H7V3a1.075 1.075 0 00-1-1H2a1.075 1.075 0 00-1 1v10a1.075 1.075 0 001 1h12a1.075 1.075 0 001-1V5a1.075 1.075 0 00-1-1zm-1.8 8L8 7.8 3.8 12l-.9-.9L8 6l5.1 5.1z" })));
exports.SvgFolderChevronUp = SvgFolderChevronUp;
exports.default = SvgFolderChevronUp;
