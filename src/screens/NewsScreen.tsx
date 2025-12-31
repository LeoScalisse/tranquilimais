import React from 'react';

const NewsScreen: React.FC = () => (
  <div className="p-4 pb-28 bg-gray-50 h-full overflow-y-auto">
    <h1 className="text-3xl font-bold mb-6 text-gray-900">Notícias</h1>
    <div className="space-y-4">
      {[
        { title: 'Benefícios da meditação diária', emoji: '🧘', desc: 'Descubra como 10 minutos podem transformar seu dia.' },
        { title: 'Sono e saúde mental', emoji: '😴', desc: 'A importância de uma boa noite de sono.' },
        { title: 'Alimentação consciente', emoji: '🥗', desc: 'Como a alimentação afeta seu humor.' },
      ].map((news, idx) => (
        <div key={idx} className="bg-white p-4 rounded-xl shadow-sm">
          <span className="text-3xl">{news.emoji}</span>
          <h3 className="font-bold text-gray-800 mt-2">{news.title}</h3>
          <p className="text-sm text-gray-500">{news.desc}</p>
        </div>
      ))}
    </div>
  </div>
);

export default NewsScreen;
