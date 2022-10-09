import {
  combineLatest,
  distinctUntilChanged,
  filter,
  map,
  merge,
  shareReplay,
  startWith,
  throttleTime,
  withLatestFrom,
} from "rxjs";
import { ReactiveModule } from "../../package/useReactiveModule";

const CircularSliderReactiveModule: ReactiveModule<
  {
    progress: number;
    showProgress: boolean;
    strokeDasharray: string | undefined;
    thumbPoint: DOMPoint;
  },
  {
    pathElementChanged: SVGPathElement | null;
    draggedThumb: { x: number; y: number };
  }
> = {
  initialOutputValues: {
    progress: 0,
    showProgress: false,
    strokeDasharray: undefined,
    thumbPoint: new DOMPoint(-1000, -1000),
  },
  inputTemplate: {
    pathElementChanged: null,
    draggedThumb: null,
  },
  logic(input) {
    const { pathElementChanged, draggedThumb } = input;
    const showProgress = pathElementChanged.pipe(map((v) => v != null));
    const validPathElement = pathElementChanged.pipe(
      filter((v) => v != null),
      map((v) => v!),
      shareReplay(1)
    );
    const progress = draggedThumb.pipe(
      throttleTime(20),
      distinctUntilChanged((lhs, rhs) => lhs.x === rhs.x && lhs.y === rhs.y),
      filter(({ x, y }) => x + y > 0), // Sends the zero coordinate at start and end of drag for some reason
      withLatestFrom(validPathElement),
      map(([dragPoint, path]) => {
        const rect = path.getBoundingClientRect();
        const pathCenter = {
          x: rect.x + rect.width / 2,
          y: rect.y + rect.height / 2,
        };
        const direction = {
          x: dragPoint.x - pathCenter.x,
          y: pathCenter.y - dragPoint.y, // Screen coordinate system
        };
        const thetaFromYAxis = Math.atan2(direction.x, direction.y);
        const twoPi = 2 * Math.PI;
        // Modulus with negative numbers
        const progressTowardsTwoPi = ((thetaFromYAxis % twoPi) + twoPi) % twoPi;
        const fractionOfTwoPi = progressTowardsTwoPi / twoPi;
        const trackShorteningFactor = 0.08;
        const progressOnShortenedTrack = fractionOfTwoPi / (1 - trackShorteningFactor) - trackShorteningFactor / 2;
        return Math.min(1, Math.max(0, progressOnShortenedTrack));
      }),
      startWith(0),
      shareReplay(1)
    );
    const nullPathDasharray = pathElementChanged.pipe(
      filter((v) => v == null),
      map(() => undefined)
    );
    const validPathDasharray = combineLatest([progress, validPathElement]).pipe(
      map(([progress, path]) => {
        const totalLength = path.getTotalLength();
        const filledLength = totalLength * progress;
        const unfilledLength = totalLength * (1 - progress);
        return `${filledLength},${unfilledLength}`;
      })
    );
    const strokeDasharray = merge(nullPathDasharray, validPathDasharray);
    const thumbPoint = combineLatest([progress, validPathElement]).pipe(
      map(([progress, path]) => {
        const filledLength = path.getTotalLength() * progress;
        return path.getPointAtLength(filledLength);
      })
    );
    return {
      progress,
      showProgress,
      strokeDasharray,
      thumbPoint,
    };
  },
};

export default CircularSliderReactiveModule;
