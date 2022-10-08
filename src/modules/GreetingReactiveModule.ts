import { combineLatest, map, skip, startWith } from "rxjs";
import { ReactiveModule } from "../package/useReactiveModule";

const module: ReactiveModule<
  {
    greeting: string;
  },
  {
    setFirstName: string;
    setLastName: string;
  }
> = {
  initialOutputValues: {
    greeting: "",
  },
  inputTemplate: {
    setFirstName: null,
    setLastName: null,
  },
  logic(input) {
    const { setFirstName, setLastName } = input;
    const greeting = combineLatest([
      setFirstName.pipe(startWith("")),
      setLastName.pipe(startWith("")),
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
