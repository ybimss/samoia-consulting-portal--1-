import React from 'react';
import { Lead } from '../types';

export default function LeadDossierPdf({ lead, isForDownload = false }: { lead: Lead, isForDownload?: boolean }) {
  if (!lead) return null;

  const category = lead.kategori_hasil || 'THE CRITICAL ZONE';

  const zoneContent = {
    'THE FORTIFIED ZONE': {
      title: 'THE FORTIFIED ZONE',
      zone: 'fortified',
      diagnostic: 'HIGH ACCUMULATION. HIDDEN ARCHITECTURAL VULNERABILITIES.',
      summary: 'Your financial architecture is structurally sound. You belong to the top percentile of individuals who operate with high liquidity and baseline security protocols. However, diagnostic analysis reveals a critical flaw: your system is optimized for wealth accumulation, but severely lacks wealth preservation mechanics against catastrophic health events or estate transfer friction.',
      vulnerabilities: 'Phase 1: Medical bills covered by standard insurance. Phase 2: Active income halts. Standard insurance stops paying for non-hospitalization recovery. Phase 3: Forced liquidation of assets begins. Generational wealth is eroded.',
      directive: 'Absolute asset ring-fencing. Install mechanisms that inject massive, tax-free liquid cash directly into your estate upon diagnosis or death. Deploy Liquid Asset Defense and Generational Transfer Bypass protocols.',
      architecture: {
        title: 'The Wealth Preservation Protocol',
        subtitle: 'This module functions as a surgical strike against asset erosion during health crises',
        tactical: 'IT INJECTS SIGNIFICANT, TAX-FREE LIQUID CAPITAL DIRECTLY INTO YOUR PORTFOLIO UPON THE DIAGNOSIS OF A MAJOR ILLNESS OR DEATH (ANY CAUSES).',
        advantage: 'IT DECOUPLES YOUR RECOVERY FROM YOUR WEALTH ACCUMULATION. BY PROVIDING AN IMMEDIATE CASH INJECTION, IT PREVENTS THE FORCED LIQUIDATION OF YOUR REAL ESTATE OR BUSINESS ASSETS, WHICH TYPICALLY OCCURS WHEN HIGH-NET-WORTH INDIVIDUALS ARE FORCED TO COVER LONG-TERM RECOVERY COSTS.'
      },
      page3Title: 'The Illusion of Complete Coverage',
      page3Text: 'You likely possess standard health insurance or corporate benefits. The critical error is confusing medical reimbursement with wealth preservation. When a severe critical illness strikes, medical bills are only 30% of the financial impact. The remaining 70% is the silent destruction of your active income and the forced liquidation of your business assets or investment portfolios to cover ongoing lifestyle and recovery costs. Furthermore, your current setup lacks a definitive, liquid legacy mechanism that bypasses probate and instantly replaces your economic value for your heirs.',
      page4Heading: 'Closing the Final Gap',
      page4Text: 'The objective is no longer about survival; it is about absolute wealth preservation and legacy creation. We must ring-fence your assets so that no health crisis can touch your existing net worth.',
      renderPage4Icon: () => (
        <svg className="w-48 h-48 mx-auto text-black/80" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="20" y1="50" x2="180" y2="50" stroke="currentColor" strokeWidth="2" />
          <line x1="20" y1="100" x2="180" y2="100" stroke="currentColor" strokeWidth="2" />
          <line x1="20" y1="150" x2="180" y2="150" stroke="currentColor" strokeWidth="2" />
          <circle cx="60" cy="50" r="8" fill="currentColor" />
          <circle cx="120" cy="100" r="8" fill="currentColor" />
          <circle cx="150" cy="150" r="8" fill="currentColor" />
          <text x="25" y="42" fill="currentColor" className="font-mono text-[10px]">A</text>
          <text x="25" y="92" fill="currentColor" className="font-mono text-[10px]">B</text>
          <text x="25" y="142" fill="currentColor" className="font-mono text-[10px]">C</text>
        </svg>
      )
    },
    'THE EXPOSED ZONE': {
      title: 'THE EXPOSED ZONE',
      zone: 'exposed',
      diagnostic: 'HIGH INCOME VELOCITY. CRITICAL LACK OF STRUCTURAL REDUNDANCY.',
      summary: 'Your financial engine is running at high capacity. However, your entire economic ecosystem relies on a Single Point of Failure (SPOF): your ongoing physical ability to generate active income. You are operating a high-performance system without an adequate safety net.',
      vulnerabilities: 'Phase 1: Savings absorb the initial shock. Phase 2: Emergency liquidity is fully depleted. Forced to rely on standard government healthcare. Phase 3: Lifestyle collapses. Debt accumulation accelerates exponentially.',
      directive: 'Immediate installation of an Income Replacement & Premium Defense architecture. Build an automated financial bridge that sustains your family\'s lifestyle even if your physical engine stops working.',
      architecture: {
        title: 'Comprehensive Defense System',
        subtitle: 'The All-In-One Fail-Safe: Bridging Economic Runways for Long-Term Stability',
        tactical: 'THIS SYSTEM IS ENGINEERED TO PROVIDE ROBUST LIFE PROTECTION WHILE SIMULTANEOUSLY CONSTRUCTING INTERNAL CASH VALUE OVER TIME, SERVING AS AN INTEGRATED PLATFORM THAT GROWS WITH THE CLIENT\'S FINANCIAL SCALING.',
        advantage: 'THE SYSTEM IS DESIGNED TO BRIDGE THE ECONOMIC RUNWAY (1 TO 5 YEARS OF EXPENSES) TO PROTECT AGAINST UNEXPECTED LIFE DISRUPTIONS, ENSURING THAT THE CLIENT\'S LIFESTYLE REMAINS UNAFFECTED EVEN IF THEIR ABILITY TO GENERATE ACTIVE INCOME IS PAUSED.'
      },
      page3Title: 'The Cost of Procrastination',
      page3Text: 'You are acutely aware that you need better financial planning, but the urgency of daily obligations has pushed this down your priority list. The blind spot here is believing you have \'time\' to fix this later. If an unexpected medical emergency occurs tomorrow, the financial shockwave will instantly shatter your family’s stability. Your dependents will not only face emotional trauma but will inherit a severe financial crisis.',
      page4Heading: 'Constructing the Safety Net',
      page4Text: 'We need to immediately install an \'Income Replacement\' and \'Premium Defense\' system. Your strategy must ensure that if your health stops, your income and family\'s future do not.',
      renderPage4Icon: () => (
        <svg className="w-48 h-48 mx-auto text-black/80" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M40 140 L160 140 L100 60 Z" stroke="currentColor" strokeWidth="2" />
          <path d="M50 120 L150 120" stroke="currentColor" strokeWidth="1.5" />
          <path d="M65 100 L135 100" stroke="currentColor" strokeWidth="1.5" />
          <path d="M80 80 L120 80" stroke="currentColor" strokeWidth="1.5" />
          <text x="100" y="155" fill="currentColor" className="font-mono text-[10px] text-center" textAnchor="middle">REDUNDANCY</text>
        </svg>
      )
    },
    'THE VULNERABLE ZONE': {
      title: 'THE VULNERABLE ZONE',
      zone: 'vulnerable',
      diagnostic: 'SEVERE DEPENDENCY LOAD. IMMINENT THREAT OF SYSTEM COLLAPSE.',
      summary: 'You carry a massive burden. Multiple individuals rely entirely on your daily economic output. Every day you operate without a defense mechanism, you are risking the permanent financial ruin of the people who depend on you.',
      vulnerabilities: 'Phase 1: Panic. Zero liquidity available for private hospital deposits. Phase 2: You must borrow money from extended family or predatory lenders just to survive. Phase 3: Generational poverty is triggered. Education funds vanish.',
      directive: 'Perfection is not the goal; survival is. Instantly deploy a highly leveraged, budget-optimized defense protocol. Utilize High Leverage Medical Guardians and Immediate Estate Creation.',
      architecture: {
        title: 'Comprehensive Defense System',
        subtitle: 'The All-In-One Fail-Safe: Bridging Economic Runways for Long-Term Stability',
        tactical: 'THIS SYSTEM IS ENGINEERED TO PROVIDE ROBUST LIFE PROTECTION WHILE SIMULTANEOUSLY CONSTRUCTING INTERNAL CASH VALUE OVER TIME, SERVING AS AN INTEGRATED PLATFORM THAT GROWS WITH THE CLIENT\'S FINANCIAL SCALING.',
        advantage: 'THE SYSTEM IS DESIGNED TO BRIDGE THE ECONOMIC RUNWAY (1 TO 5 YEARS OF EXPENSES) TO PROTECT AGAINST UNEXPECTED LIFE DISRUPTIONS, ENSURING THAT THE CLIENT\'S LIFESTYLE REMAINS UNAFFECTED EVEN IF THEIR ABILITY TO GENERATE ACTIVE INCOME IS PAUSED.'
      },
      page3Title: 'The Fragility of Active Income',
      page3Text: 'Your greatest asset right now is not your savings; it is your ability to wake up and work. What happens when that asset breaks down? Relying solely on company-provided insurance or standard government healthcare (BPJS) leaves you highly exposed. These facilities dictate where and how you get treated, stripping away your control. More importantly, if you are forced to stop working for 6 to 12 months due to a severe condition, your current liquidity will rapidly deplete, threatening the lifestyle your family has grown accustomed to.',
      page4Heading: 'Constructing the Safety Net',
      page4Text: 'We need to immediately install an \'Income Replacement\' and \'Premium Defense\' system. Your strategy must ensure that if your health stops, your income and family\'s future do not.',
      renderPage4Icon: () => (
        <svg className="w-48 h-48 mx-auto text-black/80" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M40 140 L160 140 L100 60 Z" stroke="currentColor" strokeWidth="2" />
          <path d="M50 120 L150 120" stroke="currentColor" strokeWidth="1.5" />
          <path d="M65 100 L135 100" stroke="currentColor" strokeWidth="1.5" />
          <path d="M80 80 L120 80" stroke="currentColor" strokeWidth="1.5" />
          <text x="100" y="155" fill="currentColor" className="font-mono text-[10px] text-center" textAnchor="middle">REDUNDANCY</text>
        </svg>
      )
    },
    'THE CRITICAL ZONE': {
      title: 'THE CRITICAL ZONE',
      zone: 'critical',
      diagnostic: 'CODE RED. ZERO MARGIN FOR ERROR.',
      summary: 'This is a diagnostic intervention. Your current financial architecture is completely exposed to external shock. Your survival right now is based purely on luck and endurance. Luck is not a strategy.',
      vulnerabilities: 'Phase 1: Instant financial collapse. There is no buffer. Phase 2: Dependents are forced to take on immediate, high-interest debt or drastically alter their life trajectories. Conclusion: The system actively destroys the future of the dependents left behind.',
      directive: 'Execute an emergency lockdown. Bypass luxury add-ons. Deploy the most basic, absolute core survival mechanisms (The Core Survival Shield) to ensure that your family is not left financially destitute.',
      architecture: {
        title: 'The Core Survival Shield',
        subtitle: 'Entry-level protection protocol designed specifically for high-risk profiles',
        tactical: 'IT SERVES AS THE BASELINE FINANCIAL LIFEBOAT, DESIGNED TO PREVENT THE IMMEDIATE ECONOMIC COLLAPSE OF A HOUSEHOLD DURING A CRITICAL HEALTH EMERGENCY OR SUDDEN DEATH.',
        advantage: 'DURING CRITICAL ILLNESS: IF A MEDICAL DIAGNOSIS OCCURS, THE PROTOCOL TRIGGERS A DIRECT CASH RELIEF INJECTION TO MAINTAIN HOUSEHOLD OPERATIONS AND PAY FOR BASIC NECESSITIES WHILE THE BREADWINNER IS UNABLE TO WORK. IN CASE OF DEATH: IT PROVIDES A FOUNDATIONAL LIFE BENEFIT TO ENSURE DEPENDENTS ARE NOT LEFT ENTIRELY WITHOUT RESOURCES.'
      },
      page3Title: 'The \'I Can\'t Afford It\' Trap',
      page3Text: 'The primary psychological barrier keeping you in this zone is the belief that protection is an \'expense\' you cannot afford right now. Flip the equation: If you cannot afford a small monthly contribution to protect your health, how will your family afford a 500-million Rupiah hospital bill? The stark truth is, you are the exact demographic that cannot afford not to have it. Delaying this decision is silently compounding your family\'s risk every single day.',
      page4Heading: 'Immediate Structural Reinforcement',
      page4Text: 'Perfection is the enemy of progress. We do not need a complex setup right now. We need immediate, high-impact defense mechanisms that guarantee hospital bills are paid and your family receives a massive cash injection if you are no longer here.',
      renderPage4Icon: () => (
        <svg className="w-48 h-48 mx-auto text-black/80" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="2" />
          <circle cx="100" cy="100" r="20" stroke="currentColor" strokeWidth="2" />
          <line x1="100" y1="20" x2="100" y2="180" stroke="currentColor" strokeWidth="1.5" />
          <line x1="20" y1="100" x2="180" y2="100" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="100" cy="100" r="5" fill="currentColor" />
        </svg>
      )
    }
  };

  const currentZone = zoneContent[category as keyof typeof zoneContent] || zoneContent['THE CRITICAL ZONE'];

  return (
    <div 
      id="lead-dossier-pdf-content" 
      className={`${isForDownload ? 'block' : 'hidden print:block'} bg-[#F4F4F4] w-[794px] mx-auto`}
      style={{ boxSizing: 'border-box' }}
    >
      
      {/* ================= PAGE 1: COVER PAGE ================= */}
      <div 
        className="relative bg-[#0B0B0B] text-white w-full p-12 flex flex-col justify-between" 
        style={{ height: '1123px', pageBreakAfter: 'always', breakAfter: 'page', boxSizing: 'border-box' }}
      >
        {/* Thin Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-white"></div>

        {/* Corporate Branding Header */}
        <div className="flex justify-between items-start pt-4">
          <div className="font-mono text-[10px] tracking-widest text-white/40 uppercase">
            SAMOIA CONSULTING PARTNERSHIP
          </div>
          <div className="font-mono text-[10px] tracking-widest text-white/40 uppercase">
            SECURE DOSSIER • CONFIDENTIAL
          </div>
        </div>

        {/* Huge Cover Title */}
        <div className="my-auto space-y-4">
          <span className="text-white/40 font-mono text-xs uppercase tracking-widest block">REPORT TYPE: RISK SPECIFICATION</span>
          <h1 className="text-5xl font-light tracking-widest leading-none uppercase text-white font-sans">
            FINANCIAL<br />PROTECTION<br />ASSESSMENT
          </h1>
          <div className="w-16 h-[2px] bg-white my-6"></div>
          <p className="text-white/40 text-[10px] font-mono tracking-widest uppercase max-w-sm">
            DYNAMIC RISK NERACA ANALYSIS AND ARCHITECTURAL MITIGATION SCHEME SPECIFICALLY FORMULATED FOR INDIVIDUAL ASSET RETENTION.
          </p>
        </div>

        {/* Metadata Details Bottom-Right */}
        <div className="flex justify-between items-end border-t border-white/10 pt-8 pb-4">
          <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest">
            ALL DATA TRANSMISSIONS ARE PDP SECURITY COMPLIANT
          </div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-none w-72 space-y-2 text-[10px] font-mono">
            <div className="flex justify-between">
              <span className="text-white/40">CLIENT:</span>
              <span className="font-semibold text-white uppercase">{lead.nama_calon_nasabah}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">PHONE:</span>
              <span className="text-white">{lead.whatsapp}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">EMAIL:</span>
              <span className="text-white uppercase text-right truncate max-w-[150px]">{lead.email || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">DATE:</span>
              <span className="text-white">{new Date(lead.created_at).toLocaleDateString('id-ID')}</span>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-2 mt-2">
              <span className="text-white/40">ADVISOR:</span>
              <span className="font-bold text-white uppercase">{lead.sales_nama || 'SAMOIA CONSULTANT'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= PAGE 2: DIAGNOSIS ================= */}
      <div 
        className="relative bg-[#F5F5F5] text-black w-full p-12 flex flex-col justify-between" 
        style={{ height: '1123px', pageBreakAfter: 'always', breakAfter: 'page', boxSizing: 'border-box' }}
      >
        {/* Header */}
        <div className="border-b border-black/10 pb-4 flex justify-between items-end">
          <div>
            <h2 className="text-lg font-light uppercase tracking-widest">Samoia Consulting</h2>
            <p className="text-[8px] font-mono text-black/40 uppercase tracking-widest">Secure Report • Section 01</p>
          </div>
          <div className="text-right font-mono text-[8px] text-black/40 uppercase tracking-widest">
            <p>CONFIDENTIAL REPORT</p>
            <p>DIAGNOSTIC BLOCK</p>
          </div>
        </div>

        {/* Content Diagnosis */}
        <div className="my-auto space-y-8">
          <div className="space-y-1">
            <span className="text-black/40 font-mono text-[10px] tracking-widest uppercase">DIAGNOSIS CATEGORY</span>
            <h1 className="text-3xl font-light uppercase tracking-widest text-black border-b border-black/20 pb-2">{category}</h1>
          </div>

          <div className="py-6 text-center">
            {/* Center Network Node SVG Icon */}
            <svg className="w-24 h-24 mx-auto text-black" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="10" stroke="currentColor" strokeWidth="2" />
              <line x1="50" y1="20" x2="50" y2="40" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
              <line x1="50" y1="60" x2="50" y2="80" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
              <line x1="20" y1="50" x2="40" y2="50" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
              <line x1="60" y1="50" x2="80" y2="50" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
              <circle cx="50" cy="15" r="5" stroke="currentColor" strokeWidth="2" />
              <circle cx="50" cy="85" r="5" stroke="currentColor" strokeWidth="2" />
              <circle cx="15" cy="50" r="5" stroke="currentColor" strokeWidth="2" />
              <circle cx="85" cy="50" r="5" stroke="currentColor" strokeWidth="2" />
            </svg>
            <h3 className="text-xs font-mono tracking-widest text-black mt-4 font-bold uppercase">{currentZone.diagnostic}</h3>
          </div>

          <div className="space-y-6 text-xs text-black/80 font-sans leading-relaxed">
            <div className="border border-black/10 p-5 bg-white/50">
              <strong className="text-black uppercase tracking-wider block mb-2 text-[10px]">Executive Summary</strong>
              <p>{currentZone.summary}</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="border border-black/10 p-5 bg-white/50">
                <strong className="text-black uppercase tracking-wider block mb-2 text-[10px]">Structural Vulnerabilities</strong>
                <p>{currentZone.vulnerabilities}</p>
              </div>
              <div className="border border-black/10 p-5 bg-white/50">
                <strong className="text-black uppercase tracking-wider block mb-2 text-[10px]">Strategic Directive</strong>
                <p>{currentZone.directive}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-black/10 pt-4 flex justify-between items-center text-[8px] font-mono text-black/40 uppercase tracking-widest">
          <span>SAMOIA CONSULTING © 2026</span>
          <span>PAGE 2 OF 4</span>
        </div>
      </div>

      {/* ================= PAGE 3: BLIND SPOT ANALYSIS ================= */}
      <div 
        className="relative bg-[#F5F5F5] text-black w-full p-12 flex flex-col justify-between" 
        style={{ height: '1123px', pageBreakAfter: 'always', breakAfter: 'page', boxSizing: 'border-box' }}
      >
        {/* Header */}
        <div className="border-b border-black/10 pb-4 flex justify-between items-end">
          <div>
            <h2 className="text-lg font-light uppercase tracking-widest">Samoia Consulting</h2>
            <p className="text-[8px] font-mono text-black/40 uppercase tracking-widest">Secure Report • Section 02</p>
          </div>
          <div className="text-right font-mono text-[8px] text-black/40 uppercase tracking-widest">
            <p>CONFIDENTIAL REPORT</p>
            <p>BLIND SPOT MATRIX</p>
          </div>
        </div>

        {/* Content Blind Spot */}
        <div className="my-auto space-y-6 text-center">
          <span className="text-black/40 font-mono text-[10px] tracking-widest uppercase">THE BLIND SPOT ANALYSIS</span>
          <h2 className="text-2xl font-light uppercase tracking-wider text-black">{currentZone.page3Title}</h2>


          <div className="border border-black/10 p-6 bg-white text-left text-xs text-black/80 font-sans leading-relaxed max-w-xl mx-auto">
            <p>{currentZone.page3Text}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-black/10 pt-4 flex justify-between items-center text-[8px] font-mono text-black/40 uppercase tracking-widest">
          <span>SAMOIA CONSULTING © 2026</span>
          <span>PAGE 3 OF 4</span>
        </div>
      </div>

      {/* ================= PAGE 4: GAP CLOSURE / STRUCTURAL REINFORCEMENT ================= */}
      <div 
        className="relative bg-[#F5F5F5] text-black w-full p-12 flex flex-col justify-between" 
        style={{ height: '1123px', pageBreakAfter: 'always', breakAfter: 'page', boxSizing: 'border-box' }}
      >
        {/* Header */}
        <div className="border-b border-black/10 pb-4 flex justify-between items-end">
          <div>
            <h2 className="text-lg font-light uppercase tracking-widest">Samoia Consulting</h2>
            <p className="text-[8px] font-mono text-black/40 uppercase tracking-widest">Secure Report • Section 03</p>
          </div>
          <div className="text-right font-mono text-[8px] text-black/40 uppercase tracking-widest">
            <p>CONFIDENTIAL REPORT</p>
            <p>REINFORCEMENT PATH</p>
          </div>
        </div>

        {/* Content Page 4 */}
        <div className="my-auto space-y-8 text-center">
          <span className="text-black/40 font-mono text-[10px] tracking-widest uppercase">IMMEDIATE ACTION PLAN</span>
          <h1 className="text-3xl font-light uppercase tracking-widest text-black">{currentZone.page4Heading}</h1>

          {/* Dynamic SVG Visual representation based on the Zone */}
          <div className="py-4">
            {currentZone.renderPage4Icon()}
          </div>

          <div className="border border-black/10 p-6 bg-white text-left text-xs text-black/80 font-sans leading-relaxed max-w-xl mx-auto space-y-4">
            <p>{currentZone.page4Text}</p>
            <p>
              Your personal Samoia professional advisor has synthesized your structural protection gaps. This diagnostic 
              is configured to bypass boilerplate insurance models and construct a customized financial vault that guarantees 
              unconditional liquidity when you or your family require it most.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-black/10 pt-4 flex justify-between items-center text-[8px] font-mono text-black/40 uppercase tracking-widest">
          <span>SAMOIA CONSULTING © 2026</span>
          <span>PAGE 4 OF 4</span>
        </div>
      </div>

    </div>
  );
}
