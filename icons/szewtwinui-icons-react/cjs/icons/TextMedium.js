"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvgTextMedium = void 0;
const react_1 = __importDefault(require("react"));
const SvgTextMedium = (props) => (react_1.default.createElement("svg", { viewBox: "0 0 16 16", width: "1rem", height: "1rem", fill: "var(--iui-color-icon-muted, currentColor)", ...props },
    react_1.default.createElement("path", { d: "M2.999 2.443a.426.426 0 01.404-.444h9.194a.426.426 0 01.404.444v2.11c0 .244-.122.443-.27.443s-.344-.183-.433-.406l-.35-.708a.674.674 0 00-.567-.406H9.474A.566.566 0 009.001 4v8c0 .244.242.872.455.942l1.162.279a.55.55 0 01.387.453.372.372 0 01-.404.326H5.4a.372.372 0 01-.404-.326.55.55 0 01.387-.453l1.141-.279c.213-.07.478-.698.478-.942V4a.588.588 0 00-.495-.523H4.62a.674.674 0 00-.567.405l-.35.708c-.09.223-.285.406-.433.406S3 4.797 3 4.553v-2.11" })));
exports.SvgTextMedium = SvgTextMedium;
exports.default = SvgTextMedium;
