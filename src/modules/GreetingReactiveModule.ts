import { combineLatest, map, skip, startWith } from "rxjs";
import { ReactiveModule } from "../package/useReactiveModule";

const module: ReactiveModule<
  {
    greeting: string;
  },
  {
    firstNameChanged: string;
    lastNameChanged: string;
  }
> = {
  initialOutputValues: {
    greeting: "",
  },
  inputTemplate: {
    firstNameChanged: null,
    lastNameChanged: null,
  },
  logic(input) {
    const { firstNameChanged, lastNameChanged } = input;
    const greeting = combineLatest([
      firstNameChanged.pipe(startWith("")),
      lastNameChanged.pipe(startWith("")),
    ]).pipe(
      map(([first, last]) => `Hello, ${first} ${last}`),
      skip(1)
    );
    return {
      greeting,
    };
  },
};

export default module;
