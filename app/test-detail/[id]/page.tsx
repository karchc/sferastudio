import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "../../lib/auth-server";
import { supabase } from "../../lib/supabaseClient";
import { 
  BookOpen, Clock, Target, Award, CheckCircle, 
  ArrowRight, Star, Users, BarChart3, Shield,
  PlayCircle, FileText, Zap
} from "lucide-react";

interface Test {
  id: string;
  title: string;
  description?: string;
  time_limit: number;
  question_count?: number;
  is_active: boolean;
  price?: number;
  is_free?: boolean;
  instructions?: string;
  categories?: Array<{ id: string; name: string }>;
}

async function getTestDetails(testId: string): Promise<Test | null> {
  try {
    const { data: test, error } = await supabase
      .from("tests")
      .select("*")
      .eq("id", testId)
      .single();

    if (error || !test) {
      console.error("Error fetching test:", error);
      return null;
    }

    return test;
  } catch (error) {
    console.error("Error fetching test:", error);
    return null;
  }
}

export default async function TestDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  const test = await getTestDetails(params.id);

  if (!test) {
    notFound();
  }

  const features = [
    {
      icon: <FileText className="h-5 w-5" />,
      title: "Comprehensive Coverage",
      description: "Questions cover all exam topics and latest certification requirements"
    },
    {
      icon: <Target className="h-5 w-5" />,
      title: "Exam-Like Experience",
      description: "Simulates real exam conditions with time pressure and question formats"
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: "Detailed Analytics",
      description: "Track your performance and identify areas for improvement"
    },
    {
      icon: <CheckCircle className="h-5 w-5" />,
      title: "Instant Feedback",
      description: "Get immediate results and explanations for every answer"
    }
  ];

  const benefits = [
    "Access to all questions in this test",
    "Unlimited attempts to improve your score",
    "Detailed performance analytics",
    "Question explanations and references",
    "Progress tracking across attempts",
    "Mobile-friendly interface"
  ];

  return (
    <div className="min-h-screen bg-[#F6F7FA]">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#0B1F3A] via-[#1a3454] to-[#0f2847] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Test Info */}
            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                {test.categories?.map((category) => (
                  <span 
                    key={category.id}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#3EB3E7]/20 text-[#3EB3E7] border border-[#3EB3E7]/30"
                  >
                    {category.name}
                  </span>
                ))}
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                {test.title}
              </h1>
              
              <p className="text-xl opacity-90 mb-6">
                {test.description || "Prepare for your certification with comprehensive practice questions"}
              </p>

              <div className="flex flex-wrap gap-6 mb-8">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-[#B1E5D3] mr-2" />
                  <span>{Math.floor(test.time_limit / 60)} minutes</span>
                </div>
                <div className="flex items-center">
                  <BookOpen className="h-5 w-5 text-[#B1E5D3] mr-2" />
                  <span>{test.question_count || 25} questions</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-[#B1E5D3] mr-2" />
                  <span>1,250+ students</span>
                </div>
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-[#B1E5D3] mr-2 fill-current" />
                  <span>4.8/5.0 rating</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                {session ? (
                  <>
                    <Link
                      href={`/test/${test.id}`}
                      className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-bold rounded-lg text-white bg-[#3EB3E7] hover:bg-[#2da0d4] transition-all transform hover:scale-105 shadow-lg"
                    >
                      <Zap className="mr-2 h-5 w-5" />
                      Start Full Test
                    </Link>
                    <button
                      className="inline-flex items-center justify-center px-8 py-3 border-2 border-white/30 text-base font-medium rounded-lg text-white hover:bg-white/10 transition-all"
                    >
                      <PlayCircle className="mr-2 h-5 w-5" />
                      Try Preview Test
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth/signup"
                      className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-bold rounded-lg text-white bg-[#3EB3E7] hover:bg-[#2da0d4] transition-all transform hover:scale-105 shadow-lg"
                    >
                      Purchase Now
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                    <Link
                      href="/auth/login"
                      className="inline-flex items-center justify-center px-8 py-3 border-2 border-white/30 text-base font-medium rounded-lg text-white hover:bg-white/10 transition-all"
                    >
                      <PlayCircle className="mr-2 h-5 w-5" />
                      Preview Test
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Right Column - Visual Card */}
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-[#3EB3E7] rounded-full mb-4">
                    <Award className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Get Certified</h3>
                  <p className="text-white/80">
                    Join thousands who passed their exams
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/80">Pass Rate</span>
                      <span className="font-bold text-[#B1E5D3]">98%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div className="bg-[#B1E5D3] h-2 rounded-full" style={{width: '98%'}}></div>
                    </div>
                  </div>
                  
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-white/80">Avg. Score</span>
                      <span className="font-bold">85%</span>
                    </div>
                  </div>
                  
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-white/80">Completion Time</span>
                      <span className="font-bold">{Math.floor(test.time_limit * 0.8 / 60)} mins</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#0B1F3A] mb-4">
              What's Included in This Test
            </h2>
            <p className="text-xl text-[#5C677D] max-w-3xl mx-auto">
              Everything you need to prepare effectively and pass your certification exam
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-all">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-[#3EB3E7]/20 text-[#3EB3E7] rounded-lg mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-[#0B1F3A] mb-2">
                  {feature.title}
                </h3>
                <p className="text-[#5C677D]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Benefits List */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-[#0B1F3A] mb-6">
              Full Test Benefits
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-[#3EB3E7] mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-[#5C677D]">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Instructions Section */}
      {test.instructions && (
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-[#0B1F3A] mb-6 text-center">
              Test Instructions
            </h2>
            <div className="prose prose-lg max-w-none text-[#5C677D]">
              <p className="whitespace-pre-wrap">{test.instructions}</p>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-[#0B1F3A] to-[#1a3454]">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-6">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Ace Your {test.categories?.[0]?.name || "Certification"} Exam?
          </h2>
          <p className="text-xl text-white opacity-90 mb-8 max-w-2xl mx-auto">
            Start practicing now and join thousands of successful professionals who passed their exams with confidence
          </p>
          
          {session ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={`/test/${test.id}`}
                className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-bold rounded-lg text-[#0B1F3A] bg-white hover:bg-[#F6F7FA] transition-all transform hover:scale-105 shadow-lg"
              >
                Start Test Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-bold rounded-lg text-[#0B1F3A] bg-white hover:bg-[#F6F7FA] transition-all transform hover:scale-105 shadow-lg"
              >
                Purchase Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center px-8 py-3 border-2 border-white/30 text-base font-medium rounded-lg text-white hover:bg-white/10 transition-all"
              >
                <PlayCircle className="mr-2 h-5 w-5" />
                Preview Test
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}