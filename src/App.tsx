import React, { FunctionComponent } from "react";
import useReactiveModule from "./package/useReactiveModule";

import GreetingReactiveModule from "./modules/GreetingReactiveModule";
import CounterReactiveModule from "./modules/CounterReactiveModule";

const App: FunctionComponent = () => {
  const [{ greeting }, { setFirstName, setLastName }] =
    useReactiveModule(GreetingReactiveModule);
    const [{ count }, { decrement, increment }] = useReactiveModule(CounterReactiveModule)
  return (
    <div className="flex flex-col items-center w-[100vw] h-[100vh] space-y-10 pt-5">
      <div className="flex flex-col w-[300px] space-y-4">
        <h1 className="font-bold">Just input</h1>
        <h4>{greeting}</h4>
        <input
          className="border border-gray-200"
          onChange={(e) => setFirstName(e.currentTarget.value)}
          placeholder="First name"
        />
        <input
          className="border border-gray-200"
          onChange={(e) => setLastName(e.currentTarget.value)}
          placeholder="Last name"
        />
      </div>
      <div className="flex flex-col w-[300px]">
        <h1 className="font-bold">Input and feedback</h1>
        <h6>Yes, a counter can be done without feedback</h6>
        <h4 className="self-center">{count}</h4>
        <div className="flex flex-row space-x-5 self-center">
          <button onClick={() => decrement()}>-</button>
          <button onClick={() => increment()}>+</button>
        </div>
      </div>
    </div>
  );
};

export default App;
