import { useCallback, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { ProgressIndicator } from './ProgressIndicator';
import { TypeSelector } from './TypeSelector';
import { SizeSelector } from './SizeSelector';
import { SelectedTruckSummary } from './SelectedTruckSummary';
import { EquipmentSelector } from './EquipmentSelector';
import { ContactForm } from './ContactForm';
import { SuccessScreen } from './SuccessScreen';
import { WelcomeScreen } from './WelcomeScreen';
import { SummaryStep } from './SummaryStep';
import { useTruckData } from '@/hooks/useTruckData';
import { useEquipmentData } from '@/hooks/useEquipmentData';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { ContactDetails } from '@/types/configurator';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StoredState {
  step: number;
  selectedType: string | null;
  selectedSize: string | null;
  selectedEquipment: Record<string, number>;
  contactDetails: ContactDetails | null;
  isSubmitted: boolean;
}

const initialState: StoredState = {
  step: 0, // Start at welcome screen
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Fetch data from database
  const { data: truckTypes = [], isLoading: truckLoading, error: truckError } = useTruckData();
  const { categories, equipment, isLoading: equipmentLoading, error: equipmentError } = useEquipmentData();

  // Convert stored equipment object to Map for component use
  const selectedEquipmentMap = useMemo(
    () => new Map(Object.entries(state.selectedEquipment)),
    [state.selectedEquipment]
  );

  const selectedTruckType = truckTypes.find((t) => t.id === state.selectedType);

  // Get equipment items with names for summary
  const selectedEquipmentItems = useMemo(() => {
    return Object.entries(state.selectedEquipment).map(([id, quantity]) => {
      const item = equipment.find((e) => e.id === id);
      return {
        id,
        name: item?.name || id,
        quantity,
      };
    });
  }, [state.selectedEquipment, equipment]);

  const canProceed = useCallback(() => {
    switch (state.step) {
      case 0:
        return true; // Welcome screen
      case 1:
        return state.contactDetails !== null; // Contact details filled
      case 2:
        return state.selectedType !== null; // Type selected
      case 3:
        return state.selectedSize !== null; // Size selected
      case 4:
        return true; // Equipment is optional
      case 5:
        return true; // Summary - can always submit
      default:
        return false;
    }
  }, [state.step, state.selectedType, state.selectedSize, state.contactDetails]);

  const handleNext = () => {
    if (state.step < 5) {
      setState((prev) => ({ ...prev, step: prev.step + 1 }));
    }
  };

  const handleBack = () => {
    if (state.step > 0) {
      setState((prev) => ({ ...prev, step: prev.step - 1 }));
    }
  };

  const handleGoToStep = (step: number) => {
    setState((prev) => ({ ...prev, step }));
  };

  const handleStart = () => {
    setState((prev) => ({ ...prev, step: 1 }));
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
    setState((prev) => ({ 
      ...prev, 
      contactDetails: details,
      step: 2, // Move to truck type selection
    }));
  };

  const handleFinalSubmit = async () => {
    if (!state.contactDetails) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('leads').insert({
        full_name: `${state.contactDetails.firstName} ${state.contactDetails.lastName}`,
        email: state.contactDetails.email || '',
        phone: state.contactDetails.phone,
        notes: state.contactDetails.notes || null,
        selected_truck_type: selectedTruckType?.nameHe || null,
        selected_truck_size: selectedTruckType?.sizes.find(s => s.id === state.selectedSize)?.name || null,
        selected_equipment: Object.keys(state.selectedEquipment),
      });
      if (error) throw error;
      setState((prev) => ({ ...prev, isSubmitted: true }));
    } catch (error) {
      console.error('Error submitting lead:', error);
      toast({ 
        title: 'שגיאה', 
        description: 'לא הצלחנו לשלוח את הבקשה. נסה שוב.', 
        variant: 'destructive' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    clearState();
  };

  // Welcome screen (step 0)
  if (state.step === 0) {
    return <WelcomeScreen onStart={handleStart} />;
  }

  // Success screen
  if (state.isSubmitted) {
    return <SuccessScreen onReset={handleReset} />;
  }

  const hasSelection = state.selectedType && state.selectedSize;
  const isLoading = truckLoading || equipmentLoading;
  const error = truckError || equipmentError;

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-navy">אליה קרוואנים</h1>
            <span className="text-sm text-muted-foreground">בניית פודטראק</span>
          </div>
          {state.step >= 1 && state.step <= 4 && (
            <ProgressIndicator currentStep={state.step} />
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="container py-8 pb-32">
        {/* Error state */}
        {error && (
          <div className="text-center py-12">
            <p className="text-destructive">שגיאה בטעינת הנתונים</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
            >
              נסה שוב
            </button>
          </div>
        )}

        {/* Step 1: Contact Details */}
        {state.step === 1 && !error && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">שלב 1: פרטים אישיים</h2>
              <p className="text-muted-foreground">
                ספרו לנו קצת על עצמכם כדי שנוכל ליצור איתכם קשר
              </p>
            </div>
            <ContactForm
              onSubmit={handleContactSubmit}
              initialData={state.contactDetails}
              hideSubmitButton={false}
              submitButtonText="המשך לבחירת דגם"
            />
          </div>
        )}

        {/* Step 2: Type Selection */}
        {state.step === 2 && !error && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">שלב 2: בחירת דגם</h2>
              <p className="text-muted-foreground">
                בחרו את סוג הפודטראק המתאים לעסק שלכם
              </p>
            </div>

            {truckLoading ? (
              <LoadingSkeleton />
            ) : (
              <TypeSelector
                truckTypes={truckTypes}
                selectedType={state.selectedType}
                onSelect={handleTypeSelect}
              />
            )}
          </div>
        )}

        {/* Step 3: Size Selection */}
        {state.step === 3 && !error && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">שלב 3: בחירת גודל</h2>
              <p className="text-muted-foreground">
                בחרו את הגודל המתאים לצרכים שלכם
              </p>
            </div>

            {selectedTruckType && (
              <>
                <div className="mb-6">
                  <SelectedTruckSummary
                    truckType={selectedTruckType}
                    selectedSizeId={state.selectedSize}
                    onEdit={() => handleGoToStep(2)}
                    showSize={false}
                  />
                </div>
                <SizeSelector
                  sizes={selectedTruckType.sizes}
                  selectedSize={state.selectedSize}
                  onSelect={handleSizeSelect}
                  truckImage={selectedTruckType.image}
                />
              </>
            )}
          </div>
        )}

        {/* Step 4: Equipment Selection */}
        {state.step === 4 && !error && (
          <div className="animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">שלב 4: בחירת ציוד</h2>
              <p className="text-muted-foreground">
                בחרו את הציוד הנוסף שתרצו להוסיף
              </p>
            </div>

            {hasSelection && selectedTruckType && (
              <div className="mb-6">
                <SelectedTruckSummary
                  truckType={selectedTruckType}
                  selectedSizeId={state.selectedSize!}
                  onEdit={() => handleGoToStep(2)}
                />
              </div>
            )}

            {equipmentLoading ? (
              <LoadingSkeleton />
            ) : (
              <EquipmentSelector
                categories={categories}
                equipment={equipment}
                selectedEquipment={selectedEquipmentMap}
                onToggle={handleEquipmentToggle}
              />
            )}
          </div>
        )}

        {/* Step 5: Summary */}
        {state.step === 5 && !error && selectedTruckType && state.contactDetails && (
          <div className="animate-fade-in">
            <SummaryStep
              truckType={selectedTruckType}
              selectedSizeId={state.selectedSize!}
              contactDetails={state.contactDetails}
              selectedEquipment={selectedEquipmentItems}
              onEditStep={handleGoToStep}
              onSubmit={handleFinalSubmit}
              isSubmitting={isSubmitting}
            />
          </div>
        )}
      </main>

      {/* Fixed bottom navigation - show for steps 1-4 */}
      {state.step >= 1 && state.step <= 4 && !error && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 z-50">
          <div className="container flex items-center justify-between gap-4">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
              <span>חזרה</span>
            </button>

            {state.step !== 1 && (
              <button
                onClick={handleNext}
                disabled={!canProceed() || isLoading}
                className={cn(
                  'flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-lg transition-all duration-200',
                  canProceed() && !isLoading
                    ? 'bg-primary text-primary-foreground shadow-gold hover:opacity-90'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                )}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>{state.step === 4 ? 'לסיכום' : 'לשלב הבא'}</span>
                    <ArrowLeft className="w-5 h-5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
