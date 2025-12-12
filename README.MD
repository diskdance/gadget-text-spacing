# 优化中文混排字距小工具 / Chinese Inter-script Spacing Optimization Gadget

> [!note]
> 截至 2025 年末，主流浏览器皆已实现 `text-autospace` 属性。因此，本小工具不再积极维护。
> 
> As of the end of 2025, `text-autospace` is supported in all major browsers. As a result, this gadget is not longer in active development.

本 MediaWiki 小工具借助 JavaScript 自动在中文和英文或数字混排时优化字距，以符合 [W3C 中文排版要求](https://www.w3.org/TR/clreq/#mixed_text_composition_in_horizontal_writing_mode)，使排版更美观。

效果类似于 CSS Text Level 4 的 `text-autospace` 属性。

This MediaWiki gadget uses JavaScript to optimize spacing between Chinese with English and with numbers for better appearance, and to comply with [W3C's Requirements for Chinese Text Layout](https://www.w3.org/TR/clreq/#mixed_text_composition_in_horizontal_writing_mode).

The gadget works similar to `text-autospace` in CSS Text Level 4, which is not implemented in major browsers as of writing time (Aug 2023).

## 致谢 / Acknowledgements

本工具在开发过程中受到了 [CJ Typographer](https://github.com/hiugiak/cj-typo) 的启发，特此感谢。

This gadget is inspired by [CJ Typographer](https://github.com/hiugiak/cj-typo).

## 协议 / License

以 3 Clause BSD 协议授权。见 [LICENSE](./LICENSE) 以获取更多信息。

License under 3 Clause BSD. See [LICENSE](./LICENSE) file for more info.
