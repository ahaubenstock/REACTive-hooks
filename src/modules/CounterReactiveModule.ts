import { map, merge, startWith, withLatestFrom } from "rxjs";
import { ReactiveModule } from "../package/useReactiveModule";

const module: ReactiveModule<
  {
    count: number;
  },
  {
    count: number;
    decrementClicked: void;
    incrementClicked: void;
  }
> = {
  initialOutputValues: {
    count: 0,
  },
  inputTemplate: {
    count: null,
    decrementClicked: null,
    incrementClicked: null,
  },
  logic(input) {
    const { decrementClicked, incrementClicked, count } = input;
    const newCount = merge(
      decrementClicked.pipe(map(() => -1)),
      incrementClicked.pipe(map(() => 1))
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
