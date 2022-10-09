import React, { FunctionComponent } from "react";
import useReactiveModule from "./package/useReactiveModule";

import GreetingReactiveModule from "./GreetingReactiveModule";
import CounterReactiveModule from "./CounterReactiveModule";
import CircularSlider from "./component/CircularSlider/CircularSlider";
import ComponentReactiveModule from "./ComponentReactiveModule";

const App: FunctionComponent = () => {
  const [{ greeting }, { firstNameChanged, lastNameChanged }] =
    useReactiveModule(GreetingReactiveModule);
  const [{ count }, { decrementClicked, incrementClicked }] = useReactiveModule(
    CounterReactiveModule
  );
  const [{ progress }, { progressChanged }] = useReactiveModule(
    ComponentReactiveModule
  );
  return (
    <div className="flex flex-col items-center w-[100vw] h-[100vh]">
      <div className="flex flex-col w-[300px] space-y-10  pt-5">
        <div className="flex flex-col space-y-2">
          <h1 className="font-bold">Input</h1>
          <h4>{greeting}</h4>
          <input
            className="border border-gray-200"
            onChange={(e) => firstNameChanged(e.currentTarget.value)}
            placeholder="First name"
          />
          <input
            className="border border-gray-200"
            onChange={(e) => lastNameChanged(e.currentTarget.value)}
            placeholder="Last name"
          />
        </div>
        <div className="flex flex-col space-y-2">
          <h1 className="font-bold">Input and feedback</h1>
          <h6>Yes, a counter can be done without feedback</h6>
          <h4 className="self-center">{count}</h4>
          <div className="flex flex-row space-x-5 self-center">
            <button onClick={() => decrementClicked()}>-</button>
            <button onClick={() => incrementClicked()}>+</button>
          </div>
        </div>
        <div className="flex flex-col space-y-2">
          <h1 className="font-bold">Custom reactive component</h1>
          <h4 className="self-center">{progress}</h4>
          <div className="self-center">
            <CircularSlider onProgressChanged={progressChanged} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
