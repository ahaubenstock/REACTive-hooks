import { useEffect, useMemo, useState } from "react";
import { map, merge, Observable, Subject, scan, share } from "rxjs";

type Setters<Input> = {
  [Key in keyof Input]: (
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
): [
  {
    [Key in keyof T]: Observable<T[Key]>
  },
  {
    [Key in keyof T]: (value: T[Key]) => void
  }
] {
  return useMemo(
    () => {
      const subjectEntries = Object.keys(template)
        .map(key => [key, new Subject<any>()]) as [string, Subject<any>][];
      const sourceEntries = subjectEntries
        .map(([key, subject]) => [key, subject.asObservable()]);
      const sinkEntries = subjectEntries
        .map(([key, subject]) => [key, (value: any) => subject.next(value)]);
      return [Object.fromEntries(sourceEntries), Object.fromEntries(sinkEntries)] as any;
    },
    [template]
  );
}

function extractSourcesOf<T>(
  template: Template<T>,
  sources: { [Key in keyof T]: Observable<any> }
): [keyof T, Observable<T[keyof T]>][] {
  const keys = Object.keys(template) as (keyof T)[];
  return keys.map((key: keyof T) => [key, sources[key]]);
}

export default function useReactiveModule<
  PureOutput,
  Input,
  OutputFeedback,
  PureFeedback
>(
  module: ReactiveModule<PureOutput, Input, OutputFeedback, PureFeedback>
): [OutputFeedback & PureOutput, Setters<Input>] {
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
  ) as Template<OutputFeedback & PureFeedback>;
  const [inputSources, inputSinks] = useSubjectsOf(inputTemplate);
  const [feedbackInputSources, feedbackSinks] = useSubjectsOf(feedbackTemplate);
  const [feedbackOutputSources, outputSources] = useMemo(() => {
    const logicInput = {
      ...inputSources,
      ...feedbackInputSources
    } as LogicInput<Input, PureFeedback, OutputFeedback>;
    const logicOutput = logic(logicInput);
    const sharedLogicOutput = Object.fromEntries(
      Object.entries(logicOutput)
        .map(([key, source]: any) => [key, source.pipe(share())])
    ) as LogicOutput<PureFeedback, OutputFeedback, PureOutput>;
    const feedbackOutputSources = extractSourcesOf(feedbackTemplate, sharedLogicOutput);
    const outputSources = extractSourcesOf(
      initialOutputValues as Template<PureOutput & OutputFeedback>,
      sharedLogicOutput
    );
    return [feedbackOutputSources, outputSources];
  }, [inputSources, feedbackInputSources, logic, feedbackTemplate, initialOutputValues]);
  useEffect(() => {
    const actions = feedbackOutputSources
      .map(([key, source]) => source.pipe(map((value: any) => [value, feedbackSinks[key]])));
    const subscription = merge(...actions).subscribe(([value, sink]) => sink(value));
    return () => subscription.unsubscribe();
  }, [feedbackOutputSources, feedbackSinks])
  const [outputs, setOutputs] = useState(initialOutputValues);
  useEffect(() => {
    const actions = outputSources.map(([key, source]) =>
      source.pipe(map((value: any) => [key, value]))
    );
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
  return [outputs, inputSinks];
}
