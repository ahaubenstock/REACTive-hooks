import { map } from "rxjs";
import { ReactiveModule } from "./package/useReactiveModule";

const ComponentReactiveModule: ReactiveModule<
  {
    progress: string;
  },
  {
    progressChanged: number;
  }
> = {
  initialOutputValues: {
    progress: "0%",
  },
  inputTemplate: {
    progressChanged: null,
  },
  logic(input) {
    const { progressChanged } = input;
    const progress = progressChanged.pipe(
      map((v) => Math.round(v * 100)),
      map((v) => `${v}%`)
    );
    return {
      progress,
    };
  },
};

export default ComponentReactiveModule;
