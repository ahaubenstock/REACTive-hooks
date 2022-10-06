import { useEffect, useMemo, useState } from "react";
import { map, merge, Observable, Subject, scan } from "rxjs";

type Setters<Input> = {
  [Key in keyof Input as `set${Capitalize<string & Key>}`]: (
    value: Input[Key]
  ) => void;
};
type LogicInput<Input, PureFeedback, OutputFeedback> = {
  [Key in keyof (Input & PureFeedback & OutputFeedback)]: Observable<
    (Input & PureFeedback & OutputFeedback)[Key]
  >;
};
type LogicOutput<PureFeedback, OutputFeedback, PureOutput> = {
  [Key in keyof (PureFeedback & OutputFeedback & PureOutput)]: Observable<
    (PureFeedback & OutputFeedback & PureOutput)[Key]
  >;
};
type Template<T> = { [Key in keyof T]: any };
export type ReactiveModule<PureOutput, Input = {}, OutputFeedback = {}, PureFeedback = {}> = {
  initialOutputValues: OutputFeedback & PureOutput;
  inputTemplate: Template<Input>;
  outputFeedbackTemplate: Template<OutputFeedback>;
  pureFeedbackTemplate: Template<PureFeedback>;
  logic: (
    input: LogicInput<Input, PureFeedback, OutputFeedback>
  ) => LogicOutput<PureFeedback, OutputFeedback, PureOutput>;
};

function useSubjectsOf<T>(
  template: Template<T>
): [keyof T, Subject<T[keyof T]>][] {
  return useMemo(
    () => Object.keys(template).map((key) => [key, new Subject<T[keyof T]>()]),
    [template]
  ) as [keyof T, Subject<T[keyof T]>][];
}

function getSourcesOf<T>(subjectEntries: [keyof T, Subject<T[keyof T]>][]): {
  [Key in keyof T]: Observable<T[Key]>;
} {
  const sourceEntries = subjectEntries.map(([key, subject]) => [
    key,
    subject.asObservable(),
  ]) as [keyof T, Observable<T[keyof T]>][];
  return Object.fromEntries(sourceEntries) as {
    [Key in keyof T]: Observable<T[Key]>;
  };
}

function extractSourcesOf<T>(
  template: Template<T>,
  sources: { [key: string]: Observable<any> }
): [keyof T, Observable<T[keyof T]>][] {
  return Object.keys(sources)
    .filter((key) => key in template)
    .map((key) => [key, sources[key]]) as [keyof T, Observable<T[keyof T]>][];
}

function getSinksOf<T>(subjectEntries: [keyof T, Subject<T[keyof T]>][]): [keyof T, (value: T[keyof T]) => void][] {
  return subjectEntries.map(([key, subject]) => [
    key,
    (value: T[keyof T]) => subject.next(value),
  ]) as [keyof T, (value: T[keyof T]) => void][];
}

export default function useReactiveModule<
  PureOutput,
  Input,
  OutputFeedback,
  PureFeedback
>(
  module: ReactiveModule<PureOutput, Input, OutputFeedback, PureFeedback>
): [OutputFeedback & PureOutput, Setters<Input>] {
  type Feedback = PureFeedback & OutputFeedback;
  type Outputs = OutputFeedback & PureOutput;
  const {
    inputTemplate,
    pureFeedbackTemplate,
    outputFeedbackTemplate,
    initialOutputValues,
    logic,
  } = module;
  const feedbackTemplate = useMemo(
    () => ({
      ...pureFeedbackTemplate,
      ...outputFeedbackTemplate,
    }),
    [pureFeedbackTemplate, outputFeedbackTemplate]
  ) as Template<PureFeedback & OutputFeedback>;
  const inputSubjects = useSubjectsOf(inputTemplate);
  const feedbackSubjects = useSubjectsOf(feedbackTemplate);
  const [feedbackSources, outputSources] = useMemo(() => {
    const logicInput = {
      ...getSourcesOf(inputSubjects),
      ...getSourcesOf(feedbackSubjects),
    } as LogicInput<Input, PureFeedback, OutputFeedback>;
    const logicOutput = logic(logicInput);
    const feedbackSources = extractSourcesOf(feedbackTemplate, logicOutput);
    const outputSources = extractSourcesOf(
      initialOutputValues as Template<Outputs>,
      logicOutput
    );
    return [feedbackSources, outputSources];
  }, [inputSubjects, feedbackSubjects, logic, feedbackTemplate, initialOutputValues]);
  useEffect(() => {
    const sinkEntries = getSinksOf(feedbackSubjects)
    const sinks = Object.fromEntries(sinkEntries) as {
      [Key in keyof Feedback]: (value: any) => void
    };
    const actions = feedbackSources.map(([key, source]) => source.pipe(map((value: any) => [value, sinks[key]]))) as Observable<[Feedback[keyof Feedback], (value: Feedback[keyof Feedback]) => void]>[];
    const subscription = merge(...actions).subscribe(([value, sink]) => sink(value));
    return () => subscription.unsubscribe();
  }, [feedbackSubjects, feedbackSources])
  const [outputs, setOutputs] = useState(initialOutputValues);
  useEffect(() => {
    const actions = outputSources.map(([key, source]) =>
      source.pipe(map((value: any) => [key, value]))
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
  }, [outputSources, initialOutputValues]);
  const setters = useMemo(() => {
    const setterEntries = getSinksOf(inputSubjects).map(([key, sink]) => {
      const keyString = key as string;
      const setterKey = `set${keyString
        .charAt(0)
        .toUpperCase()}${keyString.slice(1)}`;
      return [setterKey, sink];
    });
    return Object.fromEntries(setterEntries);
  }, [inputSubjects]);
  return [outputs, setters];
}
