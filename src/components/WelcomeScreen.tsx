import { motion } from 'framer-motion';
import { ArrowLeft, Truck, Sparkles, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import welcomeBg from '@/assets/welcome-foodtruck-bg.jpg';

interface WelcomeScreenProps {
  onStart: () => void;
}

export const WelcomeScreen = ({ onStart }: WelcomeScreenProps) => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background image with overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${welcomeBg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/60" />
      </div>

      {/* Content */}
      <div className="relative min-h-screen flex items-center justify-center p-6">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          {/* Logo / Icon with animation */}
          <motion.div 
            className="flex justify-center"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          >
            <div className="relative">
              <motion.div 
                className="w-28 h-28 rounded-full bg-primary/20 backdrop-blur-sm flex items-center justify-center border border-primary/30"
                animate={{ 
                  boxShadow: [
                    "0 0 20px hsl(var(--primary) / 0.3)",
                    "0 0 40px hsl(var(--primary) / 0.5)",
                    "0 0 20px hsl(var(--primary) / 0.3)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Truck className="w-14 h-14 text-primary" />
              </motion.div>
              <motion.div 
                className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-gold flex items-center justify-center shadow-lg"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: "spring", stiffness: 300 }}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </motion.div>
            </div>
          </motion.div>

          {/* Welcome Text with staggered animation */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground">
              נעים להכיר! 👋
            </h1>
            <h2 className="text-xl sm:text-2xl font-semibold text-primary">
              בואו נבנה את הפודטראק המושלם עבורכם
            </h2>
          </motion.div>

          {/* Description with animation */}
          <motion.div 
            className="space-y-4 text-muted-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <p className="text-lg">
              אנחנו <span className="font-semibold text-foreground">אליה קרוואנים</span> - מומחים לייצור פודטראקים ומשאיות מזון יוקרתיות בישראל
            </p>
            <p>
              בתהליך הקצר הזה נתאים עבורכם את הפודטראק המושלם לצרכים שלכם - מבחירת הדגם והגודל, דרך הציוד המקצועי, ועד להצעת מחיר מותאמת אישית
            </p>
          </motion.div>

          {/* Steps Preview with staggered animation */}
          <motion.div 
            className="grid grid-cols-4 gap-3 py-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {[
              { step: 1, label: 'פרטים אישיים', icon: '👤' },
              { step: 2, label: 'בחירת דגם', icon: '🚐' },
              { step: 3, label: 'גודל וציוד', icon: '📐' },
              { step: 4, label: 'סיכום', icon: '✅' },
            ].map(({ step, label, icon }, index) => (
              <motion.div 
                key={step} 
                className="flex flex-col items-center gap-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + index * 0.1 }}
              >
                <div className="w-12 h-12 rounded-full bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center text-xl shadow-sm">
                  {icon}
                </div>
                <span className="text-xs sm:text-sm text-muted-foreground text-center">{label}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Trust badges */}
          <motion.div
            className="flex flex-wrap justify-center gap-4 py-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            {[
              { icon: Star, text: 'ייצור מקומי באיכות גבוהה' },
              { icon: Truck, text: 'משלוח לכל הארץ' },
            ].map((badge, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground bg-card/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border">
                <badge.icon className="w-4 h-4 text-gold" />
                <span>{badge.text}</span>
              </div>
            ))}
          </motion.div>

          {/* CTA Button with animation */}
          <motion.button
            onClick={onStart}
            className={cn(
              'inline-flex items-center gap-3 px-12 py-5 rounded-xl',
              'bg-primary text-primary-foreground font-bold text-xl',
              'shadow-gold hover:opacity-90 transition-all duration-200'
            )}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.3, type: "spring", stiffness: 200 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>בוא נתחיל!</span>
            <ArrowLeft className="w-6 h-6" />
          </motion.button>

          {/* Trust Badge */}
          <motion.p 
            className="text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            🔒 הפרטים שלכם מאובטחים ונשמרים בסודיות מלאה
          </motion.p>
        </div>
      </div>
    </div>
  );
};