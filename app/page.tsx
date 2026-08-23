"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { MarketingNavbar } from "@/components/marketing/navbar"
import { Hero } from "@/components/marketing/hero"
import { ProblemSection } from "@/components/marketing/problem-section"
import { HowItWorksSection } from "@/components/marketing/how-it-works-section"
import { FeaturesSection } from "@/components/marketing/features-section"
import { ProductPreviewSection } from "@/components/marketing/product-preview-section"
import { EcosystemSection } from "@/components/marketing/ecosystem-section"
import { FinalCtaSection } from "@/components/marketing/final-cta-section"
import { MarketingFooter } from "@/components/marketing/footer"
import { useToast } from "@/components/ui/toast"

export default function LandingPage() {
  const router = useRouter()
  const { toast } = useToast()

  const handleGetStarted = () => {
    toast({
      title: "Launching Merchant Dashboard",
      description: "Redirecting to Verse Merchant OS preview shell...",
      type: "info",
    })
    router.push("/dashboard")
  }

  const handleSeeHowItWorks = () => {
    const section = document.querySelector("#how-it-works")
    if (section) {
      section.scrollIntoView({ behavior: "smooth" })
    }
  }

  const handleExploreProduct = () => {
    const section = document.querySelector("#product")
    if (section) {
      section.scrollIntoView({ behavior: "smooth" })
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <div id="landing-page-root" className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
      {/* 1. Marketing Navigation */}
      <MarketingNavbar onNavigateToDashboard={handleGetStarted} />

      {/* Main Landing Page Flow */}
      <main className="flex-1">
        {/* 2. Hero Section */}
        <Hero
          onGetStarted={handleGetStarted}
          onSeeHowItWorks={handleSeeHowItWorks}
        />

        {/* 3. Section 1: The Problem */}
        <ProblemSection />

        {/* 4. Section 2: How It Works */}
        <HowItWorksSection />

        {/* 5. Section 3: Features */}
        <FeaturesSection />

        {/* 6. Section 4: Product Preview */}
        <ProductPreviewSection />

        {/* 7. Section 5: Verse Ecosystem & Trust */}
        <EcosystemSection />

        {/* 8. Section 6: Final Call to Action */}
        <FinalCtaSection
          onGetStarted={handleGetStarted}
          onExploreProduct={handleExploreProduct}
        />
      </main>

      {/* 10. Professional Marketing Footer */}
      <MarketingFooter />
    </div>
  )
}
