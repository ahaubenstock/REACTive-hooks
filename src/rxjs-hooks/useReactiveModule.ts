import { useEffect, useMemo, useState } from "react";
import { map, merge, Observable, Subject, scan, share } from "rxjs";

type CommonProperties<A, B> = Pick<
  A,
  {
    [K in keyof A & keyof B]: A[K] extends B[K]
                              ? B[K] extends A[K]
                                ? K
                                : never
                              : never;
  }[keyof A & keyof B]
>;

type Template<A> = { [K in keyof A]: any };

type ObservablesOf<A> = { [K in keyof A]: Observable<A[K]> };

export type ReactiveModule<Output extends object, Input extends object = {}> = {
  initialOutputValues: Output;
  inputTemplate: Template<Input>;
  logic: (
    input: ObservablesOf<Input>
  ) => ObservablesOf<Output>
};

function useSubjectsOf<A>(
  template: Template<A>
): [
  ObservablesOf<A>,
  {
    [K in keyof A]: (value: A[K]) => void
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

function extractSourcesOf<A, B extends A>(
  template: Template<A>,
  sources: { [K in keyof B]: Observable<any> }
): [keyof A, Observable<A[keyof A]>][] {
  const keys = Object.keys(template) as (keyof A)[];
  return keys.map((key: keyof A) => [key, sources[key]]);
}

export default function useReactiveModule<Output extends object, Input extends object>(
  module: ReactiveModule<Output, Input>
): [Output, 
    { [K in keyof Input]: (value: Input[K]) => void }] {
  type Feedback = CommonProperties<Output, Input>
  const {
    initialOutputValues,
    inputTemplate,
    logic,
  } = module;
  const feedbackTemplate = useMemo(
    () => {
      const feedbackTemplateEntries = Object.keys(initialOutputValues)
        .filter(key => key in inputTemplate)
        .map(key => [key, null])
      return Object.fromEntries(feedbackTemplateEntries)
    },
    [initialOutputValues, inputTemplate]
  ) as Template<Feedback>;
  const [inputSources, inputSinks] = useSubjectsOf(inputTemplate);
  const [feedbackInputSources, feedbackSinks] = useSubjectsOf(feedbackTemplate);
  const [feedbackOutputSources, outputSources] = useMemo(() => {
    const logicInput = {
      ...inputSources,
      ...feedbackInputSources
    };
    const logicOutput = logic(logicInput);
    const sharedLogicOutput = Object.fromEntries(
      Object.entries(logicOutput)
        .map(([key, source]: any) => [key, source.pipe(share())])
    ) as ObservablesOf<Output>;
    const feedbackOutputSources = extractSourcesOf(feedbackTemplate, sharedLogicOutput);
    const outputSources = extractSourcesOf(initialOutputValues, sharedLogicOutput);
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
