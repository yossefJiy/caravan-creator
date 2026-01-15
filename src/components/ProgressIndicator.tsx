import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STEPS } from '@/types/configurator';

interface ProgressIndicatorProps {
  currentStep: number;
}

export const ProgressIndicator = ({ currentStep }: ProgressIndicatorProps) => {
  // Filter out step 0 (welcome) and step 5 (summary) from progress display
  const displaySteps = STEPS.filter(step => step.id >= 1 && step.id <= 4);
  
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 py-4">
      {displaySteps.map((step, index) => {
        const isActive = currentStep === step.id;
        const isCompleted = currentStep > step.id;
        const isLast = index === displaySteps.length - 1;

        return (
          <div key={step.id} className="flex items-center">
            {/* Step circle */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'progress-step w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300',
                  isActive && 'bg-primary text-primary-foreground shadow-md',
                  isCompleted && 'bg-success text-white',
                  !isActive && !isCompleted && 'bg-muted text-muted-foreground'
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <span className="text-xs sm:text-sm font-semibold">{step.id}</span>
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] sm:text-xs font-medium transition-colors whitespace-nowrap',
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {step.title}
              </span>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div
                className={cn(
                  'w-6 sm:w-12 lg:w-16 h-0.5 mx-1 sm:mx-2 transition-colors mt-[-20px]',
                  isCompleted ? 'bg-success' : 'bg-border'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
