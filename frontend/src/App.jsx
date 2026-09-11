import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import MachineryMarquee from './components/MachineryMarquee';
import TheProblem from './components/TheProblem';
import TheSolution from './components/TheSolution';
import HowItWorks from './components/HowItWorks';
import Features from './components/Features';
import EpdExplained from './components/EpdExplained';
import DashboardPreview from './components/DashboardPreview';
import WhoItsFor from './components/WhoItsFor';
import Faq from './components/Faq';
import Cta from './components/Cta';
import Footer from './components/Footer';
import EpdCreatorModal from './components/EpdCreatorModal';

export default function App() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardProduct, setWizardProduct] = useState('chiller');
  const [theme, setTheme] = useState('light'); // Default to light sage archival paper

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleOpenWizard = (productId = 'chiller') => {
    if (productId && typeof productId === 'string') {
      setWizardProduct(productId === 'heat-pump' ? 'heatpump' : productId);
    }
    setIsWizardOpen(true);
  };
  const handleCloseWizard = () => setIsWizardOpen(false);

  return (
    <div className="app-root">
      {/* 1. NAVBAR */}
      <Navbar 
        onOpenWizard={() => handleOpenWizard('chiller')} 
        theme={theme} 
        onToggleTheme={toggleTheme} 
      />

      <main>
        {/* 2. HERO */}
        <Hero onOpenWizard={() => handleOpenWizard('chiller')} />

        {/* 3. LUXURY MACHINERY PRODUCT PHOTOGRAPHY MARQUEE */}
        <MachineryMarquee onOpenWizard={handleOpenWizard} />

        {/* 4. THE PROBLEM */}
        <TheProblem />

        {/* 5. THE SOLUTION */}
        <TheSolution />

        {/* 6. HOW IT WORKS */}
        <HowItWorks />

        {/* 7. FEATURES */}
        <Features />

        {/* 8. EPD EXPLAINED */}
        <EpdExplained />

        {/* 9. DASHBOARD PREVIEW */}
        <DashboardPreview />

        {/* 10. WHO IT'S FOR */}
        <WhoItsFor />

        {/* 11. FAQ */}
        <Faq />

        {/* 12. CTA */}
        <Cta onOpenWizard={handleOpenWizard} />
      </main>

      {/* 13. FOOTER */}
      <Footer />

      {/* INTERACTIVE EPD BUILDER / WIZARD MODAL */}
      <EpdCreatorModal 
        isOpen={isWizardOpen} 
        onClose={handleCloseWizard}
        initialProduct={wizardProduct}
      />
    </div>
  );
}
