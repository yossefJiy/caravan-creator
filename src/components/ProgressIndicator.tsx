import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STEPS } from '@/types/configurator';

interface ProgressIndicatorProps {
  currentStep: number;
}

export const ProgressIndicator = ({ currentStep }: ProgressIndicatorProps) => {
  return (
    <div className="flex items-center justify-center gap-2 py-6">
      {STEPS.map((step, index) => {
        const isActive = currentStep === step.id;
        const isCompleted = currentStep > step.id;
        const isLast = index === STEPS.length - 1;

        return (
          <div key={step.id} className="flex items-center">
            {/* Step circle */}
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  'progress-step',
                  isActive && 'active',
                  isCompleted && 'completed',
                  !isActive && !isCompleted && 'pending'
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-semibold">{step.id}</span>
                )}
              </div>
              <span
                className={cn(
                  'text-xs font-medium transition-colors hidden sm:block',
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
                  'w-12 sm:w-20 h-0.5 mx-2 sm:mx-4 transition-colors mt-[-24px] sm:mt-0',
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
