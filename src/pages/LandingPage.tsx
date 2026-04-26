import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, addDoc, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useToast } from '../components/Toast';

const LandingPage: React.FC = () => {
  const { showToast } = useToast();
  const [showLearnMore, setShowLearnMore] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => { AOS.init({ duration: 600, once: true }); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      console.log('Submitting contact form:', formData);
      
      const messageRef = await addDoc(collection(db, 'contactMessages'), {
        ...formData,
        createdAt: Timestamp.now(),
        status: 'unread'
      });
      console.log('Contact message saved with ID:', messageRef.id);

      const adminsSnapshot = await getDocs(collection(db, 'admins'));
      console.log('Found admins:', adminsSnapshot.size);
      
      const notificationPromises = adminsSnapshot.docs.map(adminDoc => 
        addDoc(collection(db, 'notifications'), {
          type: 'contact_message',
          message: `New contact message from ${formData.name} (${formData.email})`,
          adminId: adminDoc.id,
          createdAt: Timestamp.now(),
          status: 'pending'
        })
      );
      
      await Promise.all(notificationPromises);
      console.log('Notifications created for', adminsSnapshot.size, 'admins');
      
      setSubmitSuccess(true);
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
      console.error('Error submitting message:', error);
      showToast('Failed to send message. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">Parivartan</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link to="/" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors duration-200 relative group">
                Home
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link to="/signin" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors duration-200 relative group">
                Partner Sign In
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
            <div data-aos="fade-up" data-aos-delay="0" className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100">
              <div className="bg-gradient-to-br from-emerald-100 to-emerald-200 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-3 text-gray-900">AI-Powered Classification</h4>
              <p className="text-gray-600 leading-relaxed">Advanced AI automatically identifies and classifies waste types with high accuracy.</p>
            </div>
            <div data-aos="fade-up" data-aos-delay="100" className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100">
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-3 text-gray-900">Earn Rewards</h4>
              <p className="text-gray-600 leading-relaxed">Get compensated for every successful waste pickup and contribute to environmental goals.</p>
            </div>
            <div data-aos="fade-up" data-aos-delay="200" className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100">
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
            {[
              { emoji: '🧴', label: 'Plastic Bottles', tag: 'Recyclable', from: 'from-blue-100', to: 'to-blue-200', text: 'text-blue-600' },
              { emoji: '📄', label: 'Paper Waste', tag: 'Biodegradable', from: 'from-yellow-100', to: 'to-yellow-200', text: 'text-yellow-700' },
              { emoji: '💻', label: 'Electronic Waste', tag: 'Hazardous', from: 'from-red-100', to: 'to-red-200', text: 'text-red-600' },
              { emoji: '👕', label: 'Clothes', tag: 'Donateable', from: 'from-purple-100', to: 'to-purple-200', text: 'text-purple-600' },
            ].map((item) => (
              <div key={item.label} className={`group bg-gradient-to-br ${item.from} ${item.to} rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 h-48 flex flex-col items-center justify-center gap-3`}>
                <span className="text-6xl group-hover:scale-110 transition-transform duration-300">{item.emoji}</span>
                <div className="text-center">
                  <h4 className={`font-semibold ${item.text}`}>{item.label}</h4>
                  <p className="text-sm text-gray-500">{item.tag}</p>
                </div>
              </div>
            ))}
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
              {submitSuccess && (
                <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
                  Message sent successfully! We'll get back to you soon.
                </div>
              )}
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    aria-label="Your Name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    placeholder="Your Email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    aria-label="Your Email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div>
                  <textarea
                    rows={4}
                    placeholder="Your Message"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    required
                    aria-label="Your Message"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-emerald-700 hover:to-blue-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Learn More Modal */}
      {showLearnMore && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-8">
              {/* Header */}
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-3xl font-bold text-gray-900">🌍 Our Mission</h3>
                  <p className="text-emerald-600 font-medium mt-1">Our Journey Towards a Cleaner India 🌱</p>
                  <p className="text-gray-500 text-sm italic mt-1">Turning waste into impact, one step at a time.</p>
                </div>
                <button onClick={() => setShowLearnMore(false)} className="text-gray-400 hover:text-gray-600 text-3xl font-light">×</button>
              </div>

              <div className="space-y-8">

                {/* Our Story */}
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-6 border-l-4 border-emerald-500">
                  <h4 className="text-xl font-bold text-gray-900 mb-3">📖 Our Story</h4>
                  <h5 className="text-lg font-semibold text-emerald-700 mb-3">Why We Built Parivartan</h5>
                  <p className="text-gray-600 leading-relaxed mb-3">
                    We observed a major waste management problem in our city, where large amounts of waste are generated daily but not properly recycled or segregated.
                  </p>
                  <p className="text-gray-600 leading-relaxed mb-3">
                    Through further research across cities like Jaipur and others, we discovered that this is not just a local issue but a nationwide concern.
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    In India, more than <span className="font-bold text-emerald-700">60 million tons of waste</span> is generated every year, and nearly <span className="font-bold text-emerald-700">60% of it can be recycled</span>. However, due to lack of awareness, accessibility, and proper systems, much of this recyclable waste goes unused. This inspired us to build Parivartan.
                  </p>
                </div>

                {/* Goals */}
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-4">🎯 Our Goals</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { icon: '♻️', text: 'Make recycling easy and accessible' },
                      { icon: '🌿', text: 'Encourage responsible waste habits' },
                      { icon: '🇮🇳', text: 'Build a cleaner and greener India' },
                    ].map((goal, i) => (
                      <div key={i} className="flex items-center space-x-3 bg-white border border-emerald-100 rounded-xl p-4 shadow-sm">
                        <span className="text-2xl">{goal.icon}</span>
                        <p className="text-gray-700 font-medium text-sm">{goal.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* How It Works */}
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-4">⚙️ How It Works</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { icon: '🔍', step: '1', title: 'Identify Waste', desc: 'Use AI to scan and identify your waste type instantly' },
                      { icon: '📅', step: '2', title: 'Schedule Pickup', desc: 'Choose a convenient time for recycler to collect' },
                      { icon: '🚛', step: '3', title: 'Recycler Collects', desc: 'Verified recycler arrives and picks up your waste' },
                      { icon: '🌟', step: '4', title: 'Earn EcoPoints', desc: 'Get rewarded for every pickup' },
                    ].map((item, i) => (
                      <div key={i} className="text-center bg-gradient-to-b from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
                        <div className="text-3xl mb-2">{item.icon}</div>
                        <div className="w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center mx-auto mb-2">{item.step}</div>
                        <h5 className="font-bold text-gray-900 text-sm mb-1">{item.title}</h5>
                        <p className="text-gray-500 text-xs leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Why Parivartan */}
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-4">⭐ Why Parivartan?</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { icon: '🤖', title: 'AI Waste Identification', desc: 'Smart camera identifies waste type in seconds' },
                      { icon: '🎁', title: 'EcoPoints Rewards', desc: 'Earn points and redeem exciting vouchers' },
                      { icon: '🤝', title: 'Community Driven', desc: 'Join thousands making a real difference' },
                      { icon: '📊', title: 'Real Impact', desc: 'Track your environmental contribution' },
                    ].map((item, i) => (
                      <div key={i} className="bg-white rounded-xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                        <div className="text-3xl mb-3">{item.icon}</div>
                        <h5 className="font-bold text-gray-900 text-sm mb-1">{item.title}</h5>
                        <p className="text-gray-500 text-xs">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scale of Problem */}
                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border-l-4 border-orange-400">
                  <h4 className="text-xl font-bold text-gray-900 mb-4">📊 The Scale of the Problem</h4>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {[
                      { value: '60M+', label: 'Tons of waste generated yearly', color: 'text-red-600' },
                      { value: '60%', label: 'Waste that can be recycled', color: 'text-orange-600' },
                      { value: '📈', label: 'Urban waste increasing rapidly', color: 'text-yellow-600' },
                    ].map((stat, i) => (
                      <div key={i} className="text-center bg-white rounded-xl p-4 shadow-sm">
                        <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                        <p className="text-gray-600 text-xs">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                    <p className="text-lg font-bold text-emerald-700">"Small actions create big impact ♻️"</p>
                  </div>
                </div>

                {/* How to Use the App */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border-l-4 border-emerald-500">
                  <h4 className="text-xl font-bold text-gray-900 mb-4">📘 How to Use the App?</h4>
                  <div className="space-y-3">
                    {[
                      { icon: '👤', step: '1', title: 'Sign Up', desc: 'Sign up and set your pickup location' },
                      { icon: '📸', step: '2', title: 'Identify Waste', desc: 'Identify waste using AI camera' },
                      { icon: '🔎', step: '3', title: 'Choose a Recycler', desc: 'Choose a recycler partner near you' },
                      { icon: '🏆', step: '4', title: 'Earn EcoPoints', desc: 'Complete pickups and earn EcoPoints' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start space-x-4 bg-white rounded-xl p-4 shadow-sm">
                        <div className="w-8 h-8 bg-emerald-600 text-white text-sm font-bold rounded-full flex items-center justify-center flex-shrink-0">{item.step}</div>
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-xl">{item.icon}</span>
                            <h5 className="font-bold text-gray-900">{item.title}</h5>
                          </div>
                          <p className="text-gray-500 text-sm">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* How Partners Use */}
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-6 border-l-4 border-indigo-500">
                  <h4 className="text-xl font-bold text-gray-900 mb-4">🤝 How Partners Use Parivartan?</h4>
                  <div className="space-y-3">
                    {[
                      { icon: '📝', step: '1', title: 'Register as a Partner', desc: 'Sign up and create your recycler profile' },
                      { icon: '📬', step: '2', title: 'Receive Pickup Requests', desc: 'Get assigned waste collection requests based on location and availability' },
                      { icon: '✅', step: '3', title: 'Confirm Availability', desc: 'Check pickup details and confirm user availability before collection' },
                      { icon: '🚛', step: '4', title: 'Collect and Process Waste', desc: 'Visit the location, collect waste, and process it responsibly' },
                      { icon: '📊', step: '5', title: 'Track Performance', desc: 'Track your performance and monitor your environmental impact through the dashboard' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start space-x-4 bg-white rounded-xl p-4 shadow-sm">
                        <div className="w-8 h-8 bg-indigo-600 text-white text-sm font-bold rounded-full flex items-center justify-center flex-shrink-0">{item.step}</div>
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-xl">{item.icon}</span>
                            <h5 className="font-bold text-gray-900">{item.title}</h5>
                          </div>
                          <p className="text-gray-500 text-sm">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Multi Language */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-200 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-3xl">🌐</span>
                    <div>
                      <h5 className="font-bold text-gray-900">Multi-Language Support</h5>
                      <p className="text-gray-500 text-sm">Use Parivartan in your own language — Hindi, Tamil, Bengali & more</p>
                    </div>
                  </div>
                  <span className="bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap">🚀 Coming Soon</span>
                </div>

                {/* CTA */}
                <div className="bg-gradient-to-r from-emerald-600 to-blue-600 rounded-2xl p-8 text-center text-white">
                  <div className="text-4xl mb-3">♻️</div>
                  <h4 className="text-2xl font-bold mb-2">Start Recycling Today</h4>
                  <p className="text-emerald-100 mb-6">Join Parivartan and be part of the change India needs.</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                      to="/signup"
                      onClick={() => setShowLearnMore(false)}
                      className="bg-white text-emerald-700 px-8 py-3 rounded-xl font-bold hover:bg-emerald-50 transition-all duration-300 shadow-lg"
                    >
                      Become a Partner
                    </Link>
                    <button
                      onClick={() => setShowLearnMore(false)}
                      className="border-2 border-white text-white px-8 py-3 rounded-xl font-bold hover:bg-white/10 transition-all duration-300"
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
          <Link to="/admin/login" className="text-gray-600 hover:text-gray-400 text-xs mt-2 inline-block transition-colors">Admin</Link>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;