import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, HelpCircle, ShieldCheck, FileCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../services/api';

// 1. About Us Component
export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center space-y-4">
        <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          Our Educational Mission
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Empowering Every NEET Aspirant with High-Yield NCERT Precision
        </h1>
        <p className="text-slate-600 text-base leading-relaxed max-w-2xl mx-auto">
          Built by top government medical college rankers and veteran NEET faculty, NEET Notes Marketplace bridges the gap between bulky textbooks and rapid, retainable revision.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            01
          </div>
          <h3 className="font-bold text-slate-900 text-base">NCERT Line Mapping</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Every diagram, caption, table, and summary line transformed into rapid question triggers and memory anchors.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
            02
          </div>
          <h3 className="font-bold text-slate-900 text-base">45-Second Shortcut Methods</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Elimination tricks and dimensional checks for Physics & Physical Chemistry numericals to maximize speed.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
            03
          </div>
          <h3 className="font-bold text-slate-900 text-base">Instant Printable PDFs</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            256-bit encrypted downloads accessible in your personal library for lifetime offline reading and color printing.
          </p>
        </div>
      </div>
    </div>
  );
};

// 2. FAQ Component
export const FAQPage: React.FC = () => {
  const faqs = [
    {
      q: 'How do I download my notes after purchasing?',
      a: 'Immediately upon successful payment, your purchased study modules appear in "My Library" on your student dashboard with high-resolution PDF download buttons.',
    },
    {
      q: 'Can I print these notes or read them on my tablet/iPad?',
      a: 'Yes! All PDF files are fully unlocked for personal study, offline reading on mobile/tablet/laptop, and high-resolution color printing.',
    },
    {
      q: 'Are these notes strictly updated according to the latest NTA NEET syllabus?',
      a: 'Yes, all our faculty updates line-by-line notes corresponding to the rationalized NCERT syllabus released by the National Medical Commission (NMC) and NTA.',
    },
    {
      q: 'Can I preview notes before buying?',
      a: 'Absolutely! Every note package offers a free multi-page preview reader directly in your browser so you can evaluate the handwriting clarity and content quality.',
    },
    {
      q: 'What payment methods are supported?',
      a: 'We support all major Indian payment methods through Razorpay, including Google Pay, PhonePe, Paytm, BHIM UPI, Debit/Credit cards, and NetBanking.',
    },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Frequently Asked Questions</h1>
        <p className="text-xs sm:text-sm text-slate-500">Everything you need to know about note access, payments, and downloads.</p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <span>{faq.q}</span>
                {isOpen ? <ChevronUp className="w-4 h-4 text-emerald-600" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              {isOpen && (
                <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 3. Contact Us Component
export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMsg('');

    try {
      const res = await api.submitContact({ name, email, subject, message });
      if (res.success) {
        setStatusMsg('Thank you! Your message has been dispatched to our academic support desk.');
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
      } else {
        setStatusMsg(res.message || 'Failed to send message.');
      }
    } catch (err) {
      setStatusMsg('Error sending contact message.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Info Box */}
        <div className="md:col-span-5 space-y-6">
          <div>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Student Helpdesk
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-2">Get in Touch With Us</h1>
            <p className="text-xs text-slate-500 mt-1">
              Have queries about specific chapters, payments, or study materials? Our team is here to assist.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-slate-200">
              <Mail className="w-4 h-4 text-emerald-600" />
              <div>
                <div className="font-bold text-slate-900">Email Support</div>
                <div className="text-slate-500">support@neetnoteshq.com</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-slate-200">
              <Phone className="w-4 h-4 text-teal-600" />
              <div>
                <div className="font-bold text-slate-900">WhatsApp / Helpline</div>
                <div className="text-slate-500">+91 98765 43210 (9 AM - 8 PM IST)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="md:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Your Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Aarav Sharma"
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Your Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Subject</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Question regarding Zoology Genetics notes"
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Message</label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your question or feedback..."
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
              />
            </div>

            {statusMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-semibold">
                {statusMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
