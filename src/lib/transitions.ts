export function cardTipFlip(node: Element, { duration = 250 } = {}) {
  const style = getComputedStyle(node);
  const height = parseFloat(style.height);
  const marginTop = parseFloat(style.marginTop) || 0;
  const marginBottom = parseFloat(style.marginBottom) || 0;
  const paddingTop = parseFloat(style.paddingTop) || 0;
  const paddingBottom = parseFloat(style.paddingBottom) || 0;

  return {
    duration,
    css: (t: number) => {
      const angle = (1 - t) * 90;
      const opacity = t;
      const currentHeight = t * height;
      const currentMarginTop = t * marginTop;
      const currentMarginBottom = t * marginBottom;
      const currentPaddingTop = t * paddingTop;
      const currentPaddingBottom = t * paddingBottom;

      return `
        opacity: ${opacity};
        height: ${currentHeight}px;
        margin-top: ${currentMarginTop}px;
        margin-bottom: ${currentMarginBottom}px;
        padding-top: ${currentPaddingTop}px;
        padding-bottom: ${currentPaddingBottom}px;
        transform: perspective(900px) rotateX(${angle}deg);
        transform-origin: top center;
        overflow: hidden;
      `;
    },
  };
}
