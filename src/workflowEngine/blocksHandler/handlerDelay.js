import renderString from '../templating/renderString';

const DEFAULT_DELAY_MS = 500;
const MAX_TIMEOUT_MS = 2 ** 31 - 1; // setTimeout max in browsers (clamped)

function normalizeDelayMs(value) {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return DEFAULT_DELAY_MS;
  if (n < 0) return 0;
  if (n > MAX_TIMEOUT_MS) return MAX_TIMEOUT_MS;
  return Math.floor(n);
}

export default async function delay({ id, data }, { refData }) {
  let delayValue = data.time;
  const replacedValue = {};
  if (data?.replacedValue && typeof data.replacedValue === 'object') {
    Object.assign(replacedValue, data.replacedValue);
  }

  // Extra safety: even if block templating didn't run for some reason,
  // allow Delay to resolve mustache tags at execution time.
  if (typeof delayValue === 'string') {
    const rendered = await renderString(
      delayValue,
      refData,
      this.engine.isPopup
    );
    delayValue = rendered.value;
    if (rendered?.list) Object.assign(replacedValue, rendered.list);
  }

  const delayMs = normalizeDelayMs(delayValue);

  return new Promise((resolve) => {
    setTimeout(() => {
      const hasReplacedValue = Object.keys(replacedValue).length > 0;
      resolve({
        data: '',
        ...(hasReplacedValue ? { replacedValue } : {}),
        nextBlockId: this.getBlockConnections(id),
      });
    }, delayMs);
  });
}
