import {
  combineLatest,
  debounceTime,
  exhaustMap,
  filter,
  map,
  merge,
  scan,
  share,
  shareReplay,
  startWith,
  takeUntil,
  throttleTime,
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
    const filteredDragX = draggedThumb.pipe(
      map(({ x }) => x),
      filter((x) => x > 0), // Sends this coordinate at start and end of drag for some reason
      share()
    );
    const progress = filteredDragX.pipe(
      exhaustMap((x) =>
        filteredDragX.pipe(
          throttleTime(10),
          scan(
            (previous, next) => {
              const [, last] = previous;
              return [last, next] as [number, number];
            },
            [x, x] as [number, number]
          ),
          map(([previous, next]) => previous - next),
          takeUntil(filteredDragX.pipe(debounceTime(100)))
        )
      ),
      map((difference) => difference * 0.005),
      scan((progress, difference) =>
        Math.min(1, Math.max(0, progress + difference))
      ),
      startWith(0),
      shareReplay(1)
    );
    const nullPathDasharray = pathElementChanged.pipe(
      filter((v) => v == null),
      map(() => undefined)
    );
    const progressAndPath = combineLatest([
      progress,
      pathElementChanged.pipe(
        filter((v) => v != null),
        map((v) => v!)
      ),
    ]).pipe(shareReplay(1));
    const validPathDasharray = progressAndPath.pipe(
      map(([progress, path]) => {
        const totalLength = path.getTotalLength();
        const filledLength = totalLength * progress;
        const unfilledLength = totalLength * (1 - progress);
        return `${filledLength},${unfilledLength}`;
      })
    );
    const strokeDasharray = merge(nullPathDasharray, validPathDasharray);
    const thumbPoint = progressAndPath.pipe(
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
