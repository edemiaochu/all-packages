"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgPrintSettings = void 0;
const react_1 = __importDefault(require("react"));
const SvgPrintSettings = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M3.5 2.625h-.875V.875A.827.827 0 013.5 0h7a.827.827 0 01.875.875v1.75H10.5V.875h-7zm.875 6.125h3.854a4.975 4.975 0 00-.603.875H4.375zm8.85-5.25a.824.824 0 00-.1 0H.875A.827.827 0 000 4.375v5.25a.827.827 0 00.875.875h1.75v2.625A.827.827 0 003.5 14h3.922a4.96 4.96 0 01-.284-.875H3.5v-5.25h5.679A4.97 4.97 0 0114 7.422V4.375a.827.827 0 00-.775-.875zm-.1 1.75a.875.875 0 01-1.75 0 .876.876 0 111.75 0zm-5.87 5.25a4.945 4.945 0 00-.192.875H4.375V10.5zM16 12.712v-1.427l-1.101-.222a3.03 3.03 0 00-.188-.451l.62-.935-1.008-1.01-.933.62a3.03 3.03 0 00-.456-.19l-.22-1.094h-1.427l-.221 1.094a3.024 3.024 0 00-.459.191l-.928-.617-1.01 1.01.62.931a3.027 3.027 0 00-.19.458l-1.094.22v1.428l1.1.221a3.03 3.03 0 00.19.452l-.621.935 1.009 1.01.94-.625a3.024 3.024 0 00.446.186L11.292 16h1.427l.223-1.107a3.026 3.026 0 00.444-.186l.94.625 1.01-1.01-.625-.94a3.029 3.029 0 00.186-.447zm-4 .807a1.523 1.523 0 111.523-1.523A1.523 1.523 0 0112 13.519z" })));
exports.SvgPrintSettings = SvgPrintSettings;
exports.default = SvgPrintSettings;
