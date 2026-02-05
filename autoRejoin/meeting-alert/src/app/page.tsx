'use client'

/**
 * SalesGuard Landing Page (Phase 1 - As-Is)
 *
 * Professional landing page focused on honest, simple messaging about what works:
 * - Google Calendar sync
 * - Meeting dashboard
 * - One-click join links
 *
 * DOES NOT promise:
 * - Participant detection (coming in Phase 2)
 * - Meeting monitoring
 * - Auto-rejoin features
 *
 * Color Scheme:
 * - Primary: Blue (#2563eb) - Trust, professionalism
 * - Accent: Indigo (#4f46e5) - Modern, tech-forward
 * - Success: Green (#10b981) - Positive actions
 * - Background: Gray gradients - Clean, minimal
 *
 * CTA Strategy:
 * - Hero: Primary CTA immediately visible
 * - Mid-page: After demonstrating value (How It Works)
 * - Bottom: Final conversion opportunity
 * - Pricing section: Direct path to purchase
 *
 * Mobile Responsive:
 * - Stack columns on mobile (<768px)
 * - Adjust typography sizes
 * - Full-width CTAs
 * - Touch-friendly buttons (min 44px height)
 */

import Link from 'next/link'
import {
  Calendar,
  LayoutDashboard,
  ExternalLink,
  CheckCircle,
  Shield,
  CreditCard,
  RefreshCw,
  Lock,
  Link as LinkIcon,
  ChevronDown,
} from 'lucide-react'

export default function LandingPage() {
  return (
    <>
      {/* Enable smooth scrolling for anchor links */}
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }
      `}</style>

      <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                SalesGuard
              </Link>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#how-it-works"
                className="text-gray-600 hover:text-gray-900 transition"
              >
                How It Works
              </a>
              <a
                href="#features"
                className="text-gray-600 hover:text-gray-900 transition"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="text-gray-600 hover:text-gray-900 transition"
              >
                Pricing
              </a>
              <a
                href="#faq"
                className="text-gray-600 hover:text-gray-900 transition"
              >
                FAQ
              </a>
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      {/*
        Gradient background creates visual interest and modern feel
        Centered layout draws focus to headline and CTAs
        Two CTAs: Primary (conversion) + Secondary (education)
      */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:16px_16px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/50" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* Main headline - Clear value proposition */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Never Miss an Important Meeting
            </h1>

            {/* Subheadline - Explains how we deliver the value */}
            <p className="text-xl sm:text-2xl mb-8 text-blue-100 leading-relaxed">
              Smart calendar integration and meeting reminders for busy
              professionals
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {/* Primary CTA - Conversion focused */}
              <Link
                href="/pricing"
                className="w-full sm:w-auto px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold text-lg hover:bg-blue-50 transition shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Get Started - $49/month
              </Link>

              {/* Secondary CTA - Education focused */}
              <a
                href="#how-it-works"
                className="w-full sm:w-auto px-8 py-4 bg-blue-500/20 text-white border-2 border-white/30 rounded-lg font-semibold text-lg hover:bg-blue-500/30 transition"
              >
                See How It Works
              </a>
            </div>

            {/* Trust signal */}
            <p className="mt-8 text-blue-200 text-sm">
              No credit card required for setup • Cancel anytime
            </p>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <ChevronDown className="w-6 h-6 text-white/60" />
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      {/*
        Two-column layout (stacks on mobile)
        Visual contrast: Red (problem) vs Green (solution)
        Relatable pain points → Our solution
      */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Problem Column */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-3xl">😰</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                The Problem
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">
                    Meetings buried in calendar chaos
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">
                    Scrambling to find meeting links
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">
                    Forgetting about important calls
                  </span>
                </li>
              </ul>
            </div>

            {/* Solution Column */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-sm border border-green-200 p-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-3xl">😊</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                The Solution
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle className="w-6 h-6 text-green-600 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">
                    All meetings in one dashboard
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-6 h-6 text-green-600 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">
                    One-click join from anywhere
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-6 h-6 text-green-600 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">
                    Never forget with smart sync
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      {/*
        Three-step process
        Simple, visual, easy to understand
        Builds confidence in the product
      */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started in minutes with our simple three-step process
            </p>
          </div>

          {/* Steps Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-blue-50 rounded-2xl p-8 text-center hover:shadow-lg transition">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <div className="absolute top-4 right-4 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Connect Google Calendar
                </h3>
                <p className="text-gray-600 mb-4">
                  One-click OAuth integration with automatic sync
                </p>
                <ul className="text-sm text-gray-500 text-left space-y-1">
                  <li>• Secure authentication</li>
                  <li>• Read-only access</li>
                  <li>• Instant sync</li>
                </ul>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="bg-indigo-50 rounded-2xl p-8 text-center hover:shadow-lg transition">
                <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <LayoutDashboard className="w-8 h-8 text-white" />
                </div>
                <div className="absolute top-4 right-4 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  View Your Meetings
                </h3>
                <p className="text-gray-600 mb-4">
                  Clean dashboard with all upcoming meetings
                </p>
                <ul className="text-sm text-gray-500 text-left space-y-1">
                  <li>• Chronological view</li>
                  <li>• Meeting details</li>
                  <li>• Real-time updates</li>
                </ul>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="bg-green-50 rounded-2xl p-8 text-center hover:shadow-lg transition">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ExternalLink className="w-8 h-8 text-white" />
                </div>
                <div className="absolute top-4 right-4 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Join with One Click
                </h3>
                <p className="text-gray-600 mb-4">
                  Instant access to meeting links, no scrambling
                </p>
                <ul className="text-sm text-gray-500 text-left space-y-1">
                  <li>• Direct meeting access</li>
                  <li>• No link hunting</li>
                  <li>• Mobile friendly</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      {/*
        6 key features in grid layout
        Icons make features scannable
        Benefit-focused copy
      */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple, powerful features to keep you on track
            </p>
          </div>

          {/* Features Grid - 2 columns on mobile, 3 on desktop */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Google Calendar Sync
              </h3>
              <p className="text-gray-600">
                Automatic meeting updates keep your dashboard current
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <LinkIcon className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                One-Click Join
              </h3>
              <p className="text-gray-600">
                Instant access to meeting links without hunting
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <LayoutDashboard className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Meeting Dashboard
              </h3>
              <p className="text-gray-600">
                See all upcoming meetings in one clean view
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <RefreshCw className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Auto-Sync
              </h3>
              <p className="text-gray-600">
                Always up to date with automatic calendar syncing
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Secure & Private
              </h3>
              <p className="text-gray-600">
                Your data stays safe with enterprise-grade security
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <CreditCard className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Simple Pricing
              </h3>
              <p className="text-gray-600">
                $49/month, no hidden fees, cancel anytime
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      {/*
        Single plan - keeps decision simple
        Clear value proposition
        All features included
        Strong CTA
      */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              One plan, everything included, no hidden fees
            </p>
          </div>

          {/* Pricing Card - Centered */}
          <div className="max-w-lg mx-auto">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-xl border-2 border-blue-200 p-8">
              {/* Plan Name */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  SalesGuard Pro
                </h3>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold text-blue-600">$49</span>
                  <span className="text-xl text-gray-600">/month</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Everything included • No hidden fees • Cancel anytime
                </p>
              </div>

              {/* Features List */}
              <div className="space-y-3 mb-8">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">
                    Google Calendar integration
                  </span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Meeting dashboard</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">One-click join links</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Automatic sync</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Secure & private</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Email support</span>
                </div>
              </div>

              {/* CTA Button */}
              <Link
                href="/pricing"
                className="block w-full py-4 bg-blue-600 text-white rounded-lg font-semibold text-center hover:bg-blue-700 transition shadow-md hover:shadow-lg"
              >
                Get Started Now
              </Link>

              {/* Trust Signal */}
              <p className="text-center text-sm text-gray-600 mt-4">
                No credit card required for setup
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      {/*
        Addresses common objections/questions
        Builds trust and clarity
        SEO-friendly content
      */}
      <section id="faq" className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about SalesGuard
            </p>
          </div>

          {/* FAQ Items */}
          <div className="space-y-6">
            {/* FAQ 1 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                How does it work?
              </h3>
              <p className="text-gray-600">
                Connect your Google Calendar and we'll sync all your meetings
                to a clean dashboard with one-click join links. It's that
                simple!
              </p>
            </div>

            {/* FAQ 2 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                What do you monitor?
              </h3>
              <p className="text-gray-600">
                We sync your meeting times and links from Google Calendar to
                give you a unified dashboard. No recording, no intrusive
                monitoring - just convenient meeting management.
              </p>
            </div>

            {/* FAQ 3 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600">
                Yes! Cancel anytime with immediate effect. No questions asked,
                no hassle. We believe in earning your subscription every month.
              </p>
            </div>

            {/* FAQ 4 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Is my data safe?
              </h3>
              <p className="text-gray-600">
                Absolutely. We use industry-standard encryption and never sell
                your data. Your calendar information is stored securely and only
                used to provide the service.
              </p>
            </div>

            {/* FAQ 5 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                What platforms do you support?
              </h3>
              <p className="text-gray-600">
                Currently Google Meet via Google Calendar integration. More
                platforms and features are coming soon based on user feedback!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      {/*
        Last chance to convert
        Dark background creates urgency/importance
        Strong value restatement
      */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Never Miss a Meeting?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join busy professionals who trust SalesGuard to keep them on track
          </p>

          <Link
            href="/pricing"
            className="inline-block px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold text-lg hover:bg-blue-50 transition shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Get Started - $49/month
          </Link>

          <p className="mt-6 text-blue-200 text-sm">
            No credit card required for setup
          </p>
        </div>
      </section>

      {/* Footer */}
      {/*
        Standard footer with navigation and legal links
        Contact information for support
        Copyright notice
      */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Footer Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {/* Brand Column */}
            <div>
              <div className="text-2xl font-bold text-white mb-4">
                SalesGuard
              </div>
              <p className="text-sm">
                Never miss an important meeting with smart calendar integration
              </p>
            </div>

            {/* Links Column */}
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/" className="hover:text-white transition">
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="hover:text-white transition"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <a
                    href="#how-it-works"
                    className="hover:text-white transition"
                  >
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-white transition">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact Column */}
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="mailto:support@salesguardsentinel.com"
                    className="hover:text-white transition"
                  >
                    support@salesguardsentinel.com
                  </a>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="hover:text-white transition"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white transition">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>
              &copy; {new Date().getFullYear()} SalesGuard. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
    </>
  )
}
