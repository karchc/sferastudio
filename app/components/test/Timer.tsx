import { formatTime } from "@/app/lib/utils";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Clock } from "lucide-react";

interface TimerProps {
  initialTime: number; // in seconds
  onTimeUp: () => void;
}

export function Timer({ initialTime, onTimeUp }: TimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const [hasShownOneMinuteWarning, setHasShownOneMinuteWarning] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  
  console.log("Timer initialized with:", initialTime, "seconds");
  console.log("Current time remaining:", timeRemaining);
  
  // Calculate progress percentage for the timer bar
  const progress = (timeRemaining / initialTime) * 100;
  
  // Determine color based on time remaining
  const getColor = () => {
    if (timeRemaining <= 60) return "bg-red-500"; // Last minute
    if (timeRemaining <= 120) return "bg-yellow-500"; // Last 2 minutes
    return "bg-green-500"; 
  };

  // Handle countdown
  useEffect(() => {
    const intervalId = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(intervalId);
  }, []); // Run once on mount

  // Handle time-based events
  useEffect(() => {
    // Show one minute warning
    if (timeRemaining === 60 && !hasShownOneMinuteWarning) {
      setHasShownOneMinuteWarning(true);
      setShowNotification(true);
      
      // Hide notification after 5 seconds
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    }

    // Check if time is up
    if (timeRemaining === 0) {
      onTimeUp();
    }
  }, [timeRemaining, onTimeUp, hasShownOneMinuteWarning]);

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-10 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="font-medium">
                {formatTime(timeRemaining)}
              </span>
              
              {timeRemaining <= 60 && (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ 
                    repeat: Infinity, 
                    repeatType: "reverse", 
                    duration: 0.8 
                  }}
                  className="flex items-center text-red-500 text-sm"
                >
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  <span>Time running out!</span>
                </motion.div>
              )}
            </div>
          </div>
          <div className="h-1 w-full bg-slate-100 mt-1 rounded-full overflow-hidden">
            <motion.div 
              className={`h-full ${getColor()}`}
              initial={{ width: "100%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>
      
      {/* One Minute Warning Notification */}
      {showNotification && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className="bg-red-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
            <AlertTriangle className="h-6 w-6" />
            <div>
              <p className="font-semibold text-lg">1 Minute Remaining!</p>
              <p className="text-sm">Please review your answers and prepare to submit.</p>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}