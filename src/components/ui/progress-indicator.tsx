import React from 'react'
import { motion } from 'framer-motion'
import { CircleCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  onContinue: () => void;
  onBack: () => void;
  isExpanded?: boolean;
  continueDisabled?: boolean;
  continueText?: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
  onContinue,
  onBack,
  isExpanded = false,
  continueDisabled = false,
  continueText = 'Continue'
}) => {
  const isLastStep = currentStep === totalSteps;
  const showBack = currentStep > 1;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Progress dots */}
      <div className="relative flex items-center gap-2">
        {Array.from({ length: totalSteps }).map((_, idx) => (
          <motion.div
            key={idx}
            className={cn(
              "w-2 h-2 rounded-full transition-colors duration-300",
              idx < currentStep ? "bg-primary" : "bg-muted"
            )}
            initial={false}
            animate={{
              scale: idx === currentStep - 1 ? 1.3 : 1,
            }}
            transition={{ duration: 0.2 }}
          />
        ))}

        {/* Green progress overlay */}
        <motion.div
          className="absolute left-0 top-0 h-2 bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{
            width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          style={{ zIndex: -1 }}
        />
      </div>

      {/* Buttons container */}
      <div className="flex justify-center w-full">
        <motion.div
          className="flex items-center gap-2"
          initial={false}
          animate={{
            width: isExpanded || showBack ? "auto" : "auto",
          }}
        >
          {showBack && (
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onClick={onBack}
              className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg"
            >
              Voltar
            </motion.button>
          )}
          <motion.button
            onClick={onContinue}
            disabled={continueDisabled}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-primary-foreground transition-all duration-300",
              continueDisabled
                ? "bg-muted cursor-not-allowed text-muted-foreground"
                : "bg-primary hover:opacity-90 shadow-lg hover:shadow-xl"
            )}
            whileHover={!continueDisabled ? { scale: 1.02 } : {}}
            whileTap={!continueDisabled ? { scale: 0.98 } : {}}
          >
            {isLastStep && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <CircleCheck className="w-5 h-5" />
              </motion.span>
            )}
            {continueText}
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}

export default ProgressIndicator
