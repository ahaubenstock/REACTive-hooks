import { FunctionComponent, useEffect, useRef } from "react";
import useReactiveModule from "../../package/useReactiveModule";
import CircularSliderReactiveModule from "./CircularSliderReactiveModule";

type Props = {
  onProgressChanged?: (progress: number) => void;
};
const CircularSlider: FunctionComponent<Props> = ({ onProgressChanged }) => {
  const [
    { progress, showProgress, strokeDasharray, thumbPoint },
    { pathElementChanged, draggedThumb },
  ] = useReactiveModule(CircularSliderReactiveModule);
  const path = "M 70 20 A 40 40 0 1 1 30 20";
  const width = 200;
  const blankCanvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (onProgressChanged !== undefined) {
      onProgressChanged(progress);
    }
  }, [onProgressChanged, progress]);
  return (
    <div className="relative" style={{ width }}>
      <svg viewBox="0 0 100 100" width={200}>
        <path
          id="track"
          d={path}
          className="stroke-slate-200 fill-transparent"
          stroke="lightgray"
          strokeLinecap="round"
          strokeWidth={5}
        />
        <path
          id="progress"
          ref={pathElementChanged}
          d={path}
          className={`fill-transparent ${
            showProgress ? "stroke-blue-500" : "stroke-transparent"
          }`}
          strokeLinecap="round"
          strokeWidth={5}
          strokeDasharray={strokeDasharray}
        />
      </svg>
      <button
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{
          left: (width / 100) * thumbPoint.x,
          top: (width / 100) * thumbPoint.y,
        }}
        draggable
        onDragStart={(e) =>
          e.dataTransfer.setDragImage(blankCanvasRef.current!, 0, 0)
        }
        onDrag={(e) => draggedThumb({ x: e.pageX, y: e.pageY })}
      >
        <svg
          viewBox="0 0 100 100"
          width="20"
          className="drop-shadow-md hover:scale-125"
        >
          <circle cx={50} cy={50} r={50} className="fill-slate-100" />
        </svg>
      </button>
      <canvas ref={blankCanvasRef} />
    </div>
  );
};

export default CircularSlider;
