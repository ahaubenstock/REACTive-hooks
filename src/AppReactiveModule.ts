import { combineLatest, map, skip, startWith } from "rxjs";
import { ReactiveModule } from "./rxjs-hooks/useReactiveModule";

const module: ReactiveModule<
  {
    firstName: string;
    lastName: string;
  },
  {
    greeting: string;
  }
> = {
  inputValueTemplate: {
    firstName: null,
    lastName: null,
  },
  initialOutputValues: {
    greeting: "",
  },
  logic(inputs) {
    const { firstName, lastName } = inputs;
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
