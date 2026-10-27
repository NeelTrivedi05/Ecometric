import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LandingNavbar from '../components/landing/LandingNavbar';
import Hero9 from '../components/landing/Hero9';
import WhatIsEpd from '../components/landing/WhatIsEpd';
import WhyEpdMatters from '../components/landing/WhyEpdMatters';
import WhoNeedsEpd from '../components/landing/WhoNeedsEpd';
import Pricing11 from '../components/landing/Pricing11';
import PricingAbstractAngles from '../components/landing/PricingAbstractAngles';
import TrustProof from '../components/landing/TrustProof';
import TheProblem from '../components/landing/TheProblem';
import TheSolution from '../components/landing/TheSolution';
import LifeCycleRibbon from '../components/landing/LifeCycleRibbon';
import HowItWorks from '../components/landing/HowItWorks';
import Features from '../components/landing/Features';
import EpdExplained from '../components/landing/EpdExplained';
import DashboardPreview from '../components/landing/DashboardPreview';
import WhoItsFor from '../components/landing/WhoItsFor';
import Faq from '../components/landing/Faq';
import CtaBanner from '../components/landing/CtaBanner';
import LandingFooter from '../components/landing/LandingFooter';
import '../styles/LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });

    // Scroll reveal observer for silky smooth page entrance
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, [pathname]);

  const handleLaunchApp = () => {
    navigate('/app');
  };

  const page = pathname === '/' ? 'overview' : pathname.slice(1);

  const renderPageContent = () => {
    switch (page) {
      case 'pipeline':
        return <TheSolution />;
      case 'modules':
        return <LifeCycleRibbon />;
      case 'how-it-works':
        return <HowItWorks />;
      case 'capabilities':
        return (
          <>
            <Features />
            <EpdExplained />
            <DashboardPreview onLaunchApp={handleLaunchApp} />
            <WhoItsFor />
          </>
        );
      case 'faq':
        return (
          <>
            <Faq />
            <CtaBanner onLaunchApp={handleLaunchApp} />
          </>
        );
      case 'pricing':
        return <PricingAbstractAngles onLaunchApp={handleLaunchApp} />;
      case 'overview':
      default:
        return (
          <>
            <Hero9 onLaunchApp={handleLaunchApp} />
            <WhatIsEpd />
            <WhyEpdMatters />
            <WhoNeedsEpd />
            <Pricing11 onLaunchApp={handleLaunchApp} />
            <TrustProof />
            <TheProblem />
          </>
        );
    }
  };

  return (
    <div className="landing-page-root">
      <LandingNavbar onLaunchApp={handleLaunchApp} />
      <main>{renderPageContent()}</main>
      <LandingFooter />
    </div>
  );
}
