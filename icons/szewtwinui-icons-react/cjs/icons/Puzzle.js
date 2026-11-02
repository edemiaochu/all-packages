"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgPuzzle = void 0;
const react_1 = __importDefault(require("react"));
const SvgPuzzle = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M13 10.5c0 1.38.9 2.5 2 2.5.36 0 .71-.12 1-.33v2.98a.35.35 0 01-.35.35h-2.98c.21-.29.33-.64.33-1 0-1.1-1.12-2-2.5-2S8 13.9 8 15c0 .36.12.71.33 1H5.35a.35.35 0 01-.35-.35v-3.3a.35.35 0 00-.35-.35h-.277c-.461 0-.875.219-1.214.531A1.708 1.708 0 012 13c-1.1 0-2-1.12-2-2.5S.9 8 2 8c.434 0 .836.172 1.159.469.34.312.753.531 1.214.531h.277A.35.35 0 005 8.65v-3.3A.35.35 0 015.35 5h3.3A.35.35 0 009 4.65v-.277c0-.461-.219-.875-.531-1.214A1.708 1.708 0 018 2c0-1.1 1.12-2 2.5-2S13 .9 13 2c0 .434-.172.836-.469 1.159-.312.34-.531.753-.531 1.214v.277c0 .193.157.35.35.35h3.3a.35.35 0 01.35.35v2.98c-.29-.21-.64-.33-1-.33-1.1 0-2 1.12-2 2.5" })));
exports.SvgPuzzle = SvgPuzzle;
exports.default = SvgPuzzle;
