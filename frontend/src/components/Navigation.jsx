import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Menu, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'About', href: '/about' },
    { label: 'Features', href: '/features' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'Research', href: '/research' },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigate('/')}
          >
            <div className="w-10 h-10 rounded-medical shadow-medical group-hover:shadow-glow transition-all duration-300 group-hover:scale-105 overflow-hidden">
              <img
                src="/Logo.png"
                alt="MedAI Assist logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent leading-tight font-display">
                MedAI Assist
              </span>
              <span className="text-xs text-gray-500 font-medium -mt-1 font-body">
                AI Medical Diagnostics
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => item.href.startsWith('/') ? navigate(item.href) : window.location.href = item.href}
                className="text-gray-700 hover:text-teal-600 transition-colors duration-200 font-medium text-base font-body"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            {location.pathname !== '/login' && (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/login')}
                  className="text-gray-700 hover:text-teal-600 hover:bg-teal-50 font-medium font-body"
                >
                  Sign In
                </Button>
                <Button 
                  onClick={() => navigate('/login')}
                  className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-semibold px-6 py-2 rounded-medical shadow-medical hover:shadow-glow transition-all duration-200 hover:scale-105 font-body"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              className="p-2 text-gray-700 hover:text-cyan-600 hover:bg-cyan-50"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white/95 backdrop-blur-md">
            <div className="px-4 py-4 space-y-4">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    if (item.href.startsWith('/')) {
                      navigate(item.href);
                    } else {
                      window.location.href = item.href;
                    }
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-gray-700 hover:text-teal-600 transition-colors duration-200 font-medium py-2 w-full text-left font-body text-base"
                >
                  {item.label}
                </button>
              ))}
              
              {location.pathname !== '/login' && (
                <div className="pt-4 border-t border-gray-200 space-y-3">
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      navigate('/login');
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full justify-start text-gray-700 hover:text-teal-600 hover:bg-teal-50 font-medium font-body"
                  >
                    Sign In
                  </Button>
                  <Button 
                    onClick={() => {
                      navigate('/login');
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-semibold font-body"
                  >
                    Get Started
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
