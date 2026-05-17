import Link from 'next/link';
import { Utensils, Building2, Fuel, CarFront } from 'lucide-react';

export default function HomePage() {
  const generators = [
    {
      name: 'Restaurant & Dhaba',
      description: 'Generate POS thermal receipts for food joints.',
      icon: <Utensils className="w-8 h-8 text-orange-500" />,
      href: '/generator/restaurant',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      name: 'Hotel & Lodge',
      description: 'Create multi-format stay and check-out bills.',
      icon: <Building2 className="w-8 h-8 text-blue-500" />,
      href: '/generator/hotel',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      name: 'Fuel Station',
      description: 'Original-looking POS thermal fuel receipts.',
      icon: <Fuel className="w-8 h-8 text-green-500" />,
      href: '/generator/fuel',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      name: 'Travels & Taxi',
      description: 'Professional invoice for travel and cab services.',
      icon: <CarFront className="w-8 h-8 text-purple-500" />,
      href: '/generator/travels',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-16 px-4">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
          Billgeno
        </h1>
        <p className="text-lg text-slate-600 max-w-xl mx-auto">
          The elite machine to generate professional receipts instantly. Select a module below to get started.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        {generators.map((gen) => (
          <Link href={gen.href} key={gen.name}>
            <div className={`flex items-start p-6 rounded-2xl border-2 ${gen.borderColor} ${gen.bgColor} hover:shadow-md transition-all cursor-pointer h-full`}>
              <div className="bg-white p-3 rounded-xl shadow-sm mr-4">
                {gen.icon}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-1">{gen.name}</h2>
                <p className="text-slate-600 text-sm">{gen.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}