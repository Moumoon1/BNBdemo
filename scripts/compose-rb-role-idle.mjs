import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const [sourceSheetPath, idleStripPath, outputPath] = process.argv.slice(2);
if (!sourceSheetPath || !idleStripPath || !outputPath) {
  throw new Error('Usage: compose-rb-role-idle <source-sheet> <idle-strip> <output>');
}

const CELL_WIDTH = 56;
const CELL_HEIGHT = 67;
const COLUMNS = 6;
const ROWS = 4;
const IDLE_DIRECTIONS = 4;
const MAX_IDLE_WIDTH = 52;
const MAX_IDLE_HEIGHT = 65;

function findAlphaBounds(data, width, height) {
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] <= 8) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }

  if (right < left || bottom < top) throw new Error('No visible sprite found in source region');
  return { left, top, width: right - left + 1, height: bottom - top + 1, bottom };
}

async function getCellBaseline(sheetBuffer, row) {
  const { data, info } = await sharp(sheetBuffer)
    .extract({ left: 0, top: row * CELL_HEIGHT, width: CELL_WIDTH, height: CELL_HEIGHT })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return findAlphaBounds(data, info.width, info.height).bottom;
}

async function createIdleCell(idleBuffer, idleWidth, idleHeight, index, baseline) {
  const partitionLeft = Math.round(index * idleWidth / IDLE_DIRECTIONS);
  const partitionRight = Math.round((index + 1) * idleWidth / IDLE_DIRECTIONS);
  const partitionWidth = partitionRight - partitionLeft;
  const { data, info } = await sharp(idleBuffer)
    .extract({ left: partitionLeft, top: 0, width: partitionWidth, height: idleHeight })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const bounds = findAlphaBounds(data, info.width, info.height);
  const scale = Math.min(MAX_IDLE_WIDTH / bounds.width, MAX_IDLE_HEIGHT / bounds.height);
  const width = Math.max(1, Math.round(bounds.width * scale));
  const height = Math.max(1, Math.round(bounds.height * scale));
  const sprite = await sharp(data, { raw: info })
    .extract({ left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height })
    .resize(width, height, { kernel: sharp.kernel.nearest })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: CELL_WIDTH,
      height: CELL_HEIGHT,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{
      input: sprite,
      left: Math.round((CELL_WIDTH - width) / 2),
      top: Math.max(0, Math.min(CELL_HEIGHT - height, baseline - height + 1)),
    }])
    .png()
    .toBuffer();
}

const sourceSheet = await sharp(sourceSheetPath).ensureAlpha().png().toBuffer();
const idleStrip = await sharp(idleStripPath).ensureAlpha().png().toBuffer();
const idleMeta = await sharp(idleStrip).metadata();
if (!idleMeta.width || !idleMeta.height) throw new Error('Invalid idle strip');

const composites = [];
for (let row = 0; row < ROWS; row += 1) {
  const baseline = await getCellBaseline(sourceSheet, row);
  const idleCell = await createIdleCell(idleStrip, idleMeta.width, idleMeta.height, row, baseline);
  const walkingFrames = await sharp(sourceSheet)
    .extract({
      left: CELL_WIDTH,
      top: row * CELL_HEIGHT,
      width: CELL_WIDTH * (COLUMNS - 1),
      height: CELL_HEIGHT,
    })
    .png()
    .toBuffer();

  composites.push({ input: idleCell, left: 0, top: row * CELL_HEIGHT });
  composites.push({ input: walkingFrames, left: CELL_WIDTH, top: row * CELL_HEIGHT });
}

await sharp({
  create: {
    width: CELL_WIDTH * COLUMNS,
    height: CELL_HEIGHT * ROWS,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite(composites)
  .png()
  .toFile(outputPath);
