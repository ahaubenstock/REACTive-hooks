import { useEffect, useMemo, useState } from "react";
import { map, merge, Observable, ReplaySubject, scan } from "rxjs";

type InputSources<Inputs> = {
  [Key in keyof Inputs]: Observable<Inputs[Key]>;
};

type Setters<Inputs> = {
  [Key in keyof Inputs as `set${Capitalize<string & Key>}`]: (
    value: Inputs[Key]
  ) => void;
};

export type ReactiveModule<Inputs, Outputs> = {
  inputValueTemplate: {
    [Key in keyof Inputs]: null;
  };
  initialOutputValues: Outputs;
  logic: (inputSources: InputSources<Inputs>) => {
    [Key in keyof Outputs]: Observable<Outputs[Key]>;
  };
};

export default function useReactiveModule<Inputs, Outputs>(
  module: ReactiveModule<Inputs, Outputs>
): [Outputs, Setters<Inputs>] {
  const { inputValueTemplate, initialOutputValues, logic } = module;
  const inputSourcesAndSinks = useMemo(() => {
    const inputKeys = Object.keys(inputValueTemplate) as (keyof Inputs)[];
    return inputKeys.map((key) => {
      const subject = new ReplaySubject<Inputs[typeof key]>(1);
      const source = subject.asObservable();
      const sink = (value: Inputs[typeof key]) => subject.next(value);
      const value = { source, sink };
      return [key, value] as [keyof Inputs, typeof value];
    });
  }, [inputValueTemplate]);
  const [outputs, setOutputs] = useState(initialOutputValues);
  useEffect(() => {
    const inputSourceEntries = inputSourcesAndSinks.map(([key, value]) => [
      key,
      value.source,
    ]);
    const inputSources = Object.fromEntries(
      inputSourceEntries
    ) as InputSources<Inputs>;
    const outputSources = logic(inputSources);
    const outputSourceEntries = Object.entries(outputSources) as [
      keyof Outputs,
      Observable<Outputs[keyof Outputs]>
    ][];
    const actions = outputSourceEntries.map(([key, source]) =>
      source.pipe(map((value) => [key, value]))
    ) as Observable<[keyof Outputs, Outputs[keyof Outputs]]>[];
    const subscription = merge(...actions)
      .pipe(
        scan(
          (acc, [key, value]) => ({
            ...acc,
            [key]: value,
          }),
          initialOutputValues
        )
      )
      .subscribe(setOutputs);
    return () => subscription.unsubscribe();
  }, [inputSourcesAndSinks, logic, initialOutputValues]);
  const setters = useMemo(() => {
    const setterEntries = inputSourcesAndSinks.map(([key, value]) => {
      const keyString = key as string;
      const setterKey = `set${keyString
        .charAt(0)
        .toUpperCase()}${keyString.slice(1)}`;
      return [setterKey, value.sink];
    });
    return Object.fromEntries(setterEntries) as Setters<Inputs>;
  }, [inputSourcesAndSinks]);
  return [outputs, setters];
}
