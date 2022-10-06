import { combineLatest, map, skip, startWith } from "rxjs";
import { ReactiveModule } from "./rxjs-hooks/useReactiveModule";

const module: ReactiveModule<
  {
    greeting: string;
  },
  {
    firstName: string;
    lastName: string;
  },
  {},
  {}
> = {
  initialOutputValues: {
    greeting: "",
  },
  inputTemplate: {
    firstName: null,
    lastName: null,
  },
  outputFeedbackTemplate: {},
  pureFeedbackTemplate: {},
  logic(input) {
    const { firstName, lastName } = input;
    const greeting = combineLatest([
      firstName.pipe(startWith("")),
      lastName.pipe(startWith("")),
    ]).pipe(
      map(([first, last]) => `Hello, ${first} ${last}`),
      skip(1)
    );
    return {
      greeting
    };
  },
};

export default module;
