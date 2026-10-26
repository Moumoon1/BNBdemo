export interface DepthSortable {
  getSortY(): number;
  setDepth(depth: number): unknown;
}

export class DepthSortSystem {
  sort(objects: readonly DepthSortable[]): void {
    objects.forEach((object) => object.setDepth(object.getSortY()));
  }
}
