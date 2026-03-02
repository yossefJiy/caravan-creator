import { Check } from 'lucide-react';
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
      'flex items-center justify-center gap-1 sm:gap-2 transition-all duration-300',
      scrolled ? 'py-1' : 'py-4'
    )}>
      {displaySteps.map((step, index) => {
        const isActive = currentStep === step.id;
        const isCompleted = currentStep > step.id;
        const isLast = index === displaySteps.length - 1;

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'progress-step rounded-full flex items-center justify-center transition-all duration-300',
                  scrolled ? 'w-6 h-6' : 'w-8 h-8 sm:w-10 sm:h-10',
                  isActive && 'bg-primary text-primary-foreground shadow-md',
                  isCompleted && 'bg-success text-white',
                  !isActive && !isCompleted && 'bg-muted text-muted-foreground'
                )}
              >
                {isCompleted ? (
                  <Check className={cn('transition-all duration-300', scrolled ? 'w-3 h-3' : 'w-4 h-4 sm:w-5 sm:h-5')} />
                ) : (
                  <span className={cn('font-semibold transition-all duration-300', scrolled ? 'text-[9px]' : 'text-xs sm:text-sm')}>{step.id}</span>
                )}
              </div>
              <span
                className={cn(
                  'font-medium transition-all duration-300 whitespace-nowrap',
                  scrolled ? 'text-[8px] sm:text-[9px]' : 'text-[10px] sm:text-xs',
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {step.title}
              </span>
            </div>

            {!isLast && (
              <div
                className={cn(
                  'h-0.5 mx-1 sm:mx-2 transition-all duration-300',
                  scrolled ? 'w-4 sm:w-8 mt-[-16px]' : 'w-6 sm:w-12 lg:w-16 mt-[-20px]',
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
