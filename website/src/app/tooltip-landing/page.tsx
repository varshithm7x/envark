import Calculator from './components/Calculator';
import BenchmarkGrid from './components/BenchmarkGrid';
import HowItWorks from './components/HowItWorks';
import ComparisonGrid from './components/ComparisonGrid';
import SocialProofAndCTA from './components/SocialProofAndCTA';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function TooltipLandingPage() {
  return (
    <>
      {/* Noise texture overlay */}
      <div className="noise-overlay" aria-hidden="true" />

      <Header />

      <main style={{ paddingTop: '80px' }}>
        {/* 1. Hero The pitch IS the tool */}
        <Calculator />

        {/* 2. The Problem Silent killers + risk levels */}
        <BenchmarkGrid />

        {/* 3. How It Works Scan output + TUI demo */}
        <HowItWorks />

        {/* 4. Languages + MCP Tools */}
        <ComparisonGrid />

        {/* 5. AI Assistant + Install CTA */}
        <SocialProofAndCTA />
      </main>

      <Footer />
    </>
  );
}