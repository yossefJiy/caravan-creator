import { useCallback, useMemo } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { ProgressIndicator } from './ProgressIndicator';
import { TypeSelector } from './TypeSelector';
import { SizeSelector } from './SizeSelector';
import { SelectedTruckSummary } from './SelectedTruckSummary';
import { EquipmentSelector } from './EquipmentSelector';
import { ContactForm } from './ContactForm';
import { SuccessScreen } from './SuccessScreen';
import { foodTruckTypes } from '@/data/foodtrucks';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { ContactDetails } from '@/types/configurator';
import { cn } from '@/lib/utils';

interface StoredState {
  step: number;
  selectedType: string | null;
  selectedSize: string | null;
  selectedEquipment: Record<string, number>;
  contactDetails: ContactDetails | null;
  isSubmitted: boolean;
}

const initialState: StoredState = {
  step: 1,
  selectedType: null,
  selectedSize: null,
  selectedEquipment: {},
  contactDetails: null,
  isSubmitted: false,
};

const STORAGE_KEY = 'foodtruck-configurator';

export const FoodTruckConfigurator = () => {
  const [state, setState, clearState] = useLocalStorage<StoredState>(
    STORAGE_KEY,
    initialState
  );

  // Convert stored equipment object to Map for component use
  const selectedEquipmentMap = useMemo(
    () => new Map(Object.entries(state.selectedEquipment)),
    [state.selectedEquipment]
  );

  const selectedTruckType = foodTruckTypes.find((t) => t.id === state.selectedType);

  const canProceed = useCallback(() => {
    switch (state.step) {
      case 1:
        return state.selectedType !== null && state.selectedSize !== null;
      case 2:
        return true; // Equipment is optional
      case 3:
        return true;
      default:
        return false;
    }
  }, [state.step, state.selectedType, state.selectedSize]);

  const handleNext = () => {
    if (state.step < 3) {
      setState((prev) => ({ ...prev, step: prev.step + 1 }));
    }
  };

  const handleBack = () => {
    if (state.step > 1) {
      setState((prev) => ({ ...prev, step: prev.step - 1 }));
    }
  };

  const handleGoToStep = (step: number) => {
    setState((prev) => ({ ...prev, step }));
  };

  const handleTypeSelect = (typeId: string) => {
    setState((prev) => ({
      ...prev,
      selectedType: typeId,
      selectedSize: null, // Reset size when type changes
    }));
  };

  const handleSizeSelect = (sizeId: string) => {
    setState((prev) => ({ ...prev, selectedSize: sizeId }));
  };

  const handleEquipmentToggle = (equipmentId: string, quantity: number) => {
    setState((prev) => {
      const newEquipment = { ...prev.selectedEquipment };
      if (quantity <= 0) {
        delete newEquipment[equipmentId];
      } else {
        newEquipment[equipmentId] = quantity;
      }
      return { ...prev, selectedEquipment: newEquipment };
    });
  };

  const handleContactSubmit = (details: ContactDetails) => {
    console.log('Submitting configuration:', {
      type: state.selectedType,
      size: state.selectedSize,
      equipment: state.selectedEquipment,
      contact: details,
    });
    setState((prev) => ({ 
      ...prev, 
      contactDetails: details,
      isSubmitted: true 
    }));
  };

  const handleReset = () => {
    clearState();
  };

  if (state.isSubmitted) {
    return <SuccessScreen onReset={handleReset} />;
  }

  const hasSelection = state.selectedType && state.selectedSize;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-navy">אליה קרוואנים</h1>
            <span className="text-sm text-muted-foreground">בניית פודטראק</span>
          </div>
          <ProgressIndicator currentStep={state.step} />
        </div>
      </header>

      {/* Main content */}
      <main className="container py-8 pb-32">
        {/* Step 1: Type & Size Selection */}
        {state.step === 1 && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">שלב 1: בחירת דגם</h2>
              <p className="text-muted-foreground">
                בחרו את סוג הפודטראק המתאים לעסק שלכם והגודל הרצוי
              </p>
            </div>

            {/* Type selection */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">סוג פודטראק:</h3>
              <TypeSelector
                selectedType={state.selectedType}
                onSelect={handleTypeSelect}
              />
            </div>

            {/* Size selection - shows only after type is selected */}
            {state.selectedType && (
              <div className="animate-fade-in">
                <h3 className="text-lg font-semibold mb-4">בחר גודל:</h3>
                <SizeSelector
                  selectedType={state.selectedType}
                  selectedSize={state.selectedSize}
                  onSelect={handleSizeSelect}
                />
              </div>
            )}
          </div>
        )}

        {/* Step 2: Equipment Selection */}
        {state.step === 2 && (
          <div className="animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">שלב 2: בחירת ציוד</h2>
              <p className="text-muted-foreground">
                בחרו את הציוד הנוסף שתרצו להוסיף
              </p>
            </div>

            {/* Selected truck summary */}
            {hasSelection && (
              <div className="mb-6">
                <SelectedTruckSummary
                  selectedType={state.selectedType!}
                  selectedSize={state.selectedSize!}
                  onEdit={() => handleGoToStep(1)}
                />
              </div>
            )}

            <EquipmentSelector
              selectedEquipment={selectedEquipmentMap}
              onToggle={handleEquipmentToggle}
            />
          </div>
        )}

        {/* Step 3: Contact Details */}
        {state.step === 3 && (
          <div className="animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">שלב 3: פרטי התקשרות</h2>
            </div>

            {/* Selected truck summary */}
            {hasSelection && (
              <div className="mb-6">
                <SelectedTruckSummary
                  selectedType={state.selectedType!}
                  selectedSize={state.selectedSize!}
                  onEdit={() => handleGoToStep(1)}
                />
              </div>
            )}

            <ContactForm
              onSubmit={handleContactSubmit}
              initialData={state.contactDetails}
            />
          </div>
        )}
      </main>

      {/* Fixed bottom navigation */}
      {state.step !== 3 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 z-50">
          <div className="container flex items-center justify-between gap-4">
            {state.step > 1 ? (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors"
              >
                <ArrowRight className="w-5 h-5" />
                <span>חזרה</span>
              </button>
            ) : (
              <div />
            )}

            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={cn(
                'flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-lg transition-all duration-200',
                canProceed()
                  ? 'bg-primary text-primary-foreground shadow-gold hover:opacity-90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              )}
            >
              <span>לשלב הבא</span>
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
