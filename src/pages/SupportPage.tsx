import React from 'react';
import { HelpCircle, MessageCircle, FileText, ExternalLink } from 'lucide-react';

export function SupportPage() {
  return (
    <div className="h-full w-full bg-[#0a0a0a] overflow-y-auto custom-scrollbar p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <HelpCircle size={24} className="text-app-accent" />
            <h1 className="text-[24px] font-app-bold text-white uppercase tracking-wide">
              Support
            </h1>
          </div>
          <p className="text-app-muted text-[13px]">
            Get help and find answers
          </p>
        </div>

        {/* Support Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <SupportCard 
            icon={<MessageCircle size={20} />}
            title="Community Discord"
            description="Join our community for real-time support and discussions"
            action="Join Discord"
            href="#"
          />
          <SupportCard 
            icon={<FileText size={20} />}
            title="Documentation"
            description="Read our comprehensive guides and API documentation"
            action="View Docs"
            href="#"
          />
        </div>

        {/* FAQ */}
        <div className="bg-[#111] border border-[#222] mb-6">
          <div className="p-4 border-b border-[#222]">
            <h2 className="text-[14px] font-app-bold text-white uppercase">Frequently Asked Questions</h2>
          </div>
          <div className="divide-y divide-[#222]">
            <FAQItem 
              question="How do I join a round?"
              answer="Connect your wallet, click 'Play to Win' when entry is open, configure your loadout, and pay the entry fee."
            />
            <FAQItem 
              question="What happens if I'm eliminated?"
              answer="You lose your entry fee for that round. Your kills still count toward your season ranking."
            />
            <FAQItem 
              question="How are prizes distributed?"
              answer="The winner takes 80% of the round pool. 10% goes to platform fees and 10% to the season prize pool."
            />
            <FAQItem 
              question="When does the season end?"
              answer="Seasons run for 30 days. Check the countdown in the sidebar for exact time remaining."
            />
          </div>
        </div>

        {/* Contact */}
        <div className="bg-[#111] border border-[#222] p-6">
          <h2 className="text-[14px] font-app-bold text-white uppercase mb-4">Contact Us</h2>
          <p className="text-[13px] text-app-muted mb-4">
            For technical issues or bug reports, please reach out to our support team.
          </p>
          <div className="text-[13px] text-app-accent">
            support@rumblex.io
          </div>
        </div>
      </div>
    </div>
  );
}

function SupportCard({ icon, title, description, action, href }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  action: string;
  href: string;
}) {
  return (
    <a 
      href={href}
      className="bg-[#111] border border-[#222] p-5 hover:border-app-accent/50 transition-colors group"
    >
      <div className="text-app-accent mb-3">{icon}</div>
      <h3 className="text-white font-app-bold text-[14px] mb-2">{title}</h3>
      <p className="text-app-muted text-[12px] mb-4">{description}</p>
      <div className="flex items-center gap-1 text-app-accent text-[12px] font-app-bold">
        {action}
        <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </a>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="p-4">
      <h3 className="text-white text-[14px] font-app-bold mb-2">{question}</h3>
      <p className="text-app-muted text-[13px]">{answer}</p>
    </div>
  );
}
