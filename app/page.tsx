"use client"

export const dynamic = "force-dynamic"

import * as React from "react"
import { useRouter } from "next/navigation"
import { MarketingNavbar } from "@/components/marketing/navbar"
import { Hero } from "@/components/marketing/hero"
import { ProblemSection } from "@/components/marketing/problem-section"
import { ProductPreviewSection } from "@/components/marketing/product-preview-section"
import { HowItWorksSection } from "@/components/marketing/how-it-works-section"
import { FeaturesSection } from "@/components/marketing/features-section"
import { ReceiptShowcaseSection } from "@/components/marketing/receipt-showcase-section"
import { EcosystemSection } from "@/components/marketing/ecosystem-section"
import { FinalCtaSection } from "@/components/marketing/final-cta-section"
import { MarketingFooter } from "@/components/marketing/footer"

export default function HomePage() {
  const router = useRouter()

  const handleNavigateToLogin = () => {
    router.push("/login")
  }

  const handleScrollToHowItWorks = () => {
    const el = document.getElementById("how-it-works")
    if (el) {
      el.scrollIntoView({ behavior: "smooth" })
    } else {
      router.push("/#how-it-works")
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <MarketingNavbar onNavigateToDashboard={handleNavigateToLogin} />

      {/* Main Marketing / Product Story Flow */}
      <main className="flex-1 w-full flex flex-col">
        {/* 1. Hero */}
        <Hero
          onGetStarted={handleNavigateToLogin}
          onSeeHowItWorks={handleScrollToHowItWorks}
        />

        {/* 2. Problem / Value Proposition Section */}
        <ProblemSection />

        {/* 3. Live Product / Dashboard Showcase */}
        <ProductPreviewSection />

        {/* 4. How It Works (Step-by-step workflow) */}
        <HowItWorksSection />

        {/* 5. Core Feature Grid */}
        <FeaturesSection />

        {/* 6. Professional Non-Custodial Receipt Showcase */}
        <ReceiptShowcaseSection />

        {/* 7. Polygon / Verse Ecosystem Alignment */}
        <EcosystemSection />

        {/* 8. Final Call to Action */}
        <FinalCtaSection
          onGetStarted={handleNavigateToLogin}
          onExploreProduct={handleScrollToHowItWorks}
        />
      </main>

      {/* Footer */}
      <MarketingFooter />
    </div>
  )
}
