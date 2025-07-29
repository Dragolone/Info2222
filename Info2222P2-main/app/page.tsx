import type React from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  ArrowRight,
  CheckCircle,
  Users,
  Calendar,
  MessageSquare,
  FileText,
  BarChart3,
  ChevronDown,
  ArrowUpRight,
  MousePointer,
  LucideIcon
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur-sm z-50 w-full">
        <div className="container max-w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
              <Users className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold">TeamSync</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Features
            </Link>
            <Link href="#benefits" className="text-sm font-medium hover:text-primary transition-colors">
              Benefits
            </Link>
            <Link href="#testimonials" className="text-sm font-medium hover:text-primary transition-colors">
              Testimonials
            </Link>
            <Link href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
              Pricing
            </Link>
            <Link href="/secure" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
              Secure Page
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost" className="hover:bg-background">Log In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="group">
                Get Started
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full">
        {/* Hero Section */}
        <section className="py-24 md:py-32 overflow-hidden relative w-full">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background"></div>
          <div className="container max-w-full px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium mb-8 animate-fade-in">
              <span className="bg-primary h-2 w-2 rounded-full mr-2"></span>
              New Dashboard Features Released
              <Link href="#features" className="inline-flex items-center ml-2 text-primary hover:underline">
                Explore <ChevronDown className="h-3 w-3 ml-0.5" />
              </Link>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
              All-in-One Team Collaboration Platform
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12">
              Streamline your workflow with integrated task management,
              communication, and collaboration tools in one platform.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-16">
              <Link href="/auth/signup">
                <Button size="lg" className="w-full sm:w-auto text-base px-8 h-12 shadow-md hover:shadow-lg transition-all">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8 h-12">
                  See How It Works
                </Button>
              </Link>
            </div>

            <div className="relative mx-auto max-w-5xl rounded-xl border bg-background p-2 shadow-2xl">
              <div className="rounded-lg overflow-hidden bg-muted/30 aspect-video relative group">
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="secondary" size="lg" className="gap-2">
                    <MousePointer className="h-4 w-4" />
                    Interactive Demo
                  </Button>
                </div>
                <div className="absolute top-0 left-0 right-0 h-8 bg-muted/80 flex items-center px-3 gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500"></div>
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-500"></div>
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500"></div>
                </div>
                <div className="pt-12 pb-4 px-4 text-center text-muted-foreground text-sm">
                  Interactive dashboard preview - Click to explore
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-muted/30 w-full">
          <div className="container max-w-full px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features for Modern Teams</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                All the tools you need to manage projects, communicate effectively, and boost productivity.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              <FeatureCard
                icon={CheckCircle}
                title="Task Management"
                description="Kanban boards with customizable workflows for tracking project progress."
                color="text-green-500"
              />
              <FeatureCard
                icon={Calendar}
                title="Shared Calendar"
                description="Schedule meetings and tasks with a collaborative team calendar."
                color="text-blue-500"
              />
              <FeatureCard
                icon={MessageSquare}
                title="Group Communication"
                description="Chat, discussion boards, and video meetings with screen sharing."
                color="text-indigo-500"
              />
              <FeatureCard
                icon={FileText}
                title="Document Collaboration"
                description="Real-time collaborative document editing and secure file sharing."
                color="text-amber-500"
              />
              <FeatureCard
                icon={BarChart3}
                title="Progress Tracking"
                description="Visual charts and metrics to track project status and performance."
                color="text-purple-500"
              />
              <FeatureCard
                icon={Users}
                title="Peer Evaluation"
                description="Built-in system for team members to provide feedback and assessments."
                color="text-rose-500"
              />
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="py-24 w-full">
          <div className="container max-w-full px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Solving Your Team Challenges</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                TeamSync addresses the most common obstacles teams face when collaborating.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-6xl mx-auto">
              <BenefitCard
                number="01"
                title="Streamlined Communication"
                description="Eliminate communication breakdowns with centralized messaging and notifications that keep everyone informed."
              />
              <BenefitCard
                number="02"
                title="Reduced Information Overload"
                description="Organize information in a structured way that prevents overwhelming team members with unnecessary details."
              />
              <BenefitCard
                number="03"
                title="Enhanced Productivity"
                description="Integrated tools eliminate context switching and improve focus, allowing teams to accomplish more in less time."
              />
              <BenefitCard
                number="04"
                title="Efficient Workflows"
                description="Customizable processes that adapt to your team's specific needs, ensuring smooth operations from start to finish."
              />
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-24 bg-muted/30 w-full">
          <div className="container max-w-full px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">What Teams Are Saying</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Join thousands of teams that have improved their collaboration with TeamSync.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <TestimonialCard
                quote="TeamSync transformed how our team collaborates. Tasks are clearer and our communication has improved dramatically."
                author="Sarah Johnson"
                role="Project Manager, Acme Inc."
              />
              <TestimonialCard
                quote="The integrated calendar and task management features save us hours every week. We couldn't go back to our old ways."
                author="Michael Chen"
                role="Team Lead, TechSolutions"
                highlighted={true}
              />
              <TestimonialCard
                quote="Setting up was seamless, and the entire team adopted it quickly. The interface is intuitive and user-friendly."
                author="Lisa Rodriguez"
                role="Director, Creative Studio"
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-primary text-primary-foreground w-full">
          <div className="container max-w-full px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Team Collaboration?</h2>
            <p className="text-xl max-w-2xl mx-auto mb-10">
              Join thousands of teams that have improved their productivity with TeamSync.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto px-8 h-12 text-base">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="bg-transparent border-white w-full sm:w-auto px-8 h-12 text-base hover:bg-white/10">
                  Explore Demo
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-12 bg-muted/10 w-full">
        <div className="container max-w-full px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                  <Users className="h-5 w-5" />
                </div>
                <span className="text-xl font-bold">TeamSync</span>
              </div>
              <p className="text-muted-foreground text-sm mb-4">
                All-in-one collaboration platform for modern teams.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Product</h3>
              <ul className="space-y-2">
                <li><Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Solutions</Link></li>
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Integrations</Link></li>
                <li><Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Resources</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Documentation</Link></li>
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Guides</Link></li>
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Support</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Company</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link></li>
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Careers</Link></li>
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</Link></li>
                <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} TeamSync. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  color
}: {
  icon: LucideIcon
  title: string
  description: string
  color: string
}) {
  return (
    <div className="bg-background rounded-xl p-8 shadow-sm border hover:shadow-md transition-all hover:translate-y-[-2px] group">
      <div className={cn("mb-5 inline-flex p-3 rounded-lg bg-muted/50 group-hover:bg-muted transition-colors", color)}>
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
      <div className="mt-5 pt-4 border-t">
        <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-primary hover:underline">
          Learn more <ArrowUpRight className="ml-1 h-3 w-3" />
        </Link>
      </div>
    </div>
  )
}

function BenefitCard({
  number,
  title,
  description,
}: {
  number: string
  title: string
  description: string
}) {
  return (
    <div className="rounded-xl p-8 border bg-muted/10 hover:bg-muted/20 transition-colors">
      <div className="text-sm font-mono text-primary mb-3">{number}</div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}

function TestimonialCard({
  quote,
  author,
  role,
  highlighted = false,
}: {
  quote: string
  author: string
  role: string
  highlighted?: boolean
}) {
  return (
    <div className={cn(
      "rounded-xl p-8 shadow-sm flex flex-col h-full border",
      highlighted ? "bg-primary text-primary-foreground border-primary" : "bg-background"
    )}>
      <div className={cn(
        "text-3xl mb-4",
        highlighted ? "text-primary-foreground/80" : "text-muted-foreground/50"
      )}>
        "
      </div>
      <p className={cn(
        "flex-1 mb-6 leading-relaxed",
        highlighted ? "" : "text-muted-foreground"
      )}>
        {quote}
      </p>
      <div>
        <div className="font-semibold">{author}</div>
        <div className={cn(
          "text-sm",
          highlighted ? "text-primary-foreground/80" : "text-muted-foreground"
        )}>
          {role}
        </div>
      </div>
    </div>
  )
}

