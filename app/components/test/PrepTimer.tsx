import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface PrepTimerProps {
  initialTime: number; // in seconds
  onTimeUpdate: (timeRemaining: number) => void;
  onTimeExpired: () => void;
}

export default function PrepTimer({ 
  initialTime, 
  onTimeUpdate, 
  onTimeExpired 
}: PrepTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  
  useEffect(() => {
    // Set initial time
    setTimeRemaining(initialTime);
    
    // Start the timer
    const timer = setInterval(() => {
      setTimeRemaining((prevTime) => {
        const newTime = prevTime - 1;
        
        // Notify parent component of time update
        onTimeUpdate(newTime);
        
        // Check if time has expired
        if (newTime <= 0) {
          clearInterval(timer);
          onTimeExpired();
          return 0;
        }
        
        return newTime;
      });
    }, 1000);
    
    // Cleanup on unmount
    return () => clearInterval(timer);
  }, [initialTime, onTimeUpdate, onTimeExpired]);
  
  // Format the time as HH:MM:SS
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };
  
  // Calculate percentage for progress bar
  const timePercentage = (timeRemaining / initialTime) * 100;
  
  // Determine color based on time remaining
  const getColor = () => {
    if (timePercentage > 50) return 'bg-green-500';
    if (timePercentage > 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  return (
    <div className="flex flex-col">
      <div className="flex items-center mb-1">
        <Clock className="h-4 w-4 mr-2 text-gray-500" />
        <span className="text-sm font-medium">
          Time Remaining: {formatTime(timeRemaining)}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`${getColor()} h-2 rounded-full transition-all duration-1000 ease-linear`}
          style={{ width: `${timePercentage}%` }}
        ></div>
      </div>
    </div>
  );
}