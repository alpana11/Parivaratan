import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const [showLearnMore, setShowLearnMore] = useState(false);
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">Parivartan</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link to="/" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors duration-200 relative group">
                Home
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link to="/signup" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors duration-200 relative group">
                Partner Sign-Up
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-blue-400/10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Join the <span className="bg-gradient-to-r from-emerald-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent animate-pulse">Waste Revolution</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Become a partner in Parivartan and help transform waste management through AI-powered solutions.
            Connect communities, reduce environmental impact, and earn rewards.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-emerald-700 hover:to-blue-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Become a Partner
            </Link>
            <button 
              onClick={() => setShowLearnMore(true)}
              className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transform hover:scale-105 transition-all duration-300"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">Why Partner With Us?</h3>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Our AI-powered platform makes waste management efficient, transparent, and rewarding.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100">
              <div className="bg-gradient-to-br from-emerald-100 to-emerald-200 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-3 text-gray-900">AI-Powered Classification</h4>
              <p className="text-gray-600 leading-relaxed">Advanced AI automatically identifies and classifies waste types with high accuracy.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100">
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-3 text-gray-900">Earn Rewards</h4>
              <p className="text-gray-600 leading-relaxed">Get compensated for every successful waste pickup and contribute to environmental goals.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100">
              <div className="bg-gradient-to-br from-indigo-100 to-indigo-200 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-3 text-gray-900">Track Impact</h4>
              <p className="text-gray-600 leading-relaxed">Monitor your environmental contribution with detailed analytics and reports.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How Parivartan Works Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">How Parivartan Works</h3>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Our AI-powered platform streamlines waste management through intelligent automation and community collaboration.
            </p>
          </div>

          <div className="relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-24 left-1/2 transform -translate-x-1/2 w-full max-w-4xl">
              <div className="h-0.5 bg-gradient-to-r from-emerald-400 via-blue-400 to-indigo-400 rounded-full"></div>
            </div>

            <div className="grid md:grid-cols-5 gap-8 relative z-10">
              {/* Step 1: Waste Detection */}
              <div className="text-center group">
                <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100 mx-auto max-w-xs">
                  <div className="bg-gradient-to-br from-emerald-100 to-emerald-200 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold mb-2 text-gray-900">1. Waste Detection</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">Community members or partners identify and report waste through our mobile app or web platform.</p>
                </div>
              </div>

              {/* Step 2: AI Classification */}
              <div className="text-center group">
                <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100 mx-auto max-w-xs">
                  <div className="bg-gradient-to-br from-blue-100 to-blue-200 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold mb-2 text-gray-900">2. AI Classification</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">Advanced AI analyzes photos to automatically classify waste type, quantity, and determine optimal processing method.</p>
                </div>
              </div>

              {/* Step 3: Partner Assignment */}
              <div className="text-center group">
                <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100 mx-auto max-w-xs">
                  <div className="bg-gradient-to-br from-indigo-100 to-indigo-200 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold mb-2 text-gray-900">3. Partner Assignment</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">System intelligently assigns the most suitable waste management partner based on location, expertise, and availability.</p>
                </div>
              </div>

              {/* Step 4: Collection & Processing */}
              <div className="text-center group">
                <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100 mx-auto max-w-xs">
                  <div className="bg-gradient-to-br from-purple-100 to-purple-200 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold mb-2 text-gray-900">4. Collection & Processing</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">Partners collect the waste and process it according to AI recommendations - recycling, composting, or safe disposal.</p>
                </div>
              </div>

              {/* Step 5: Rewards & Analytics */}
              <div className="text-center group">
                <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100 mx-auto max-w-xs">
                  <div className="bg-gradient-to-br from-emerald-100 to-emerald-200 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold mb-2 text-gray-900">5. Rewards & Analytics</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">Partners earn rewards while tracking environmental impact through comprehensive analytics and performance dashboards.</p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Technology Highlight */}
          <div className="mt-16 bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="text-center mb-8">
              <h4 className="text-2xl font-bold text-gray-900 mb-2">Powered by Advanced AI</h4>
              <p className="text-gray-600">Our machine learning models continuously improve accuracy and efficiency</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-gradient-to-br from-emerald-100 to-emerald-200 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-emerald-600 font-bold text-lg">95%</span>
                </div>
                <h5 className="font-semibold text-gray-900 mb-1">Classification Accuracy</h5>
                <p className="text-sm text-gray-600">Industry-leading waste identification precision</p>
              </div>
              <div className="text-center">
                <div className="bg-gradient-to-br from-blue-100 to-blue-200 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold text-lg">24/7</span>
                </div>
                <h5 className="font-semibold text-gray-900 mb-1">Real-time Processing</h5>
                <p className="text-sm text-gray-600">Instant waste analysis and partner matching</p>
              </div>
              <div className="text-center">
                <div className="bg-gradient-to-br from-indigo-100 to-indigo-200 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-indigo-600 font-bold text-lg">50+</span>
                </div>
                <h5 className="font-semibold text-gray-900 mb-1">Waste Categories</h5>
                <p className="text-sm text-gray-600">Comprehensive waste type recognition</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Waste Gallery Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">Waste We Handle</h3>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Our AI system can identify and classify various types of waste for efficient processing.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
              <img
                src="https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=300&h=200&fit=crop"
                alt="Plastic Bottles"
                className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-4 left-4 text-white">
                  <h4 className="font-semibold">Plastic Bottles</h4>
                  <p className="text-sm">Recyclable</p>
                </div>
              </div>
            </div>
            <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
              <img
                src="https://images.unsplash.com/photo-1586957969945-48e2bb3b45e8?w=300&h=200&fit=crop"
                alt="Paper Waste"
                className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-4 left-4 text-white">
                  <h4 className="font-semibold">Paper Waste</h4>
                  <p className="text-sm">Biodegradable</p>
                </div>
              </div>
            </div>
            <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
              <img
                src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop"
                alt="Electronic Waste"
                className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-4 left-4 text-white">
                  <h4 className="font-semibold">Electronic Waste</h4>
                  <p className="text-sm">Hazardous</p>
                </div>
              </div>
            </div>
            <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
              <img
                src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=300&h=200&fit=crop"
                alt="Organic Waste"
                className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-4 left-4 text-white">
                  <h4 className="font-semibold">Organic Waste</h4>
                  <p className="text-sm">Compostable</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h3>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Have questions about partnering with us? Get in touch and we'll be happy to help.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h4 className="text-2xl font-semibold text-gray-900 mb-6">Get In Touch</h4>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="bg-emerald-100 p-3 rounded-lg mr-4">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Email</p>
                    <p className="text-gray-600">partners@parivartan.com</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-lg mr-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Phone</p>
                    <p className="text-gray-600">+1 (555) 123-4567</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="bg-indigo-100 p-3 rounded-lg mr-4">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Address</p>
                    <p className="text-gray-600">123 Green Street, Eco City, EC 12345</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-2xl font-semibold text-gray-900 mb-6">Send us a Message</h4>
              <form className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="Your Name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    placeholder="Your Email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div>
                  <textarea
                    rows={4}
                    placeholder="Your Message"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-emerald-700 hover:to-blue-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Learn More Modal */}
      {showLearnMore && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-3xl font-bold text-gray-900">About Parivartan</h3>
                <button
                  onClick={() => setShowLearnMore(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-8">
                {/* Mission */}
                <div>
                  <h4 className="text-2xl font-semibold text-gray-900 mb-4">Our Mission</h4>
                  <p className="text-gray-600 leading-relaxed">
                    Parivartan is revolutionizing waste management by leveraging artificial intelligence to create
                    a sustainable, efficient, and rewarding ecosystem for waste collection and processing.
                    We believe that technology can transform how communities handle waste, making it easier,
                    more transparent, and beneficial for everyone involved.
                  </p>
                </div>

                {/* Technology */}
                <div>
                  <h4 className="text-2xl font-semibold text-gray-900 mb-4">AI-Powered Technology</h4>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="text-lg font-medium text-gray-900 mb-2">Smart Classification</h5>
                      <p className="text-gray-600">
                        Our advanced machine learning models can identify over 50 different waste categories
                        with 95% accuracy, automatically determining the best processing method for each item.
                      </p>
                    </div>
                    <div>
                      <h5 className="text-lg font-medium text-gray-900 mb-2">Real-time Processing</h5>
                      <p className="text-gray-600">
                        Instant analysis and partner matching ensures waste is collected and processed
                        within hours, not days, reducing environmental impact and health risks.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Benefits */}
                <div>
                  <h4 className="text-2xl font-semibold text-gray-900 mb-4">Benefits for Partners</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-emerald-50 p-4 rounded-lg">
                      <h5 className="font-semibold text-emerald-800 mb-2">Financial Rewards</h5>
                      <p className="text-sm text-emerald-700">
                        Earn competitive compensation for each successful waste collection and processing job.
                      </p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h5 className="font-semibold text-blue-800 mb-2">Flexible Schedule</h5>
                      <p className="text-sm text-blue-700">
                        Work on your own terms with our intelligent routing system that optimizes your time.
                      </p>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <h5 className="font-semibold text-indigo-800 mb-2">Environmental Impact</h5>
                      <p className="text-sm text-indigo-700">
                        Track your contribution to a cleaner planet with detailed analytics and recognition.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Environmental Impact */}
                <div>
                  <h4 className="text-2xl font-semibold text-gray-900 mb-4">Environmental Impact</h4>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    Every ton of waste properly managed through Parivartan prevents pollution, reduces
                    greenhouse gas emissions, and conserves valuable resources. Our platform helps:
                  </p>
                  <ul className="list-disc list-inside text-gray-600 space-y-2">
                    <li>Reduce landfill waste by 60% through proper recycling and composting</li>
                    <li>Decrease carbon emissions from inefficient waste collection</li>
                    <li>Conserve water and energy through optimized processing methods</li>
                    <li>Create jobs in the circular economy</li>
                  </ul>
                </div>

                {/* Future Vision */}
                <div>
                  <h4 className="text-2xl font-semibold text-gray-900 mb-4">Our Vision</h4>
                  <p className="text-gray-600 leading-relaxed">
                    We envision a world where waste is not a problem but an opportunity. Through continuous
                    innovation in AI and community engagement, Parivartan aims to create zero-waste cities
                    while building sustainable livelihoods for waste management professionals worldwide.
                  </p>
                </div>

                {/* Call to Action */}
                <div className="bg-gradient-to-r from-emerald-50 to-blue-50 p-6 rounded-xl">
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">Ready to Join the Revolution?</h4>
                  <p className="text-gray-600 mb-4">
                    Become a partner today and start making a difference while earning rewards.
                  </p>
                  <div className="flex gap-4">
                    <Link
                      to="/signup"
                      onClick={() => setShowLearnMore(false)}
                      className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-emerald-700 hover:to-blue-700 transition-all duration-300"
                    >
                      Become a Partner
                    </Link>
                    <button
                      onClick={() => setShowLearnMore(false)}
                      className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-300"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent mb-2">Parivartan</h1>
            <p className="text-gray-400">Transforming waste management for a sustainable future</p>
          </div>
          <p className="text-gray-400">&copy; 2025 Parivartan.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;