import { TestData } from "@/app/lib/types";
import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Clock } from "lucide-react";
import { formatTimeLimit } from "@/app/lib/formatTimeLimit";

interface TestStartScreenProps {
  test: TestData;
  onStart: () => void;
}

export function TestStartScreen({ test, onStart }: TestStartScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto px-4"
    >
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{test.title}</CardTitle>
          <CardDescription>{test.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="font-medium text-blue-800 mb-2">Test Overview</h3>
            <ul className="space-y-2 text-sm text-blue-700">
              <li className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-800">
                  {test.questions.length}
                </span>
                <span>Multiple-choice questions</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-800" />
                <span>Time limit: {formatTimeLimit(test.timeLimit)}</span>
              </li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-medium">Instructions</h3>
            <ul className="space-y-1 text-sm list-disc pl-5">
              <li>Read each question carefully before answering.</li>
              <li>Some questions may have multiple correct answers - select all that apply.</li>
              <li>You can navigate between questions using the next/previous buttons.</li>
              <li>Your time remaining will be displayed at the top of the screen.</li>
              <li>Your answers are saved automatically when you proceed to the next question.</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={onStart} className="w-full">
            Start Test
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}