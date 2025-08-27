import React from 'react';

export default function GeneratedComponent() {
  return (
<>
  <section className="py-12 bg-white">
  <div className="max-w-3xl mx-auto px-4">
    <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Vanliga Frågor</h2>
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
    <div className="border-b border-gray-200">
      <button className="w-full text-left py-4 px-6 hover:bg-gray-50 focus:outline-none focus:bg-gray-50" 
              onClick={() => {
                const content = document.getElementById('qa-0');
                const icon = document.getElementById('icon-0');
                if (content.classList.contains('hidden')) {
                  content.classList.remove('hidden');
                  icon.textContent = '-';
                } else {
                  content.classList.add('hidden');
                  icon.textContent = '+';
                }
              }}>
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">How do I get started?</h3>
          <span id="icon-0" className="text-2xl text-gray-500">+</span>
        </div>
      </button>
      <div id="qa-0" className="hidden px-6 pb-4">
        <p className="text-gray-600">Simply sign up for an account and follow our getting started guide.</p>
      </div>
    </div>
    <div className="border-b border-gray-200">
      <button className="w-full text-left py-4 px-6 hover:bg-gray-50 focus:outline-none focus:bg-gray-50" 
              onClick={() => {
                const content = document.getElementById('qa-1');
                const icon = document.getElementById('icon-1');
                if (content.classList.contains('hidden')) {
                  content.classList.remove('hidden');
                  icon.textContent = '-';
                } else {
                  content.classList.add('hidden');
                  icon.textContent = '+';
                }
              }}>
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">What payment methods do you accept?</h3>
          <span id="icon-1" className="text-2xl text-gray-500">+</span>
        </div>
      </button>
      <div id="qa-1" className="hidden px-6 pb-4">
        <p className="text-gray-600">We accept all major credit cards, PayPal, and bank transfers.</p>
      </div>
    </div>
    <div className="border-b border-gray-200">
      <button className="w-full text-left py-4 px-6 hover:bg-gray-50 focus:outline-none focus:bg-gray-50" 
              onClick={() => {
                const content = document.getElementById('qa-2');
                const icon = document.getElementById('icon-2');
                if (content.classList.contains('hidden')) {
                  content.classList.remove('hidden');
                  icon.textContent = '-';
                } else {
                  content.classList.add('hidden');
                  icon.textContent = '+';
                }
              }}>
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">Is there a free trial?</h3>
          <span id="icon-2" className="text-2xl text-gray-500">+</span>
        </div>
      </button>
      <div id="qa-2" className="hidden px-6 pb-4">
        <p className="text-gray-600">Yes, we offer a 14-day free trial with full access to all features.</p>
      </div>
    </div>
    <div className="border-b border-gray-200">
      <button className="w-full text-left py-4 px-6 hover:bg-gray-50 focus:outline-none focus:bg-gray-50" 
              onClick={() => {
                const content = document.getElementById('qa-3');
                const icon = document.getElementById('icon-3');
                if (content.classList.contains('hidden')) {
                  content.classList.remove('hidden');
                  icon.textContent = '-';
                } else {
                  content.classList.add('hidden');
                  icon.textContent = '+';
                }
              }}>
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">How can I contact support?</h3>
          <span id="icon-3" className="text-2xl text-gray-500">+</span>
        </div>
      </button>
      <div id="qa-3" className="hidden px-6 pb-4">
        <p className="text-gray-600">You can reach our support team via email, chat, or contact form.</p>
      </div>
    </div>
    </div>
  </div>
</section>
</>
  );
}