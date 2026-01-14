import { motion } from 'framer-motion';
import { ArrowLeft, Truck, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import welcomeBg from '@/assets/welcome-foodtruck-bg.jpg';

interface WelcomeScreenProps {
  onStart: () => void;
}

export const WelcomeScreen = ({ onStart }: WelcomeScreenProps) => {
  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-900">
      {/* Background Image */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${welcomeBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/60 to-slate-900/70" />
      </div>

      {/* Content */}
      <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          
          {/* Logo Icon */}
          <motion.div 
            className="flex justify-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <Truck className="w-12 h-12 sm:w-14 sm:h-14 text-primary" />
            </div>
          </motion.div>

          {/* Welcome Text */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
              שלום וברוכים הבאים
            </h1>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-medium text-primary">
              בואו נבנה את הפודטראק המושלם עבורכם
            </h2>
          </motion.div>

          {/* Company introduction */}
          <motion.div 
            className="max-w-lg mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              אנחנו <span className="font-semibold text-white">אליה קרוואנים</span> - 
              מומחים לייצור פודטראקים ומשאיות מזון יוקרתיות בישראל. 
              בתהליך קצר נתאים עבורכם את הפודטראק המושלם.
            </p>
          </motion.div>

          {/* Steps Preview */}
          <motion.div 
            className="py-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex justify-center items-center gap-4 sm:gap-6">
              {[
                { step: 1, label: 'פרטים' },
                { step: 2, label: 'דגם' },
                { step: 3, label: 'ציוד' },
                { step: 4, label: 'סיכום' },
              ].map(({ step, label }, index) => (
                <div key={step} className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white font-medium text-sm sm:text-base">
                    {step}
                  </div>
                  <span className="text-xs sm:text-sm text-slate-400">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            className="pt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <motion.button
              onClick={onStart}
              className={cn(
                'inline-flex items-center gap-3 px-10 sm:px-14 py-4 rounded-xl',
                'bg-primary text-primary-foreground font-bold text-lg sm:text-xl',
                'shadow-lg hover:shadow-xl transition-all duration-300'
              )}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>בואו נתחיל</span>
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
          </motion.div>

          {/* Security badge */}
          <motion.div 
            className="flex items-center justify-center gap-2 text-sm text-slate-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <Shield className="w-4 h-4" />
            <span>הפרטים שלכם מאובטחים ונשמרים בסודיות מלאה</span>
          </motion.div>
        </div>
      </div>
    </div>
  );
};