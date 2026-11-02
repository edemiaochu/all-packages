"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgSyncDisabled = void 0;
const react_1 = __importDefault(require("react"));
const SvgSyncDisabled = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M8.17 13H4v2.531L0 12l4-3.531V11h4.17l1 1zM2 5h10v2.531L16 4 12 .469V3H1a1.048 1.048 0 00-1 1v5.844L2 8zm12.12 3.465l-2.121 2.121-2.121-2.121-1.414 1.414L10.585 12l-2.121 2.121 1.414 1.414 2.121-2.121 2.121 2.121 1.414-1.414L13.413 12l2.121-2.121z" })));
exports.SvgSyncDisabled = SvgSyncDisabled;
exports.default = SvgSyncDisabled;
