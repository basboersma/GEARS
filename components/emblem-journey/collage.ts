type Tile = [x: number, y: number, width: number, height: number];

const LONG_SIDE = 1536; //canvas pixels along the part's longer side
const SHORT_SIDE_MIN = 384;
const WIDE_PART = 1.2; //a part wider than this (width / height) counts as wide
const LINE_COLOR = "#f4f2f0"; //same as the homepage background
const LINE_WIDTH = 5;

//where the people are in each photo (0-1 from the left and from the top)
const PHOTO_FOCUS: Record<string, [number, number]> = {
  "/journey/makercie-00.jpg": [0.5, 0.48],
  "/journey/makercie-04.jpg": [0.32, 0.55],
  "/journey/makercie-07.jpg": [0.5, 0.37],
  "/journey/makercie-08.jpg": [0.57, 0.28],
  "/journey/makercie-09.jpg": [0.48, 0.44],
  "/journey/makercie-10.jpg": [0.4, 0.48],
  "/journey/makercie-11.jpg": [0.66, 0.34],
  "/journey/makercie-12.jpg": [0.25, 0.47],
  "/journey/makercie-13.jpg": [0.69, 0.18],
  "/journey/makercie-16.jpg": [0.5, 0.36],
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

//some photos are used on more than one part, so each one only downloads once
const loading = new Map<string, Promise<HTMLImageElement>>();

function loadPhoto(src: string): Promise<HTMLImageElement> {
  let photo = loading.get(src);
  if (!photo) {
    const image = new Image();
    image.src = src;
    photo = image.decode().then(() => image);
    loading.set(src, photo);
  }
  return photo;
}

//one photo fills the whole part. with three, wide parts get the big one on the
//left and two stacked on the right, tall parts get it on top with two below.
function layout(width: number, height: number, count: number): Tile[] {
  if (count === 1) {
    return [[0, 0, width, height]];
  }
  if (width / height > WIDE_PART) {
    return [
      [0, 0, width * 0.52, height],
      [width * 0.52, 0, width * 0.48, height * 0.52],
      [width * 0.52, height * 0.52, width * 0.48, height * 0.48],
    ];
  }
  return [
    [0, 0, width, height * 0.48],
    [0, height * 0.48, width, height * 0.27],
    [0, height * 0.75, width, height * 0.25],
  ];
}

//fills a tile with a photo like css `object-fit: cover`, centred on the people
function drawCover(
  context: CanvasRenderingContext2D,
  photo: HTMLImageElement,
  src: string,
  [x, y, width, height]: Tile
) {
  const [focusX, focusY] = PHOTO_FOCUS[src] ?? [0.5, 0.5];
  const { naturalWidth, naturalHeight } = photo;
  const zoom = Math.max(width / naturalWidth, height / naturalHeight);
  const cropWidth = width / zoom;
  const cropHeight = height / zoom;
  //faces look better a bit above the middle
  const cropX = clamp(
    focusX * naturalWidth - cropWidth / 2,
    0,
    naturalWidth - cropWidth
  );
  const cropY = clamp(
    focusY * naturalHeight - cropHeight * 0.4,
    0,
    naturalHeight - cropHeight
  );

  context.drawImage(
    photo,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    x,
    y,
    width,
    height
  );
}

function drawDividers(context: CanvasRenderingContext2D, tiles: Tile[]) {
  context.strokeStyle = LINE_COLOR;
  context.lineWidth = LINE_WIDTH;
  context.beginPath();
  for (const [x, y, width, height] of tiles) {
    if (x > 0) {
      context.moveTo(x, y);
      context.lineTo(x, y + height);
    }
    if (y > 0) {
      context.moveTo(x, y);
      context.lineTo(x + width, y);
    }
  }
  context.stroke();
}

export async function createCollage(sources: string[], aspect: number) {
  const photos = await Promise.all(sources.map(loadPhoto));
  const canvas = document.createElement("canvas");
  canvas.width =
    aspect >= 1 ? LONG_SIDE : Math.max(SHORT_SIDE_MIN, LONG_SIDE * aspect);
  canvas.height =
    aspect >= 1 ? Math.max(SHORT_SIDE_MIN, LONG_SIDE / aspect) : LONG_SIDE;

  const context = canvas.getContext("2d");
  if (!context) {
    return canvas;
  }
  const tiles = layout(canvas.width, canvas.height, photos.length);
  for (const [i, tile] of tiles.entries()) {
    drawCover(context, photos[i], sources[i], tile);
  }
  drawDividers(context, tiles);
  return canvas;
}
