import { cn } from '@/lib/utils';
import { STEPS } from '@/types/configurator';
import { useScrolled } from '@/hooks/useScrolled';

interface ProgressIndicatorProps {
  currentStep: number;
}

export const ProgressIndicator = ({ currentStep }: ProgressIndicatorProps) => {
  const scrolled = useScrolled(30);
  const displaySteps = STEPS.filter(step => step.id >= 1 && step.id <= 4);
  
  return (
    <div className={cn(
      'flex w-full transition-all duration-300',
      scrolled ? 'h-5 mt-1' : 'h-8 mt-3'
    )}>
      {displaySteps.map((step, index) => {
        const isActive = currentStep === step.id;
        const isCompleted = currentStep > step.id;
        const isFirst = index === 0;
        const isLast = index === displaySteps.length - 1;

        return (
          <div
            key={step.id}
            className={cn(
              'flex-1 flex items-center justify-center relative transition-all duration-300',
              isFirst && 'rounded-r-full',
              isLast && 'rounded-l-full',
              isCompleted && 'bg-success',
              isActive && 'bg-primary',
              !isActive && !isCompleted && 'bg-muted'
            )}
          >
            <span
              className={cn(
                'font-medium transition-all duration-300 whitespace-nowrap',
                scrolled ? 'text-[9px]' : 'text-xs',
                isActive && 'text-primary-foreground',
                isCompleted && 'text-white',
                !isActive && !isCompleted && 'text-muted-foreground'
              )}
            >
              {step.title}
            </span>
          </div>
        );
      })}
    </div>
  );
};
