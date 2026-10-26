/**
 * 将剩余秒数转换为 vis Number.png 的四个帧编号：MM:SS。
 * 冒号属于 BG.png，不需要额外文字或图片。
 */
export function getTimerDigitFrames(remainingSeconds: number): readonly number[] {
  const totalSeconds = Math.max(0, Math.ceil(remainingSeconds));
  const minutes = Math.floor(totalSeconds / 60) % 100;
  const seconds = totalSeconds % 60;
  return [
    Math.floor(minutes / 10),
    minutes % 10,
    Math.floor(seconds / 10),
    seconds % 10,
  ];
}
