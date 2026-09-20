export default function StepProgress({ steps, currentStep, onStepClick }) {
  const n = steps.length;
  const xs = steps.map((_, i) => ((i + 0.5) / n) * 100);

  return (
    <div className="relative w-full max-w-3xl mx-auto mb-8 md:mb-10 select-none">
      <svg
        className="absolute top-0 left-0 w-full h-8 z-0"
        viewBox="0 0 100 20"
        preserveAspectRatio="none"
      >
        {xs.slice(0, -1).map((x, i) => {
          const x2 = xs[i + 1];
          const mid = (x + x2) / 2;
          const up = i % 2 === 0;
          const c1y = up ? 0 : 20;
          const c2y = up ? 20 : 0;
          const destStep = i + 2;
          const isDone = destStep <= currentStep;
          return (
            <path
              key={i}
              d={`M ${x} 10 C ${mid} ${c1y}, ${mid} ${c2y}, ${x2} 10`}
              fill="none"
              stroke={isDone ? '#1A3A32' : '#D1D5DB'}
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>

      <div className="relative z-10 flex justify-between">
        {steps.map((step, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;
          const clickable = isCompleted;

          return (
            <button
              key={step.key}
              type="button"
              onClick={() => clickable && onStepClick(stepNum)}
              disabled={!clickable}
              className={`flex flex-col items-center gap-2 flex-1 min-w-0 px-1 group ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                  isCompleted
                    ? 'bg-dickens-green border-dickens-green text-white group-hover:scale-105'
                    : isCurrent
                    ? 'bg-dickens-green border-dickens-gold text-white ring-4 ring-dickens-gold/30'
                    : 'bg-gray-200 border-gray-200 text-gray-400'
                }`}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  stepNum
                )}
              </span>
              <span
                className={`text-[11px] md:text-xs text-center leading-tight max-w-[6.5rem] truncate ${
                  isCurrent ? 'text-dickens-green font-semibold' : isCompleted ? 'text-dickens-green font-medium' : 'text-gray-400'
                }`}
              >
                {step.value || step.placeholder}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
