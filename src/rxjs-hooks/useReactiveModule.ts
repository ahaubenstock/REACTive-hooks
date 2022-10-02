import { useEffect, useMemo, useState } from "react";
import { Observable, ReplaySubject } from "rxjs";

export type ReactiveModule<Inputs, Outputs> = {
  inputValueTemplate: {
    [Key in keyof Inputs]: null;
  };
  initialOutputValues: {
    [Key in keyof Outputs]: Outputs[Key];
  };
  logic: (inputs: {
    [Key in keyof Inputs]: Observable<Inputs[Key]>;
  }) => {
    [Key in keyof Outputs]: Observable<Outputs[Key]>;
  };
};

export default function useReactiveModule<Inputs, Outputs>(
  module: ReactiveModule<Inputs, Outputs>
): [
  {
    [Key in keyof Outputs]: Outputs[Key];
  },
  {
    [Key in keyof Inputs as `set${Capitalize<string & Key>}`]: (
      value: Inputs[Key]
    ) => void;
  }
] {
  const { inputValueTemplate, initialOutputValues, logic } = module;
  const inputKeys = Object.keys(inputValueTemplate) as (keyof Inputs)[];
  const inputSourcesAndSinks = inputKeys.map((key) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useMemo(() => {
      const subject = new ReplaySubject<Inputs[typeof key]>(1);
      const source = subject.asObservable();
      const sink = (value: Inputs[typeof key]) => subject.next(value);
      const value = { source, sink };
      return [key, value] as [keyof Inputs, typeof value];
    }, [key])
  );
  const inputSourceEntries = inputSourcesAndSinks.map(([key, value]) => [
    key,
    value.source,
  ]);
  const inputSources = Object.fromEntries(inputSourceEntries) as {
    [Key in keyof Inputs]: Observable<Inputs[Key]>;
  };
  const outputSources = logic(inputSources);
  const outputKeys = Object.keys(initialOutputValues) as (keyof Outputs)[];
  const outputEntries = outputKeys.map((key) => {
    const source = outputSources[key];
    const initialValue = initialOutputValues[key];
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [value, setValue] = useState(initialValue);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      const subscription = source.subscribe(setValue);
      return () => subscription.unsubscribe();
    }, [source, initialValue]);
    return [key, value];
  });
  const outputs = Object.fromEntries(outputEntries) as {
    [Key in keyof Outputs]: Outputs[Key];
  };
  const setterEntries = inputSourcesAndSinks.map(([key, value]) => {
    const keyString = key as string;
    const setterKey = `set${keyString.charAt(0).toUpperCase()}${keyString.slice(
      1
    )}`;
    return [setterKey, value.sink];
  });
  const setters = Object.fromEntries(setterEntries) as {
    [Key in keyof Inputs as `set${Capitalize<string & Key>}`]: (
      value: Inputs[Key]
    ) => void;
  };
  return [outputs, setters];
}
