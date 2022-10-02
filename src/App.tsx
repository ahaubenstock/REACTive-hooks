import React, { FunctionComponent } from "react";
import useReactiveModule from "./rxjs-hooks/useReactiveModule";

import AppReactiveModule from "./AppReactiveModule";

const App: FunctionComponent = () => {
  const [{ firstName, lastName, greeting }, { setFirstName, setLastName }] =
    useReactiveModule(AppReactiveModule);
  return (
    <div className="flex flex-col items-center w-[100vw] h-[100vh] space-y-5">
      <h1 className="text-3xl font-bold">{greeting}</h1>
      <input
        className="w-[300px] border border-gray-200"
        value={firstName}
        onChange={(e) => setFirstName(e.currentTarget.value)}
        placeholder="First name"
      />
      <input
        className="w-[300px] border border-gray-200"
        value={lastName}
        onChange={(e) => setLastName(e.currentTarget.value)}
        placeholder="Last name"
      />
    </div>
  );
};

export default App;
