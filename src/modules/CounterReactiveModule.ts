import { map, merge, startWith, withLatestFrom } from "rxjs";
import { ReactiveModule } from "../package/useReactiveModule";

const module: ReactiveModule<
  {
    count: number;
  },
  {
    count: number;
    decrement: void;
    increment: void;
  }
> = {
  initialOutputValues: {
    count: 0,
  },
  inputTemplate: {
    count: null,
    decrement: null,
    increment: null,
  },
  logic(input) {
    const { decrement, increment, count } = input;
    const newCount = merge(
      decrement.pipe(map(() => -1)),
      increment.pipe(map(() => 1))
    ).pipe(
      withLatestFrom(count.pipe(startWith(0))),
      map(([offset, count]) => count + offset)
    );
    return {
      count: newCount,
    };
  },
};

export default module;
