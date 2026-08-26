import Nav from "@/components/site/Nav";
import Footer from "@/components/site/Footer";
import Hero from "@/components/landing/Hero";
import ProofStrip from "@/components/landing/ProofStrip";
import Problem from "@/components/landing/Problem";
import HowItWorks from "@/components/landing/HowItWorks";
import ProductShowcase from "@/components/landing/ProductShowcase";
import MacroMath from "@/components/landing/MacroMath";
import MenuPreview from "@/components/landing/MenuPreview";
import Compare from "@/components/landing/Compare";
import Ticker from "@/components/landing/Ticker";
import Pricing from "@/components/landing/Pricing";
import Faq from "@/components/landing/Faq";
import CtaBand from "@/components/landing/CtaBand";

// Reads data/meals.json per request, so editing the file shows up immediately.
export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <>
      <Nav />
      <main id="main">
        <Hero />
        <ProofStrip />
        <Ticker />
        <Problem />
        <HowItWorks />
        <ProductShowcase />
        <MacroMath />
        <MenuPreview />
        <Compare />
        <Ticker />
        <Pricing />
        <Faq />
        <CtaBand />
      </main>
      <Footer />
    </>
  );
}
