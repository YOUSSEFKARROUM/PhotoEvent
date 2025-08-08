import React from "react";
import { CheckCircle, Star } from "lucide-react";
import { motion } from "framer-motion";

/**
 * steps: [{ id, label, key }]
 * currentStep: number (1-based)
 * completedSteps: array of step ids
 */
export default function StepIndicator({ steps, currentStep, onStepClick }) {
  return (
    <div className="flex justify-between items-center w-full max-w-2xl mx-auto mb-10 select-none">
      {steps.map((step, idx) => {
        const isCompleted = currentStep > step.id;
        const isCurrent = currentStep === step.id;
        const isLast = idx === steps.length - 1;
        const isClickable = isCompleted || (isCurrent && currentStep !== steps.length);
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0.7 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className={`w-10 h-10 flex items-center justify-center rounded-full border-2
                  ${isCompleted ? "bg-green-500 border-green-500" : isCurrent ? "bg-blue-600 border-blue-600" : "bg-slate-200 border-slate-300"}
                  shadow-md relative z-10
                  ${isClickable ? "cursor-pointer hover:ring-2 hover:ring-blue-300" : "cursor-default"}`}
                aria-label={`Aller à l'étape ${step.label}`}
                tabIndex={isClickable ? 0 : -1}
                onClick={() => isClickable && onStepClick && onStepClick(step.id)}
                onKeyDown={e => {
                  if (isClickable && onStepClick && (e.key === 'Enter' || e.key === ' ')) {
                    onStepClick(step.id);
                  }
                }}
              >
                {isCompleted ? (
                  <CheckCircle className="text-white w-6 h-6" />
                ) : isCurrent ? (
                  <Star className="text-white w-6 h-6 animate-pulse" />
                ) : (
                  <span className="text-slate-400 font-bold text-lg">{step.id}</span>
                )}
              </motion.div>
              <span className={`mt-2 text-xs font-medium text-center ${isCompleted ? "text-green-600" : isCurrent ? "text-blue-700" : "text-slate-500"}`}>{step.label}</span>
            </div>
            {!isLast && (
              <div className="flex-1 h-1 mx-2 relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: isCompleted ? "100%" : "50%" }}
                  transition={{ duration: 0.4 }}
                  className={`absolute top-1/2 left-0 h-1 rounded bg-gradient-to-r ${isCompleted ? "from-green-500 to-green-400" : "from-slate-300 to-slate-200"}`}
                  style={{ right: 0, transform: "translateY(-50%)" }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
} 