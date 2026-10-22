import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LandingNavbar from '../components/landing/LandingNavbar';
import Hero9 from '../components/landing/Hero9';
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

  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }

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
  }, []);

  const handleLaunchApp = () => {
    navigate('/app');
  };

  return (
    <div className="landing-page-root">
      <LandingNavbar onLaunchApp={handleLaunchApp} />
      <main>
        <Hero9 onLaunchApp={handleLaunchApp} />
        <TrustProof />
        <TheProblem />
        <TheSolution />
        <LifeCycleRibbon />
        <HowItWorks />
        <Features />
        <EpdExplained />
        <DashboardPreview onLaunchApp={handleLaunchApp} />
        <WhoItsFor />
        <Faq />
        <CtaBanner onLaunchApp={handleLaunchApp} />
      </main>
      <LandingFooter />
    </div>
  );
}
