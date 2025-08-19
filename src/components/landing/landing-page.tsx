'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { 
  Users, 
  FileText, 
  BarChart3, 
  Zap, 
  Shield, 
  Clock,
  CheckCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react'

export function LandingPage() {
  const router = useRouter()
  const { isAuthenticated, signInWithGoogle, loading: authLoading } = useAuth()

  // Auto-redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      console.log('🚀 User is authenticated, redirecting to dashboard...')
      router.push('/dashboard')
    }
  }, [isAuthenticated, authLoading, router])

  const features = [
    {
      icon: <Zap className="h-6 w-6 text-blue-600" />,
      title: "AI-Powered Evaluation",
      description: "Advanced AI analyzes resumes and matches candidates to your specific role requirements"
    },
    {
      icon: <Users className="h-6 w-6 text-green-600" />,
      title: "Smart Candidate Ranking",
      description: "Automatically rank candidates based on skills, experience, and cultural fit"
    },
    {
      icon: <BarChart3 className="h-6 w-6 text-purple-600" />,
      title: "Detailed Analytics",
      description: "Get insights on hiring patterns, skill trends, and role performance metrics"
    },
    {
      icon: <Clock className="h-6 w-6 text-orange-600" />,
      title: "Save Time",
      description: "Reduce screening time by 90% with automated resume analysis and scoring"
    },
    {
      icon: <Shield className="h-6 w-6 text-red-600" />,
      title: "Bias-Free Hiring",
      description: "Eliminate unconscious bias with objective, data-driven candidate evaluation"
    },
    {
      icon: <FileText className="h-6 w-6 text-indigo-600" />,
      title: "Bulk Processing",
      description: "Process hundreds of resumes simultaneously with intelligent batch evaluation"
    }
  ]

  const steps = [
    {
      number: "01",
      title: "Create Job Roles",
      description: "Define your job requirements, skills matrix, and evaluation criteria"
    },
    {
      number: "02", 
      title: "Upload Resumes",
      description: "Bulk upload PDF resumes or upload individual candidate files"
    },
    {
      number: "03",
      title: "AI Analysis",
      description: "Our AI evaluates each candidate against your specific requirements"
    },
    {
      number: "04",
      title: "Review Results",
      description: "Get ranked candidates with detailed evaluation reports and insights"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Sparkles className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">HR AI SaaS</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => router.push('/auth/login')}>
                Sign In
              </Button>
              <Button onClick={() => router.push('/auth/login')}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Revolutionize Your 
              <span className="text-blue-600"> Hiring Process</span> with AI
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Transform resume screening from hours to minutes. Our AI-powered platform 
              evaluates candidates against your exact requirements, ranks them objectively, 
              and provides detailed insights to make better hiring decisions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-6"
                  onClick={() => router.push('/dashboard')}
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              ) : (
                <>
                  <Button 
                    size="lg" 
                    className="text-lg px-8 py-6"
                    onClick={signInWithGoogle}
                    disabled={authLoading}
                  >
                    {authLoading ? 'Signing In...' : 'Start Free Trial'}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="text-lg px-8 py-6"
                    onClick={() => router.push('/auth/login')}
                  >
                    Sign In
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Powerful Features for Modern HR Teams
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to streamline your hiring process and find the best candidates
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started in minutes with our simple 4-step process
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full text-xl font-bold mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Why Choose Our AI-Powered Solution?
              </h2>
              <div className="space-y-4">
                {[
                  "Reduce screening time by 90%",
                  "Eliminate unconscious hiring bias",
                  "Improve candidate quality and fit",
                  "Scale your hiring process effortlessly",
                  "Get detailed analytics and insights",
                  "Ensure compliance with hiring standards"
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:text-center">
              <Card className="p-8 shadow-xl border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardContent className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">90%</div>
                  <p className="text-gray-600 mb-4">Time saved on initial screening</p>
                  
                  <div className="text-4xl font-bold text-green-600 mb-2">5x</div>
                  <p className="text-gray-600 mb-4">Faster candidate evaluation</p>
                  
                  <div className="text-4xl font-bold text-purple-600 mb-2">100%</div>
                  <p className="text-gray-600">Objective, bias-free analysis</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Hiring Process?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join forward-thinking HR teams who are already using AI to find better candidates faster.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6"
              onClick={() => router.push('/auth/login')}
            >
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-6"
              onClick={() => router.push('/auth/login')}
            >
              Sign In to Your Account
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-blue-400" />
            <span className="ml-2 text-xl font-bold text-white">HR AI SaaS</span>
          </div>
          <p className="text-gray-400">
            © 2024 HR AI SaaS. All rights reserved. Revolutionizing hiring with artificial intelligence.
          </p>
        </div>
      </footer>
    </div>
  )
}