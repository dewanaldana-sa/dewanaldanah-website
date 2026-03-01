"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Zap,
  Droplets,
  Paintbrush,
  MessageCircle,
  Send,
  ChevronDown,
  ArrowLeft,
  Phone,
  MapPinned,
  CheckCircle,
  ClipboardList,
  Building2,
  Menu,
  X,
} from "lucide-react";

// Dynamically import WebGLCanvas
const WebGLCanvas = dynamic(() => import("@/components/3d/WebGLCanvas"), {
  ssr: false,
});

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Services data
const services = [
  {
    icon: <Zap className="w-7 h-7" />,
    title: "التمديدات الكهربائية",
    description: "تنفيذ أنظمة كهربائية متكاملة بأعلى معايير السلامة والجودة",
  },
  {
    icon: <Droplets className="w-7 h-7" />,
    title: "السباكة",
    description: "أنظمة مياه وصرف صحي احترافية مع ضمان الأداء المتميز",
  },
  {
    icon: <Paintbrush className="w-7 h-7" />,
    title: "تشطيب المباني",
    description: "تشطيبات داخلية وخارجية بمعايير راقية وإتقان متقن",
  },
];

// Features data
const features = [
  { icon: <CheckCircle className="w-6 h-6" />, title: "دقة تنفيذ عالية", desc: "التزام تام بالمواصفات الهندسية" },
  { icon: <ClipboardList className="w-6 h-6" />, title: "إدارة مشاريع احترافية", desc: "تخطيط ومتابعة دقيقة" },
  { icon: <Building2 className="w-6 h-6" />, title: "التزام كامل بالجودة", desc: "معايير عالمية في كل مشروع" },
];

export default function Home() {
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const [formData, setFormData] = useState({ name: "", phone: "", message: "" });
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const introPlayed = useRef(false);

  // =========================================================================
  // MASTER INTRO TIMELINE (GSAP)
  // =========================================================================
  useEffect(() => {
    if (introPlayed.current) return;
    introPlayed.current = true;

    const introLoader = document.getElementById("intro-loader");
    const cinematicWrapper = document.querySelector(".cinematic-wrapper");
    const heroElements = document.querySelectorAll(".hero-animate");

    // Ensure elements exist
    if (!introLoader || !cinematicWrapper) return;

    // MASTER TIMELINE
    const masterTL = gsap.timeline({
      onComplete: () => {
        // Hide loader completely after animation
        introLoader.classList.add("hidden");
        // Enable interactions
        gsap.set(cinematicWrapper, { pointerEvents: "all" });
      }
    });

    // STEP 1: Wait 0.8 seconds (video plays)
    masterTL.to({}, { duration: 0.8 });

    // STEP 2: Fade out intro loader (reveal 3D scene)
    masterTL.to(introLoader, {
      opacity: 0,
      duration: 1.5,
      ease: "power2.inOut",
      onStart: () => {
        // Make wrapper visible but still transparent
        cinematicWrapper.classList.add("visible");
      }
    }, ">");

    // STEP 3: Animate hero content in
    masterTL.fromTo(heroElements, 
      { y: 30, opacity: 0 },
      { 
        y: 0, 
        opacity: 1, 
        duration: 1, 
        stagger: 0.2,
        ease: "power2.out" 
      },
      "-=0.8" // Start slightly before loader fully fades
    );

    // STEP 4: Fade in the wrapper
    masterTL.to(cinematicWrapper, {
      opacity: 1,
      duration: 0.5,
    }, "-=1");

    // Click/Touch to skip with SMOOTH transition (not instant)
    const handleSkip = () => {
      // Smoothly accelerate to end of timeline (duration: 0.8s for smooth feel)
      masterTL.timeScale(3).play();
    };

    introLoader.addEventListener("click", handleSkip);
    introLoader.addEventListener("touchstart", handleSkip);

    return () => {
      introLoader.removeEventListener("click", handleSkip);
      introLoader.removeEventListener("touchstart", handleSkip);
      masterTL.kill();
    };
  }, []);

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener("scroll", handleScroll);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // GSAP ScrollTrigger animations for sections
  useEffect(() => {
    sectionRefs.current.forEach((section) => {
      if (!section) return;
      
      const elements = section.querySelectorAll(".fade-in");
      
      gsap.fromTo(
        elements,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.12,
          ease: "power2.out",
          scrollTrigger: {
            trigger: section,
            start: "top 70%",
            end: "bottom 30%",
            toggleActions: "play none none reverse",
          },
        }
      );
    });
    
    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const message = `مرحباً، أنا ${formData.name}\nرقم الهاتف: ${formData.phone}\n\n${formData.message}`;
    window.open(`https://wa.me/966579507255?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <>
      {/* =========================================================================
          INTRO LOADER - WHITE BACKGROUND WITH VIDEO
          ========================================================================= */}
      <div id="intro-loader">
        <div className="intro-video-container">
          <video
            className="intro-video"
            autoPlay
            muted
            playsInline
          >
            <source src="https://res.cloudinary.com/dwck4hd8b/video/upload/v1771847114/vedio_upf5tj.mp4" type="video/mp4" />
          </video>
        </div>
      </div>

      {/* =========================================================================
          THREE.JS CANVAS - RENDERS FROM START (BEHIND LOADER)
          ========================================================================= */}
      <WebGLCanvas />

      {/* =========================================================================
          MAIN CONTENT WRAPPER - HIDDEN INITIALLY
          ========================================================================= */}
      <div className="cinematic-wrapper" dir="rtl">
        
        {/* Header */}
        <header className={`site-header ${isScrolled ? "scrolled" : ""}`}>
          <div className="header-content">
            <div className="logo-container">
              <img
                src="https://res.cloudinary.com/dwck4hd8b/image/upload/v1772011743/unnamed__32_-removebg-preview_h5k7vv.png"
                alt="ديوان الدانة للإنشاءات والمقاولات"
                className="logo-image"
              />
            </div>
            
            <nav className="desktop-nav">
              {["الرئيسية", "خدماتنا", "لماذا نحن", "تواصل معنا"].map((item, i) => (
                <a
                  key={i}
                  href={`#${["hero", "services", "why-us", "contact"][i]}`}
                  className="nav-link"
                >
                  {item}
                </a>
              ))}
            </nav>
            
            <a href="#contact" className="header-cta">
              <Button className="cta-btn">تواصل معنا</Button>
            </a>
            
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
          
          {mobileMenuOpen && (
            <div className="mobile-menu">
              <nav className="mobile-nav">
                {["الرئيسية", "خدماتنا", "لماذا نحن", "تواصل معنا"].map((item, i) => (
                  <a
                    key={i}
                    href={`#${["hero", "services", "why-us", "contact"][i]}`}
                    className="mobile-nav-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item}
                  </a>
                ))}
              </nav>
            </div>
          )}
        </header>
        
        {/* =========================================================================
            SECTION 1: HERO
            ========================================================================= */}
        <section
          id="hero"
          ref={(el) => { sectionRefs.current[0] = el; }}
          className="cinematic-section"
        >
          <div className="section-content">
            <h1 className="hero-animate hero-title">
              نُشيد الثقة
              <br />
              <span className="text-cyan">قبل أن نُشيد المباني</span>
            </h1>
            
            <p className="hero-animate hero-subtitle">
              حلول إنشائية متكاملة بمعايير هندسية دقيقة في قلب جدة
            </p>
            
            <div className="hero-animate">
              <a href="#contact">
                <button className="cta-button">
                  تواصل معنا
                  <ArrowLeft className="inline-block mr-3 w-5 h-5" />
                </button>
              </a>
            </div>
            
            <div className="hero-animate scroll-indicator">
              <ChevronDown className="w-8 h-8" />
            </div>
          </div>
        </section>
        
        {/* =========================================================================
            SECTION 2: SERVICES
            ========================================================================= */}
        <section
          id="services"
          ref={(el) => { sectionRefs.current[1] = el; }}
          className="cinematic-section"
        >
          <div className="section-content">
            <h2 className="fade-in section-title">خدماتنا</h2>
            <div className="fade-in title-underline" />
            
            <div className="services-grid">
              {services.map((service, index) => (
                <div
                  key={index}
                  className="fade-in glass-card"
                >
                  <div className="card-icon">
                    {service.icon}
                  </div>
                  <h3 className="card-title">{service.title}</h3>
                  <p className="card-desc">{service.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* =========================================================================
            SECTION 3: WHY US
            ========================================================================= */}
        <section
          id="why-us"
          ref={(el) => { sectionRefs.current[2] = el; }}
          className="cinematic-section"
        >
          <div className="section-content">
            <h2 className="fade-in section-title">لماذا نحن</h2>
            <div className="fade-in title-underline" />
            
            <div className="features-container">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="fade-in feature-item"
                >
                  <div className="feature-icon">
                    {feature.icon}
                  </div>
                  <div className="feature-text">
                    <h3 className="feature-title">{feature.title}</h3>
                    <p className="feature-desc">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <p className="fade-in features-note">
              نفخر بسجل حافل من الإنجازات وشراكات طويلة الأمد مع عملائنا
              <br />
              في المملكة العربية السعودية
            </p>
          </div>
        </section>
        
        {/* =========================================================================
            SECTION 4: CONTACT
            ========================================================================= */}
        <section
          id="contact"
          ref={(el) => { sectionRefs.current[3] = el; }}
          className="cinematic-section"
        >
          <div className="section-content">
            <h2 className="fade-in section-title">تواصل معنا</h2>
            <div className="fade-in title-underline" />
            
            <div className="contact-grid">
              <div className="fade-in contact-info">
                <div className="info-card">
                  <div className="info-icon whatsapp">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <div className="info-text">
                    <span className="info-label">واتساب</span>
                    <a href="https://wa.me/966579507255" className="info-value">
                      0579507255
                    </a>
                  </div>
                </div>
                
                <div className="info-card">
                  <div className="info-icon cyan">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div className="info-text">
                    <span className="info-label">الهاتف</span>
                    <a href="tel:0579507255" className="info-value">
                      0579507255
                    </a>
                  </div>
                </div>
                
                <div className="info-card">
                  <div className="info-icon cyan-light">
                    <MapPinned className="w-6 h-6" />
                  </div>
                  <div className="info-text">
                    <span className="info-label">العنوان</span>
                    <a 
                      href="https://www.google.com/maps/place/21.550015,39.179227" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="info-value hover:text-cyan transition-colors"
                    >
                      جدة – العزيزية – البلدية
                    </a>
                  </div>
                </div>
                
                <div className="qr-section">
                  <img 
                    src="https://res.cloudinary.com/dwck4hd8b/image/upload/v1772014852/qrdewan_r07ipw.png" 
                    alt="QR Code - ديوان الدانة"
                    className="qr-image"
                  />
                  <span className="qr-label">امسح للتواصل السريع</span>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="fade-in contact-form">
                <div className="form-group">
                  <label className="form-label">الاسم</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="أدخل اسمك"
                    className="form-input"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">رقم الهاتف</label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="أدخل رقم هاتفك"
                    className="form-input"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">الرسالة</label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="اكتب رسالتك..."
                    rows={4}
                    className="form-textarea"
                    required
                  />
                </div>
                
                <Button type="submit" className="submit-button">
                  <Send className="w-5 h-5 ml-2" />
                  إرسال عبر واتساب
                </Button>
              </form>
            </div>
          </div>
        </section>
        
        {/* Footer */}
        <footer className="site-footer">
          <div className="footer-content">
            <p className="footer-text">
              جميع الحقوق محفوظة ديوان الدانة للإنشاءات والمقاولات 2026
            </p>
          </div>
        </footer>
        
        {/* Floating WhatsApp Button */}
        <a
          href="https://wa.me/966579507255"
          target="_blank"
          rel="noopener noreferrer"
          className="whatsapp-float"
        >
          <MessageCircle className="w-7 h-7" />
        </a>
      </div>
    </>
  );
}
