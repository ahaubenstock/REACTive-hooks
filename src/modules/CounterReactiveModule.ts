import { map, merge, share, startWith, withLatestFrom } from "rxjs";
import { ReactiveModule } from "../rxjs-hooks/useReactiveModule";

const module: ReactiveModule<
  {
    count: string;
  },
  {
    decrement: void;
    increment: void;
  },
  {},
  {
    countNumber: number;
  }
> = {
  initialOutputValues: {
    count: "0",
  },
  inputTemplate: {
    decrement: null,
    increment: null,
  },
  outputFeedbackTemplate: {},
  pureFeedbackTemplate: {
    countNumber: null,
  },
  logic(input) {
    const { decrement, increment, countNumber } = input;
    const newCountNumber = merge(
      decrement.pipe(map(() => -1)),
      increment.pipe(map(() => 1))
    ).pipe(
      withLatestFrom(countNumber.pipe(startWith(0))),
      map(([offset, count]) => count + offset),
      share()
    );
    const count = newCountNumber.pipe(map((number) => `${number}`));
    return {
      count,
      countNumber: newCountNumber,
    };
  },
};

export default module;
