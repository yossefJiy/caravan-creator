import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { useSiteContent } from '@/hooks/useSiteContent';
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
  partialLeadId: string | null; // Track partial lead for updates
}

const initialState: StoredState = {
  step: 0, // Start at welcome screen
  selectedType: null,
  selectedSize: null,
  selectedEquipment: {},
  contactDetails: null,
  isSubmitted: false,
  partialLeadId: null,
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
  const { getContent } = useSiteContent();

  // Convert stored equipment object to Map for component use (normalize quantities to numbers)
  const selectedEquipmentMap = useMemo(
    () =>
      new Map(
        Object.entries(state.selectedEquipment).map(([id, qty]) => [id, Number(qty)] as const)
      ),
    [state.selectedEquipment]
  );

  const selectedTruckType = truckTypes.find((t) => t.id === state.selectedType);

  // Get equipment items with names for summary - only items with quantity > 0 and that exist in current equipment list
  const selectedEquipmentItems = useMemo(() => {
    return Object.entries(state.selectedEquipment)
      .map(([id, quantity]) => ({ id, quantity: Number(quantity) }))
      .filter(({ quantity }) => Number.isFinite(quantity) && quantity > 0)
      .map(({ id, quantity }) => {
        const item = equipment.find((e) => e.id === id);
        if (!item) return null;
        // Include description/notes in the display name if available
        const displayName = item.description 
          ? `${item.name} (${item.description})`
          : item.name;
        return {
          id,
          name: displayName,
          quantity,
        };
      })
      .filter((x): x is { id: string; name: string; quantity: number } => x !== null);
  }, [state.selectedEquipment, equipment]);

  // Normalize/cleanup legacy localStorage values (e.g., string quantities or items that no longer exist)
  useEffect(() => {
    if (equipmentLoading || equipmentError) return;
    if (equipment.length === 0) return;

    const validIds = new Set(equipment.map((e) => e.id));

    setState((prev) => {
      const cleaned: Record<string, number> = {};

      for (const [id, rawQty] of Object.entries(prev.selectedEquipment)) {
        if (!validIds.has(id)) continue;
        const qty = Number(rawQty);
        if (!Number.isFinite(qty) || qty <= 0) continue;
        cleaned[id] = qty;
      }

      const serialize = (obj: Record<string, unknown>) =>
        Object.entries(obj)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, v]) => `${k}:${Number(v)}`)
          .join('|');

      if (serialize(prev.selectedEquipment) === serialize(cleaned)) return prev;
      return { ...prev, selectedEquipment: cleaned };
    });
  }, [equipment, equipmentError, equipmentLoading, setState]);

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
      const safeQty = Number(quantity);

      if (!Number.isFinite(safeQty) || safeQty <= 0) {
        delete newEquipment[equipmentId];
      } else {
        newEquipment[equipmentId] = safeQty;
      }

      return { ...prev, selectedEquipment: newEquipment };
    });
  };

  const handleClearEquipment = () => {
    setState((prev) => ({ ...prev, selectedEquipment: {} }));
  };

  const handleContactSubmit = async (details: ContactDetails) => {
    // Save partial lead immediately after collecting contact details
    try {
      const fullName = `${details.firstName} ${details.lastName}`;
      
      const { data: partialLead, error } = await supabase.from('leads').insert({
        full_name: fullName,
        email: details.email || null,
        phone: details.phone,
        notes: details.notes || null,
        status: 'new',
        is_complete: false,
        privacy_accepted: true,
        privacy_accepted_at: new Date().toISOString(),
      }).select('id').single();
      
      if (error) {
        console.error('Error saving partial lead:', error);
      }
      
      setState((prev) => ({ 
        ...prev, 
        contactDetails: details,
        step: 2, // Move to truck type selection
        partialLeadId: partialLead?.id || null,
      }));
    } catch (error) {
      console.error('Error saving partial lead:', error);
      // Continue anyway - don't block the user
      setState((prev) => ({ 
        ...prev, 
        contactDetails: details,
        step: 2,
      }));
    }
  };

  const handleFinalSubmit = async () => {
    if (!state.contactDetails) return;
    
    setIsSubmitting(true);
    try {
      const fullName = `${state.contactDetails.firstName} ${state.contactDetails.lastName}`;
      const truckTypeName = selectedTruckType?.nameHe || null;
      const truckSizeName = selectedTruckType?.sizes.find(s => s.id === state.selectedSize)?.name || null;
      
      // Build equipment list with names and quantities (human-readable)
      const equipmentNames = selectedEquipmentItems.map(item => 
        item.quantity > 1 ? `${item.name} (×${item.quantity})` : item.name
      );

      let leadId = state.partialLeadId;

      if (leadId) {
        // Update existing partial lead
        const { error } = await supabase.from('leads')
          .update({
            full_name: fullName,
            email: state.contactDetails.email || null,
            phone: state.contactDetails.phone,
            notes: state.contactDetails.notes || null,
            selected_truck_type: truckTypeName,
            selected_truck_size: truckSizeName,
            selected_equipment: equipmentNames,
            is_complete: true,
          })
          .eq('id', leadId);
        
        if (error) throw error;
      } else {
        // Create new lead if no partial exists
        const { data: insertedLead, error } = await supabase.from('leads').insert({
          full_name: fullName,
          email: state.contactDetails.email || null,
          phone: state.contactDetails.phone,
          notes: state.contactDetails.notes || null,
          selected_truck_type: truckTypeName,
          selected_truck_size: truckSizeName,
          selected_equipment: equipmentNames,
          is_complete: true,
          privacy_accepted: true,
          privacy_accepted_at: new Date().toISOString(),
        }).select('id').single();
        
        if (error) throw error;
        leadId = insertedLead?.id;
      }

      // Send email notifications (fire and forget - don't block submission)
      if (leadId) {
        supabase.functions.invoke('send-lead-notification', {
          body: {
            leadId,
            fullName,
            email: state.contactDetails.email || '',
            phone: state.contactDetails.phone,
            notes: state.contactDetails.notes,
            selectedTruckType: truckTypeName,
            selectedTruckSize: truckSizeName,
            selectedEquipment: equipmentNames,
          }
        }).catch(err => {
          console.error('Failed to send notification emails:', err);
        });
      }

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
    <div className="min-h-svh bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">בניית פודטראק</span>
            <h1 className="text-xl font-bold text-navy">אליה קרוואנים</h1>
          </div>
          {state.step >= 1 && state.step <= 4 && (
            <ProgressIndicator currentStep={state.step} />
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="container py-8 pb-[calc(8rem+env(safe-area-inset-bottom))]">
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

        <AnimatePresence mode="wait">
          {/* Step 1: Contact Details */}
          {state.step === 1 && !error && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {getContent('contact_title', 'שלב 1: פרטים אישיים')}
                </h2>
                <p className="text-muted-foreground">
                  {getContent('contact_subtitle', 'ספרו לנו קצת על עצמכם כדי שנוכל ליצור איתכם קשר')}
                </p>
              </div>
              <ContactForm
                onSubmit={handleContactSubmit}
                initialData={state.contactDetails}
                hideSubmitButton={false}
                submitButtonText="המשך לבחירת דגם"
              />
            </motion.div>
          )}

          {/* Step 2: Type Selection */}
          {state.step === 2 && !error && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {getContent('type_title', 'שלב 2: בחירת דגם')}
                </h2>
                <p className="text-muted-foreground">
                  {state.contactDetails?.firstName 
                    ? `${state.contactDetails.firstName}, ${getContent('type_subtitle', 'בחר/י את סוג הפודטראק')}` 
                    : getContent('type_subtitle', 'בחרו את סוג הפודטראק המתאים לעסק שלכם')}
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
            </motion.div>
          )}

          {/* Step 3: Size Selection */}
          {state.step === 3 && !error && selectedTruckType && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {getContent('size_title', 'שלב 3: בחירת גודל')}
                </h2>
                <p className="text-muted-foreground">
                  {state.contactDetails?.firstName 
                    ? `${state.contactDetails.firstName}, ${getContent('size_subtitle', 'בחר/י את הגודל המתאים')}` 
                    : getContent('size_subtitle', 'בחרו את הגודל המתאים לעסק שלכם')}
                </p>
              </div>

              {truckLoading ? (
                <LoadingSkeleton />
              ) : (
                <SizeSelector
                  sizes={selectedTruckType.sizes}
                  selectedSize={state.selectedSize}
                  onSelect={handleSizeSelect}
                  truckImage={selectedTruckType.image}
                />
              )}
            </motion.div>
          )}

          {/* Step 4: Equipment Selection */}
          {state.step === 4 && !error && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {getContent('equipment_title', 'שלב 4: בחירת ציוד')}
                </h2>
                <p className="text-muted-foreground">
                  {state.contactDetails?.firstName 
                    ? `${state.contactDetails.firstName} - ${getContent('equipment_subtitle', 'בחר/י את הציוד הנוסף שתרצו להוסיף להצעה')}` 
                    : getContent('equipment_subtitle', 'בחרו את הציוד הנוסף שתרצו להוסיף')}
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
                  onClearAll={handleClearEquipment}
                />
              )}
            </motion.div>
          )}

          {/* Step 5: Summary */}
          {state.step === 5 && !error && selectedTruckType && state.contactDetails && (
            <motion.div
              key="step-5"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <SummaryStep
                truckType={selectedTruckType}
                selectedSizeId={state.selectedSize!}
                contactDetails={state.contactDetails}
                selectedEquipment={selectedEquipmentItems}
                onEditStep={handleGoToStep}
                onSubmit={handleFinalSubmit}
                isSubmitting={isSubmitting}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Fixed bottom navigation - show for steps 1-4 */}
      {state.step >= 1 && state.step <= 4 && !error && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] z-50">
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